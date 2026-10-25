/**
 * O local (condomínio): o que já foi feito lá e pedir OS nova — pela OS aberta ou pelo QR code
 * colado no equipamento (cmportos://local/<id>). Precisa de sinal: o histórico é de todos os
 * técnicos e não fica guardado no celular.
 *
 *   GET  /locais/{id}                histórico (as mais novas primeiro)
 *   POST /locais/{id}/solicitacoes   {titulo, descricao, prioridade} → OS "solicitada"
 */
import { api, ApiError } from './api';
import { MODO_DEMO } from './config';
import { demo } from './demo';
import type { OrdemServico, Prioridade, Situacao } from './types';

export interface ItemDoHistorico {
  id: number;
  numero: string;
  titulo: string;
  tipo: string;
  situacao: Situacao;
  quando: string | null;
  tecnico: string | null;
  relato: string;
}

export interface HistoricoDoLocal {
  condominio_id: number;
  cliente: string;
  endereco: string;
  ordens: ItemDoHistorico[];
}

/** Lê o id do QR (cmportos://local/10) ou de um número digitado. */
export function idDoQr(texto: string): number | null {
  const achado = texto.trim().match(/^(?:cmportos:\/\/local\/)?(\d{1,9})$/i);
  return achado ? Number(achado[1]) : null;
}

export async function historicoDoLocal(condominioId: number): Promise<HistoricoDoLocal> {
  if (MODO_DEMO) {
    const daqui = demo.lista.filter(o => o.cliente.id === condominioId);
    if (!daqui.length) throw new ApiError(404, 'Nenhuma OS neste condomínio ainda.');
    return {
      condominio_id: condominioId, cliente: daqui[0].cliente.nome, endereco: daqui[0].endereco,
      ordens: daqui.map(o => ({ id: o.id, numero: o.numero, titulo: o.titulo, tipo: o.tipo, situacao: o.situacao,
        quando: o.concluida_em ?? o.agendada_para ?? o.criada_em, tecnico: o.tecnico?.nome ?? null, relato: o.relato })),
    };
  }
  return api<HistoricoDoLocal>(`/locais/${condominioId}`);
}

export async function pedirOS(condominioId: number, dados: { titulo: string; descricao: string; prioridade: Prioridade }): Promise<OrdemServico> {
  if (MODO_DEMO) throw new ApiError(400, 'No modo demonstração não dá para pedir OS nova.');
  return api<OrdemServico>(`/locais/${condominioId}/solicitacoes`, { method: 'POST', body: dados });
}
