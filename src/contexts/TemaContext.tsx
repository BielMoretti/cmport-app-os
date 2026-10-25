import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { lerItem, salvarItem } from '@/lib/armazenamento';
import { paletas, type Modo, type Paleta } from '@/lib/tema';

const CHAVE_TEMA = 'cmport_os_tema';

interface TemaContextValue {
  modo: Modo;
  cores: Paleta;
  alternar: () => void;
}

const TemaContext = createContext<TemaContextValue | null>(null);

export function TemaProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<Modo>('escuro');

  useEffect(() => {
    lerItem(CHAVE_TEMA)
      .then(salvo => { if (salvo === 'claro' || salvo === 'escuro') setModo(salvo); })
      .catch(() => {});
  }, []);

  const alternar = useCallback(() => {
    setModo(atual => {
      const novo: Modo = atual === 'claro' ? 'escuro' : 'claro';
      salvarItem(CHAVE_TEMA, novo).catch(() => {});
      return novo;
    });
  }, []);

  const valor = useMemo(() => ({ modo, cores: paletas[modo], alternar }), [modo, alternar]);

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
