import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { lerItem, salvarItem } from '@/lib/armazenamento';
import { paletas, type Modo, type Paleta } from '@/lib/tema';

const CHAVE_TEMA = 'cmport_os_tema';

/** "auto" segue a hora: escuro das 18h às 6h, claro de dia (sol forte na rua). */
export type PreferenciaDeTema = 'auto' | Modo;

const modoDaHora = (d = new Date()): Modo => (d.getHours() >= 18 || d.getHours() < 6 ? 'escuro' : 'claro');

interface TemaContextValue {
  modo: Modo;
  cores: Paleta;
  preferencia: PreferenciaDeTema;
  escolher: (p: PreferenciaDeTema) => void;
}

const TemaContext = createContext<TemaContextValue | null>(null);

export function TemaProvider({ children }: { children: ReactNode }) {
  const [preferencia, setPreferencia] = useState<PreferenciaDeTema>('auto');
  const [modoDoRelogio, setModoDoRelogio] = useState<Modo>(() => modoDaHora());

  useEffect(() => {
    lerItem(CHAVE_TEMA)
      .then(salvo => { if (salvo === 'claro' || salvo === 'escuro' || salvo === 'auto') setPreferencia(salvo); })
      .catch(() => {});
  }, []);

  // no automático, confere a hora a cada minuto: às 18h o app escurece sozinho
  useEffect(() => {
    if (preferencia !== 'auto') return;
    const t = setInterval(() => setModoDoRelogio(modoDaHora()), 60_000);
    return () => clearInterval(t);
  }, [preferencia]);

  const escolher = useCallback((p: PreferenciaDeTema) => {
    setPreferencia(p);
    setModoDoRelogio(modoDaHora());
    salvarItem(CHAVE_TEMA, p).catch(() => {});
  }, []);

  const modo = preferencia === 'auto' ? modoDoRelogio : preferencia;
  const valor = useMemo(() => ({ modo, cores: paletas[modo], preferencia, escolher }), [modo, preferencia, escolher]);

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

export function useTema(): TemaContextValue {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error('useTema precisa estar dentro de <TemaProvider>.');
  return ctx;
}

/** Estilos que dependem do tema: passe uma função definida fora do componente. */
export function useEstilos<T>(criar: (cores: Paleta) => T): T {
  const { cores } = useTema();
  return useMemo(() => criar(cores), [criar, cores]);
}
