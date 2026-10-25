/**
 * Sistema de design do app de OS, nas mesmas três camadas do app de moradores
 * (cmport-app/src/lib/tema.ts), só com os temas Escuro e Claro. Nenhuma tela escreve
 * valor cru (hex, raio, espaçamento).
 *
 *   1. primitivos   valores crus, sem significado            (não exportados)
 *   2. semânticos   o que cada valor significa, por tema
 *   3. componentes  medidas próprias de cada peça da interface
 */
import { Platform, type ViewStyle } from 'react-native';

// ───────────────────────────── 1. Primitivos ─────────────────────────────

const cor = {
  noite950: '#050A18',
  noite900: '#081127',
  noite700: '#0C2250',
  gelo50: '#F2F6FF',
  gelo300: '#9DB0D0',
  azul300: '#7DB0FF',
  azul450: '#2F7BFF',
  azul600: '#1F5FBF',
  ciano400: '#4FD8FF',
  ciano600: '#1592C4',
  nevoa100: '#E6EDF7',
  nevoa50: '#F7FAFF',
  marinho900: '#0E2240',
  aco650: '#56677F',
  aco50: '#F3F6FB',
  branco: '#FFFFFF',
  vermelho300: '#FF7A70',
  vermelho700: '#C4271B',
  ambar300: '#FFC94D',
  ambar700: '#9A6200',
  verde300: '#5FD6A0',
  verde700: '#1C6A48',
  cinza400: '#A8A8A3',
  cinza600: '#5F6670',
} as const;

const vidroCru = {
  claro: {
    fundo: 'rgba(255, 255, 255, 0.62)', forte: 'rgba(255, 255, 255, 0.82)', borda: 'rgba(255, 255, 255, 0.95)',
    sombra: '0px 8px 24px rgba(14, 34, 64, 0.10)', flutuante: 'rgba(247, 250, 255, 0.94)',
  },
  escuro: {
    fundo: 'rgba(150, 185, 255, 0.07)', forte: 'rgba(150, 185, 255, 0.13)', borda: 'rgba(170, 200, 255, 0.17)',
    sombra: '0px 12px 32px rgba(0, 4, 16, 0.45)', flutuante: 'rgba(10, 22, 48, 0.94)',
  },
} as const;

/** Espaçamento em base 4. Ex.: espaco[4] = 16. */
export const espaco = {
  0.5: 2, 1: 4, 1.5: 6, 2: 8, 2.5: 10, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48,
} as const;

export const raio = { pequeno: 10, medio: 18, grande: 28, pilula: 999 } as const;

export const corpo = {
  micro: 11, pequeno: 13, legenda: 14, base: 15, nome: 17, cabecalho: 20, titulo: 22, destaque: 30,
} as const;

export const fontes = {
  nome: 'PlusJakartaSans_700Bold',
  texto: 'PlusJakartaSans_400Regular',
  textoForte: 'PlusJakartaSans_600SemiBold',
} as const;

// ───────────────────────────── 2. Semânticos ─────────────────────────────

export type Modo = 'escuro' | 'claro';

export const temaEscuro = (modo: Modo): boolean => modo === 'escuro';

/** Cor de cada situação da OS: texto e fundo tingido. */
export interface CorDeSituacao { texto: string; fundo: string }

export interface Paleta {
  fundo: string;
  fundoAlto: string;
  superficie: string;
  superficieForte: string;
  vidroBorda: string;
  vidroSombra: string;
  /** fio de luz no topo dos painéis: é o que faz o painel ler como vidro */
  vidroFio: string;
  /** placa clara atrás da logo (o leão é cinza: precisa de fundo claro nos dois temas) */
  placa: string;
  flutuante: string;
  ciano: string;
  texto: string;
  textoSuave: string;
  linha: string;
  azul: string;
  azulSuave: string;
  sobreAzul: string;
  luz: string;
  brilho: string;
  erro: string;
  erroSuave: string;
  // situações da OS (sempre com rótulo escrito ao lado: a cor nunca fala sozinha)
  solicitada: CorDeSituacao;
  aberta: CorDeSituacao;
  andamento: CorDeSituacao;
  pausada: CorDeSituacao;
  concluida: CorDeSituacao;
  cancelada: CorDeSituacao;
}

export const paletas: Record<Modo, Paleta> = {
  claro: {
    fundo: cor.nevoa100,
    fundoAlto: cor.nevoa50,
    superficie: vidroCru.claro.fundo,
    superficieForte: vidroCru.claro.forte,
    vidroBorda: vidroCru.claro.borda,
    vidroSombra: vidroCru.claro.sombra,
    vidroFio: cor.branco,
    placa: cor.branco,
    flutuante: vidroCru.claro.flutuante,
    ciano: cor.ciano600,
    texto: cor.marinho900,
    textoSuave: cor.aco650,
    linha: 'rgba(14, 34, 64, 0.12)',
    azul: cor.azul600,
    azulSuave: 'rgba(31, 95, 191, 0.10)',
    sobreAzul: cor.branco,
    luz: cor.azul600,
    brilho: '0px 10px 28px rgba(31, 95, 191, 0.22)',
    erro: cor.vermelho700,
    erroSuave: 'rgba(196, 39, 27, 0.10)',
    solicitada: { texto: '#6D28D9', fundo: 'rgba(109, 40, 217, 0.10)' },
    aberta: { texto: cor.azul600, fundo: 'rgba(31, 95, 191, 0.10)' },
    andamento: { texto: cor.ambar700, fundo: 'rgba(154, 98, 0, 0.12)' },
    pausada: { texto: cor.cinza600, fundo: 'rgba(95, 102, 112, 0.12)' },
    concluida: { texto: cor.verde700, fundo: 'rgba(28, 106, 72, 0.12)' },
    cancelada: { texto: cor.vermelho700, fundo: 'rgba(196, 39, 27, 0.10)' },
  },
  escuro: {
    fundo: cor.noite950,
    fundoAlto: cor.noite700,
    superficie: vidroCru.escuro.fundo,
    superficieForte: vidroCru.escuro.forte,
    vidroBorda: vidroCru.escuro.borda,
    vidroSombra: vidroCru.escuro.sombra,
    vidroFio: 'rgba(200, 220, 255, 0.32)',
    placa: cor.gelo50,
    flutuante: vidroCru.escuro.flutuante,
    ciano: cor.ciano400,
    texto: cor.gelo50,
    textoSuave: cor.gelo300,
    linha: vidroCru.escuro.borda,
    azul: cor.azul300,
    azulSuave: 'rgba(77, 143, 247, 0.18)',
    sobreAzul: cor.noite950,
    luz: cor.azul450,
    brilho: '0px 10px 30px rgba(47, 123, 255, 0.36)',
    erro: cor.vermelho300,
    erroSuave: 'rgba(240, 86, 78, 0.16)',
    solicitada: { texto: '#C4B5FD', fundo: 'rgba(167, 139, 250, 0.18)' },
    aberta: { texto: cor.azul300, fundo: 'rgba(77, 143, 247, 0.18)' },
    andamento: { texto: cor.ambar300, fundo: 'rgba(255, 201, 77, 0.16)' },
    pausada: { texto: cor.cinza400, fundo: 'rgba(168, 168, 163, 0.16)' },
    concluida: { texto: cor.verde300, fundo: 'rgba(95, 214, 160, 0.16)' },
    cancelada: { texto: cor.vermelho300, fundo: 'rgba(240, 86, 78, 0.16)' },
  },
};

/** Painel de vidro (no navegador, com desfoque de verdade). */
export function vidro(c: Paleta, tipo: 'painel' | 'forte' | 'flutuante' = 'painel'): Pick<ViewStyle, 'backgroundColor' | 'borderWidth' | 'borderColor'> {
  const web = Platform.OS === 'web';
  const fundo = tipo === 'painel' ? c.superficie : tipo === 'forte' || web ? c.superficieForte : c.flutuante;
  return {
    backgroundColor: fundo, borderWidth: 1, borderColor: c.vidroBorda,
    ...(web ? ({ backdropFilter: `blur(${tipo === 'flutuante' ? 26 : 18}px) saturate(140%)` } as ViewStyle) : null),
  };
}

/** Degradê azul → ciano do botão principal. */
export function aceso(c: Paleta): Pick<ViewStyle, 'backgroundColor' | 'boxShadow'> {
  const degrade = `linear-gradient(120deg, ${c.luz} 0%, ${c.luz} 45%, ${c.ciano} 130%)`;
  return {
    backgroundColor: c.luz, boxShadow: c.brilho,
    ...((Platform.OS === 'web' ? { backgroundImage: degrade } : { experimental_backgroundImage: degrade }) as ViewStyle),
  };
}

// ───────────────────────────── 3. Componentes ────────────────────────────

export const componentes = {
  alvoDeToque: 44,
  botao: { altura: 54, raio: raio.pilula },
  campo: { raio: raio.medio, respiroH: espaco[4], respiroV: 14 },
  cartao: { raio: raio.grande, respiro: espaco[5] },
  chip: { altura: 36, raio: raio.pilula, respiroH: 14 },
  selo: { raio: raio.pilula, ponto: 8 },
  abas: { altura: 68, icone: 22, margem: espaco[4], reserva: 124, larguraMaxima: 480 },
  conteudo: { larguraMaxima: 560 },
  logoPlaca: { topo: 44, entrada: 112 },
  tela: { margem: espaco[4], larguraMaxFormulario: 440 },
} as const;
