import { API_URL } from './config';
import type { RespostaDeLogin } from './types';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let token: string | null = null;
let aoExpirar: (() => void) | null = null;

export function setToken(novo: string | null) {
  token = novo;
}

/** Chamado quando o servidor recusa o token (401): a sessão acabou. */
export function setAoExpirar(fn: (() => void) | null) {
  aoExpirar = fn;
}

let aoRenovar: ((nova: RespostaDeLogin) => void) | null = null;

/** Chamado quando o token foi trocado por um novo, para quem guarda a sessão gravá-lo. */
export function setAoRenovar(fn: ((nova: RespostaDeLogin) => void) | null) {
  aoRenovar = fn;
}

const UMA_HORA_MS = 60 * 60 * 1000;

/** O token em uso vence dentro deste prazo? Token ilegível conta como "não sei". */
function venceEm(prazoMs: number): boolean {
  if (!token) return false;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(base64)) as { exp?: number };
    return typeof exp === 'number' && exp * 1000 - Date.now() < prazoMs;
  } catch {
    return false;
  }
}

let renovando: Promise<boolean> | null = null;

/**
 * Troca o token por um novo sem pedir senha (POST /auth/renovar). O token dura 8 horas e o
 * servidor renova por até 30 dias desde o login: o técnico não digita a senha todo dia.
 * Vários pedidos ao mesmo tempo compartilham uma renovação só.
 */
export function renovarSessao(): Promise<boolean> {
  renovando ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/renovar`, { method: 'POST', headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
      const nova = (await res.json().catch(() => null)) as RespostaDeLogin | null;
      if (!res.ok || !nova?.access_token) return false;
      token = nova.access_token;
      aoRenovar?.(nova);
      return true;
    } catch {
      return false;
    } finally {
      renovando = null;
    }
  })();
  return renovando;
}

function mensagemDeErro(status: number, corpo: unknown): string {
  const detail = (corpo as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const linhas = (detail as { loc?: unknown[]; msg?: string }[]).map(d => {
      const campo = String((d.loc ?? []).filter(p => p !== 'body').join('.'));
      const motivo = d.msg === 'Field required' ? 'é obrigatório' : (d.msg ?? 'não foi aceito');
      return campo ? `${campo}: ${motivo}` : motivo;
    });
    return `O servidor não aceitou os dados. ${linhas.join('; ')}.`;
  }
  if (status === 429) return 'Muitas tentativas. Espere 1 minuto e tente de novo.';
  if (status >= 500) return 'Servidor indisponível. Tente novamente.';
  return `Erro ${status}.`;
}

// redirect_slashes=False no backend — nunca mandar barra no final do path (dá 404)
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  return pedir<T>(path, init.method ?? 'GET', headers, init.body !== undefined ? JSON.stringify(init.body) : undefined);
}

/** Envia um arquivo (multipart), com campos de texto junto. */
export async function enviarArquivo<T>(path: string, arquivo: { uri: string; nome: string; tipo: string }, campos: Record<string, string>): Promise<T> {
  const form = new FormData();
  for (const [k, v] of Object.entries(campos)) form.append(k, v);
  if (typeof window !== 'undefined' && /^(blob|data):/.test(arquivo.uri)) {
    // navegador: o seletor e o redutor devolvem blob: ou data:
    form.append('arquivo', await (await fetch(arquivo.uri)).blob(), arquivo.nome);
  } else {
    // aparelho: o React Native lê o arquivo local a partir do uri
    form.append('arquivo', { uri: arquivo.uri, name: arquivo.nome, type: arquivo.tipo } as unknown as Blob);
  }
  // sem Content-Type: o fetch põe o multipart com o separador certo
  return pedir<T>(path, 'POST', {}, form);
}

async function pedir<T>(path: string, method: string, extra: Record<string, string>, body: BodyInit | undefined): Promise<T> {
  // falta menos de uma hora: renova antes, para o pedido não bater num token vencido
  if (token && path !== '/auth/login' && venceEm(UMA_HORA_MS)) await renovarSessao();
  const headers: Record<string, string> = { Accept: 'application/json', ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body });
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor.');
  }
  const corpo: unknown = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    // o login recusado também é 401, mas não há sessão para encerrar
    if (res.status === 401 && token && path !== '/auth/login') aoExpirar?.();
    throw new ApiError(res.status, mensagemDeErro(res.status, corpo));
  }
  return corpo as T;
}
