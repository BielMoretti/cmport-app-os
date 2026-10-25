import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { api, ApiError, renovarSessao, setAoExpirar, setAoRenovar, setToken } from '@/lib/api';
import { apagarItem, lerItem, salvarItem } from '@/lib/armazenamento';
import { MODO_DEMO } from '@/lib/config';
import type { Papel, RespostaDeLogin } from '@/lib/types';

const CHAVE_SESSAO = 'cmport_os_sessao';

interface Sessao {
  token: string;
  nome: string;
  role: Papel;
  /** login com a senha provisória da equipe: só a tela de criar a senha abre */
  trocarSenha: boolean;
}

interface AuthContextValue {
  usuario: Sessao | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  /** primeiro acesso: troca a senha provisória pela da pessoa e libera o app */
  criarSenha: (senhaNova: string, senhaAtual?: string) => Promise<void>;
  /** a senha digitada no login, enquanto a troca obrigatória não foi feita. Só na memória */
  senhaInicial: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function tokenValido(token: string): boolean {
  if (MODO_DEMO) return true;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function daResposta(res: RespostaDeLogin): Sessao {
  return { token: res.access_token, nome: res.nome, role: res.role, trocarSenha: res.precisa_trocar_senha === true };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);
  // nunca é gravada: serve só para a troca obrigatória não pedir de novo a senha recém-digitada
  const senhaDoLogin = useRef<string | null>(null);

  const guardar = useCallback((sessao: Sessao) => {
    setToken(sessao.token);
    setUsuario(sessao);
    void salvarItem(CHAVE_SESSAO, JSON.stringify(sessao)).catch(() => {});
  }, []);

  const logout = useCallback(async () => {
    senhaDoLogin.current = null;
    setToken(null);
    setUsuario(null);
    await apagarItem(CHAVE_SESSAO).catch(() => {});
  }, []);

  // token renovado (dura 8 horas; o servidor renova por até 30 dias): grava o novo
  useEffect(() => {
    setAoRenovar(nova => guardar(daResposta(nova)));
    return () => setAoRenovar(null);
  }, [guardar]);

  // restaura a sessão salva ao abrir o app
  useEffect(() => {
    (async () => {
      try {
        const salvo = await lerItem(CHAVE_SESSAO);
        const sessao = salvo ? (JSON.parse(salvo) as Sessao) : null;
        if (sessao && tokenValido(sessao.token)) {
          setToken(sessao.token);
          setUsuario(sessao);
        } else if (sessao) {
          // venceu: tenta trocar por um novo sem pedir senha, antes de mandar ao login
          setToken(sessao.token);
          if (!(await renovarSessao())) {
            setToken(null);
            await apagarItem(CHAVE_SESSAO);
          }
        }
      } catch {
        /* sessão corrompida — segue deslogado */
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  useEffect(() => {
    setAoExpirar(() => { void logout(); });
    return () => setAoExpirar(null);
  }, [logout]);

  const login = useCallback(async (email: string, senha: string) => {
    const limpo = email.trim().toLowerCase();
    if (!limpo || !senha) throw new ApiError(400, 'Preencha o e-mail e a senha.');
    const sessao: Sessao = MODO_DEMO
      // demonstração: qualquer e-mail e senha entram, sem rede
      ? { token: 'demo', nome: 'Técnico de demonstração', role: 'TECNICO', trocarSenha: false }
      : daResposta(await api<RespostaDeLogin>('/auth/login', { method: 'POST', body: { email: limpo, senha } }));
    senhaDoLogin.current = sessao.trocarSenha ? senha : null;
    guardar(sessao);
  }, [guardar]);

  const criarSenha = useCallback(async (senhaNova: string, senhaAtual?: string) => {
    const atual = senhaAtual ?? senhaDoLogin.current;
    if (!atual) throw new ApiError(400, 'Digite a senha provisória que você recebeu.');
    if (!MODO_DEMO) await api('/auth/trocar-senha', { method: 'POST', body: { senha_atual: atual, senha_nova: senhaNova } });
    senhaDoLogin.current = null;
    if (usuario) guardar({ ...usuario, trocarSenha: false });
  }, [usuario, guardar]);

  const senhaInicial = useCallback(() => senhaDoLogin.current, []);

  const valor = useMemo(() => ({ usuario, carregando, login, logout, criarSenha, senhaInicial }),
    [usuario, carregando, login, logout, criarSenha, senhaInicial]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return ctx;
}
