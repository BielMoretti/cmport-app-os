import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { api, ApiError, renovarSessao, setAoExpirar, setAoRenovar, setToken } from '@/lib/api';
import { apagarItem, lerItem, salvarItem } from '@/lib/armazenamento';
import { desligarAvisos } from '@/lib/avisos';
import { MODO_DEMO } from '@/lib/config';
import { limparDoCelular } from '@/lib/os';
import type { Papel, RespostaDeLogin } from '@/lib/types';

const CHAVE_SESSAO = 'cmport_os_sessao';
// de quem são a fila e as OS guardadas no aparelho (outro técnico entrando = começa limpo)
const CHAVE_DONO = 'cmport_os_dono';
// a tela de permissões já passou neste aparelho (as permissões são do aparelho, não da conta)
const CHAVE_PERMISSOES = 'cmport_os_permissoes_vistas';

interface Sessao {
  token: string;
  nome: string;
  role: Papel;
  /** login com a senha provisória da equipe: só a tela de criar a senha abre */
  trocarSenha: boolean;
  /** versão dos termos que falta aceitar (quem decide é o servidor): até aceitar, só a tela dos termos abre */
  termosPendentes?: string | null;
}

interface AuthContextValue {
  usuario: Sessao | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  /** sair da conta: apaga a fila e as OS guardadas no aparelho (são de quem saiu) */
  logout: () => Promise<void>;
  /** primeiro acesso: troca a senha provisória pela da pessoa e libera o app */
  criarSenha: (senhaNova: string, senhaAtual?: string) => Promise<void>;
  /** a senha digitada no login, enquanto a troca obrigatória não foi feita. Só na memória */
  senhaInicial: () => string | null;
  /** grava no servidor o aceite da versão pendente dos termos e libera o app */
  aceitarTermos: () => Promise<void>;
  /** a tela de permissões do primeiro acesso já passou neste aparelho */
  permissoesVistas: boolean;
  concluirPermissoes: () => void;
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
  const [permissoesVistas, setPermissoesVistas] = useState(true);

  const guardar = useCallback((sessao: Sessao) => {
    setToken(sessao.token);
    setUsuario(sessao);
    void salvarItem(CHAVE_SESSAO, JSON.stringify(sessao)).catch(() => {});
  }, []);

  // a sessão que vence sozinha NÃO apaga a fila: o técnico entra de novo e ela sobe
  const encerrar = useCallback(async (apagarDados: boolean) => {
    // ainda com a sessão: o aparelho para de receber os avisos de quem está saindo
    if (apagarDados) await desligarAvisos();
    senhaDoLogin.current = null;
    setToken(null);
    setUsuario(null);
    await apagarItem(CHAVE_SESSAO).catch(() => {});
    if (apagarDados) await limparDoCelular().catch(() => {});
  }, []);
  const logout = useCallback(() => encerrar(true), [encerrar]);

  // token renovado (dura 8 horas; o servidor renova por até 30 dias): grava o novo
  useEffect(() => {
    setAoRenovar(nova => guardar(daResposta(nova)));
    return () => setAoRenovar(null);
  }, [guardar]);

  // restaura a sessão salva ao abrir o app
  useEffect(() => {
    (async () => {
      try {
        setPermissoesVistas((await lerItem(CHAVE_PERMISSOES).catch(() => null)) === 'sim');
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
    setAoExpirar(() => { void encerrar(false); });
    return () => setAoExpirar(null);
  }, [encerrar]);

  // termos: pergunta ao servidor a cada abertura (texto novo = aceite de novo). Sem sinal ou servidor
  // antigo (sem o campo): não trava ninguém
  const token = usuario?.token;
  useEffect(() => {
    if (!token || MODO_DEMO) return;
    let vivo = true;
    api<{ termos_pendentes?: string | null }>('/auth/me')
      .then(me => {
        if (!vivo || me.termos_pendentes === undefined) return;
        setUsuario(atual => (atual && (atual.termosPendentes ?? null) !== me.termos_pendentes ? { ...atual, termosPendentes: me.termos_pendentes } : atual));
      })
      .catch(() => {});
    return () => { vivo = false; };
  }, [token]);

  const login = useCallback(async (email: string, senha: string) => {
    const limpo = email.trim().toLowerCase();
    if (!limpo || !senha) throw new ApiError(400, 'Preencha o e-mail e a senha.');
    const sessao: Sessao = MODO_DEMO
      // demonstração: qualquer e-mail e senha entram, sem rede
      // demonstração: qualquer e-mail e senha entram, sem rede; os termos aparecem para conferir a tela
      ? { token: 'demo', nome: 'Técnico de demonstração', role: 'TECNICO', trocarSenha: false, termosPendentes: 'demo' }
      : daResposta(await api<RespostaDeLogin>('/auth/login', { method: 'POST', body: { email: limpo, senha } }));
    // outro técnico neste aparelho: a fila e as OS guardadas eram do anterior
    const dono = await lerItem(CHAVE_DONO).catch(() => null);
    if (dono && dono !== limpo) await limparDoCelular().catch(() => {});
    await salvarItem(CHAVE_DONO, limpo).catch(() => {});
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

  const aceitarTermos = useCallback(async () => {
    const versao = usuario?.termosPendentes;
    if (!usuario || !versao) return;
    if (!MODO_DEMO) {
      try {
        await api('/auth/aceitar-termos', { method: 'POST', body: { versao } });
      } catch (e) {
        // o texto mudou enquanto a tela estava aberta: mostra a versão nova
        if (e instanceof ApiError && e.status === 409) {
          const me = await api<{ termos_pendentes?: string | null }>('/auth/me');
          guardar({ ...usuario, termosPendentes: me.termos_pendentes ?? null });
        }
        throw e;
      }
    }
    guardar({ ...usuario, termosPendentes: null });
  }, [usuario, guardar]);

  const concluirPermissoes = useCallback(() => {
    setPermissoesVistas(true);
    void salvarItem(CHAVE_PERMISSOES, 'sim').catch(() => {});
  }, []);

  const valor = useMemo(() => ({ usuario, carregando, login, logout, criarSenha, senhaInicial, aceitarTermos, permissoesVistas, concluirPermissoes }),
    [usuario, carregando, login, logout, criarSenha, senhaInicial, aceitarTermos, permissoesVistas, concluirPermissoes]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return ctx;
}
