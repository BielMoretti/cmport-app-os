/**
 * Ordens de serviço: leitura e as ações do técnico. No modo demonstração muda os dados
 * de exemplo em memória; com a API definida, chama o backend próprio:
 *
 *   GET   /os                         lista do técnico logado
 *   GET   /os/{id}                    uma OS
 *   POST  /os/{id}/checkin            { lat, lng, precisao }       aberta → andamento
 *   POST  /os/{id}/pausar                                          andamento → pausada
 *   POST  /os/{id}/retomar                                         pausada → andamento
 *   PATCH /os/{id}/checklist/{item}   { feito }
 *   POST  /os/{id}/fotos              multipart: arquivo + legenda
 *   POST  /os/{id}/concluir           { relato, assinatura, lat, lng, precisao }
 *
 * Toda ação devolve a OS inteira atualizada: a tela troca a que tem pela que voltou.
 */
import { api, ApiError, enviarArquivo } from './api';
import { MODO_DEMO } from './config';
import { demo } from './demo';
import type { Marcacao, OrdemServico, Situacao } from './types';

const espera = (ms: number) => new Promise(r => setTimeout(r, ms));

function daDemo(id: number): OrdemServico {
  const achada = demo.lista.find(o => o.id === id);
  if (!achada) throw new ApiError(404, 'OS não encontrada.');
  return achada;
}

/** Na demonstração, a mesma regra de caminho que o backend vai aplicar. */
function exigir(os: OrdemServico, de: Situacao[], acao: string) {
  if (!de.includes(os.situacao)) throw new ApiError(409, `Não dá para ${acao} uma OS ${os.situacao}.`);
}

export async function listarOS(): Promise<OrdemServico[]> {
  if (MODO_DEMO) { await espera(250); return structuredClone(demo.lista); }
  return api<OrdemServico[]>('/os');
}

export async function buscarOS(id: number): Promise<OrdemServico> {
  if (MODO_DEMO) { await espera(150); return structuredClone(daDemo(id)); }
  return api<OrdemServico>(`/os/${id}`);
}

export async function fazerCheckin(id: number, aqui: Marcacao): Promise<OrdemServico> {
  if (MODO_DEMO) {
    await espera(300);
    const os = daDemo(id);
    exigir(os, ['aberta'], 'fazer check-in em');
    Object.assign(os, { situacao: 'andamento', checkin: aqui, iniciada_em: aqui.em });
    return structuredClone(os);
  }
  return api<OrdemServico>(`/os/${id}/checkin`, { method: 'POST', body: { lat: aqui.lat, lng: aqui.lng, precisao: aqui.precisao } });
}

export async function pausar(id: number): Promise<OrdemServico> {
  if (MODO_DEMO) {
    await espera(200);
    const os = daDemo(id);
    exigir(os, ['andamento'], 'pausar');
    os.situacao = 'pausada';
    return structuredClone(os);
  }
  return api<OrdemServico>(`/os/${id}/pausar`, { method: 'POST' });
}

export async function retomar(id: number): Promise<OrdemServico> {
  if (MODO_DEMO) {
    await espera(200);
    const os = daDemo(id);
    exigir(os, ['pausada'], 'retomar');
    os.situacao = 'andamento';
    return structuredClone(os);
  }
  return api<OrdemServico>(`/os/${id}/retomar`, { method: 'POST' });
}

export async function marcarItem(id: number, item: number, feito: boolean): Promise<OrdemServico> {
  if (MODO_DEMO) {
    const os = daDemo(id);
    exigir(os, ['andamento'], 'mexer no checklist de');
    const achado = os.checklist.find(i => i.id === item);
    if (achado) achado.feito = feito;
    return structuredClone(os);
  }
  return api<OrdemServico>(`/os/${id}/checklist/${item}`, { method: 'PATCH', body: { feito } });
}

export async function anexarFoto(id: number, arquivo: { uri: string; nome: string; tipo: string }, legenda: string): Promise<OrdemServico> {
  if (MODO_DEMO) {
    await espera(300);
    const os = daDemo(id);
    exigir(os, ['andamento', 'pausada'], 'anexar foto em');
    os.fotos.push({ id: demo.proximaFoto++, url: arquivo.uri, legenda, tirada_em: new Date().toISOString() });
    return structuredClone(os);
  }
  return enviarArquivo<OrdemServico>(`/os/${id}/fotos`, arquivo, { legenda });
}

export async function concluir(
  id: number,
  dados: { relato: string; assinatura: { nome: string; traco: string }; aqui: Marcacao },
): Promise<OrdemServico> {
  if (MODO_DEMO) {
    await espera(400);
    const os = daDemo(id);
    exigir(os, ['andamento'], 'concluir');
    Object.assign(os, {
      situacao: 'concluida', conclusao: dados.aqui, concluida_em: dados.aqui.em, relato: dados.relato,
      assinatura: { ...dados.assinatura, em: dados.aqui.em },
    });
    return structuredClone(os);
  }
  return api<OrdemServico>(`/os/${id}/concluir`, {
    method: 'POST',
    body: { relato: dados.relato, assinatura: dados.assinatura, lat: dados.aqui.lat, lng: dados.aqui.lng, precisao: dados.aqui.precisao },
  });
}

/** O que falta para poder concluir (vazio = pode). */
export function pendenciasParaConcluir(os: OrdemServico): string[] {
  const falta: string[] = [];
  const abertos = os.checklist.filter(i => !i.feito).length;
  if (abertos > 0) falta.push(abertos === 1 ? '1 item do checklist' : `${abertos} itens do checklist`);
  if (os.fotos.length === 0) falta.push('pelo menos 1 foto');
  return falta;
}

/** Ordem da lista: o que pede ação primeiro, concluídas e canceladas no fim. */
const PESO: Record<Situacao, number> = { andamento: 0, aberta: 1, pausada: 2, concluida: 3, cancelada: 4 };

export function ordenarOS(lista: OrdemServico[]): OrdemServico[] {
  return [...lista].sort((a, b) => {
    const p = PESO[a.situacao] - PESO[b.situacao];
    if (p !== 0) return p;
    return (a.agendada_para ?? a.criada_em).localeCompare(b.agendada_para ?? b.criada_em);
  });
}

/** "Hoje, 09:00", "Amanhã, 14:30" ou "12/11, 10:00". */
export function quando(iso: string | null): string {
  if (!iso) return 'Sem data';
  const d = new Date(iso);
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dia = new Date(d); dia.setHours(0, 0, 0, 0);
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const diff = Math.round((dia.getTime() - hoje.getTime()) / 86_400_000);
  if (diff === 0) return `Hoje, ${hora}`;
  if (diff === 1) return `Amanhã, ${hora}`;
  if (diff === -1) return `Ontem, ${hora}`;
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}, ${hora}`;
}
