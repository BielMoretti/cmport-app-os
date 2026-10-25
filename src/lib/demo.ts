/**
 * Dados de exemplo do MODO DEMONSTRAÇÃO (sem EXPO_PUBLIC_API_URL). Nomes inventados:
 * nenhum condomínio ou pessoa real. Vivem só na memória: fechar o app volta tudo ao início.
 * Some quando o backend próprio existir.
 */
import type { ItemDoChecklist, OrdemServico } from './types';

function hoje(hora: number, minuto = 0, diasDepois = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + diasDepois);
  d.setHours(hora, minuto, 0, 0);
  return d.toISOString();
}

let proximoItem = 1;
function checklist(...textos: string[]): ItemDoChecklist[] {
  return textos.map(texto => ({ id: proximoItem++, texto, feito: false }));
}

const TECNICO = { id: 1, nome: 'Técnico de demonstração' };
const SEM_ATENDIMENTO = { checkin: null, conclusao: null, fotos: [], assinatura: null, relato: '' };

const INICIAIS: OrdemServico[] = [
  {
    id: 1, numero: 'OS-2026-0001', titulo: 'Câmera da garagem sem imagem',
    descricao: 'Síndico avisou que a câmera da rampa da garagem está sem imagem desde ontem à noite.',
    tipo: 'Manutenção', situacao: 'aberta', prioridade: 'urgente',
    cliente: { id: 10, nome: 'Condomínio Exemplo Jardins' }, endereco: 'Rua das Flores, 120 — São Paulo/SP',
    tecnico: TECNICO, criada_em: hoje(7, 40), agendada_para: hoje(9), iniciada_em: null, concluida_em: null,
    ...SEM_ATENDIMENTO,
    checklist: checklist('Conferir cabo e conector', 'Conferir fonte de energia', 'Testar imagem no app', 'Mostrar ao síndico'),
  },
  {
    id: 2, numero: 'OS-2026-0002', titulo: 'Troca do interfone do bloco B',
    descricao: 'Interfone do bloco B chiando. Levar aparelho reserva.',
    tipo: 'Manutenção', situacao: 'andamento', prioridade: 'alta',
    cliente: { id: 11, nome: 'Residencial Modelo' }, endereco: 'Av. Central, 900 — São Paulo/SP',
    tecnico: TECNICO, criada_em: hoje(8, 5, -1), agendada_para: hoje(10, 30), iniciada_em: hoje(10, 42), concluida_em: null,
    ...SEM_ATENDIMENTO,
    checkin: { em: hoje(10, 42), lat: null, lng: null, precisao: null },
    checklist: checklist('Retirar aparelho antigo', 'Instalar aparelho novo', 'Testar chamada com a portaria'),
  },
  {
    id: 3, numero: 'OS-2026-0003', titulo: 'Instalação de 4 câmeras no poste novo',
    descricao: 'Poste já instalado pela obra. Instalar e apontar 4 câmeras e testar no app.',
    tipo: 'Instalação', situacao: 'aberta', prioridade: 'normal',
    cliente: { id: 12, nome: 'Condomínio Teste das Palmeiras' }, endereco: 'Rua A, 45 — Guarulhos/SP',
    tecnico: TECNICO, criada_em: hoje(16, 0, -2), agendada_para: hoje(14), iniciada_em: null, concluida_em: null,
    ...SEM_ATENDIMENTO,
    checklist: checklist('Fixar as 4 câmeras', 'Passar cabos', 'Apontar cada câmera', 'Conferir as 4 no app'),
  },
  {
    id: 4, numero: 'OS-2026-0004', titulo: 'Vistoria preventiva mensal',
    descricao: 'Conferir todas as câmeras, fonte e nobreak.',
    tipo: 'Vistoria', situacao: 'pausada', prioridade: 'baixa',
    cliente: { id: 10, nome: 'Condomínio Exemplo Jardins' }, endereco: 'Rua das Flores, 120 — São Paulo/SP',
    tecnico: TECNICO, criada_em: hoje(9, 0, -3), agendada_para: hoje(16), iniciada_em: hoje(15, 10, -1), concluida_em: null,
    ...SEM_ATENDIMENTO,
    checkin: { em: hoje(15, 10, -1), lat: null, lng: null, precisao: null },
    checklist: checklist('Câmeras', 'Fonte', 'Nobreak'),
  },
  {
    id: 5, numero: 'OS-2026-0005', titulo: 'Ajuste de ângulo da câmera da portaria',
    descricao: 'Câmera da portaria pegando muito céu. Abaixar.',
    tipo: 'Manutenção', situacao: 'concluida', prioridade: 'normal',
    cliente: { id: 11, nome: 'Residencial Modelo' }, endereco: 'Av. Central, 900 — São Paulo/SP',
    tecnico: TECNICO, criada_em: hoje(10, 0, -4), agendada_para: hoje(11, 0, -1), iniciada_em: hoje(11, 5, -1), concluida_em: hoje(11, 40, -1),
    checkin: { em: hoje(11, 5, -1), lat: null, lng: null, precisao: null },
    conclusao: { em: hoje(11, 40, -1), lat: null, lng: null, precisao: null },
    checklist: checklist('Ajustar ângulo', 'Conferir no app').map(i => ({ ...i, feito: true })),
    fotos: [],
    assinatura: { nome: 'Zelador (exemplo)', traco: 'M30 110 C60 40 90 40 110 100 S170 140 200 70 S260 60 290 100', em: hoje(11, 40, -1) },
    relato: 'Câmera abaixada uns 15 graus. Portaria inteira no quadro.',
  },
];

/** A "base" da demonstração: uma cópia que as ações do técnico vão mudando. */
export const demo = {
  lista: structuredClone(INICIAIS) as OrdemServico[],
  proximaFoto: 1,
};
