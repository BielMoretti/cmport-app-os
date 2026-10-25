/**
 * Ordens de serviço no app — sempre "do celular primeiro", para funcionar sem internet:
 *
 *   ler    tenta o servidor e guarda (lib/cache.ts); sem sinal, usa o que está guardado. Por cima
 *          vão as ações ainda na fila, para a tela mostrar a OS como ela vai ficar.
 *   agir   confere a regra aqui mesmo (lib/regras.ts), põe a ação na fila (lib/fila.ts) com a
 *          hora em que aconteceu e tenta subir. A tela recebe a OS já atualizada na hora.
 *
 * Rotas do backend próprio (serviço dos técnicos, /api/tecnico/v1):
 *   GET   /os · GET /os/{id}
 *   POST  /os/{id}/checkin {em, lat, lng, precisao} · /pausar {em} · /retomar {em}
 *   PATCH /os/{id}/checklist/{item} {feito, em}
 *   POST  /os/{id}/fotos (multipart: arquivo, legenda, em, id_cliente)
 *   POST  /os/{id}/concluir {em, relato, assinatura, lat, lng, precisao}
 *
 * No MODO_DEMO não há servidor nem fila: as mesmas regras mudam os dados de exemplo.
 */
import { api, ApiError } from './api';
import { guardarFotoDaFila } from './arquivoDaFila';
import { apagarCache, guardarLista, guardarOS, listaGuardada, osGuardada } from './cache';
import { MODO_DEMO } from './config';
import { demo } from './demo';
import { apagarFila, carregarFila, enfileirar, itensDaFila, sincronizar } from './fila';
import { aplicar, novaIdentidade, type Acao } from './regras';
import type { Marcacao, OrdemServico, Situacao } from './types';

export { pendenciasParaConcluir } from './regras';

const espera = (ms: number) => new Promise(r => setTimeout(r, ms));

/** As ações ainda na fila, aplicadas por cima da versão que veio do servidor. */
function comPendentes(os: OrdemServico): OrdemServico {
  let atual = os;
  for (const item of itensDaFila()) {
    if (item.acao.os !== os.id) continue;
    try { atual = aplicar(atual, item.acao); } catch { /* recusada: a tela mostra o erro da fila */ }
  }
  return atual;
}

export interface Lista {
  lista: OrdemServico[];
  /** veio do que estava guardado no celular (sem sinal); com a hora da última atualização */
  semSinalDesde: string | null;
}

export async function listarOS(): Promise<Lista> {
  if (MODO_DEMO) { await espera(250); return { lista: structuredClone(demo.lista), semSinalDesde: null }; }
  await carregarFila();
  try {
    const lista = await api<OrdemServico[]>('/os');
    await guardarLista(lista);
    return { lista: lista.map(comPendentes), semSinalDesde: null };
  } catch (e) {
    if (!(e instanceof ApiError) || e.status !== 0) throw e;
    const guardada = await listaGuardada();
    if (!guardada.em) throw new ApiError(0, 'Sem sinal. A lista aparece aqui depois da primeira vez com internet.');
    return { lista: guardada.lista.map(comPendentes), semSinalDesde: guardada.em };
  }
}

export async function buscarOS(id: number): Promise<OrdemServico> {
  if (MODO_DEMO) { await espera(150); return structuredClone(daDemo(id)); }
  await carregarFila();
  try {
    const os = await api<OrdemServico>(`/os/${id}`);
    await guardarOS(os);
    return comPendentes(os);
  } catch (e) {
    if (!(e instanceof ApiError) || e.status !== 0) throw e;
    const guardada = await osGuardada(id);
    if (!guardada) throw new ApiError(0, 'Sem sinal, e esta OS ainda não foi aberta neste celular.');
    return comPendentes(guardada);
  }
}

/** A OS como está no celular agora (sem ir ao servidor): para a tela acompanhar a fila subindo. */
export async function osNoCelular(id: number): Promise<OrdemServico | null> {
  if (MODO_DEMO) return structuredClone(daDemo(id));
  const guardada = await osGuardada(id);
  return guardada ? comPendentes(guardada) : null;
}

function daDemo(id: number): OrdemServico {
  const achada = demo.lista.find(o => o.id === id);
  if (!achada) throw new ApiError(404, 'OS não encontrada.');
  return achada;
}

/** Aplica a regra agora, põe na fila e tenta subir. Fora da ordem, o erro aparece na hora. */
async function agir(acao: Acao): Promise<OrdemServico> {
  if (MODO_DEMO) {
    await espera(200);
    const nova = aplicar(daDemo(acao.os), acao);
    demo.lista = demo.lista.map(o => (o.id === nova.id ? nova : o));
    return structuredClone(nova);
  }
  await carregarFila();
  const base = (await osNoCelular(acao.os)) ?? (await buscarOS(acao.os));
  const nova = aplicar(base, acao);
  await enfileirar(acao);
  void sincronizar();
  return nova;
}

const agora = () => new Date().toISOString();

export function fazerCheckin(id: number, aqui: Marcacao): Promise<OrdemServico> {
  return agir({ tipo: 'checkin', os: id, em: aqui.em, lat: aqui.lat, lng: aqui.lng, precisao: aqui.precisao });
}

export function pausar(id: number): Promise<OrdemServico> {
  return agir({ tipo: 'pausar', os: id, em: agora() });
}

export function retomar(id: number): Promise<OrdemServico> {
  return agir({ tipo: 'retomar', os: id, em: agora() });
}

export function marcarItem(id: number, item: number, feito: boolean): Promise<OrdemServico> {
  return agir({ tipo: 'item', os: id, item, feito, em: agora() });
}

export async function anexarFoto(id: number, arquivo: { uri: string; nome: string; tipo: string }, legenda: string): Promise<OrdemServico> {
  const idCliente = novaIdentidade('f');
  // a foto espera sinal num lugar que sobrevive ao app fechar
  const uri = MODO_DEMO ? arquivo.uri : await guardarFotoDaFila(arquivo.uri, idCliente);
  return agir({ tipo: 'foto', os: id, em: agora(), idCliente, uri, nome: arquivo.nome, tipoArquivo: arquivo.tipo, legenda });
}

export function concluir(
  id: number,
  dados: { relato: string; assinatura: { nome: string; traco: string }; aqui: Marcacao },
): Promise<OrdemServico> {
  return agir({
    tipo: 'concluir', os: id, em: dados.aqui.em, relato: dados.relato, assinatura: dados.assinatura,
    lat: dados.aqui.lat, lng: dados.aqui.lng, precisao: dados.aqui.precisao,
  });
}

/** Ao sair da conta: o que está no celular é do técnico que saiu. */
export async function limparDoCelular(): Promise<void> {
  await apagarFila();
  await apagarCache();
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
