# CMPort OS

App dos técnicos para atender as ordens de serviço da CMPort. Substitui o Auvo: a OS é aberta
na dash (página **OS CMPort**) e o técnico atende aqui.

Mesma base do app de moradores (`cmport-app`): Expo SDK 57, Expo Router, TypeScript, tema de
vidro (`src/lib/tema.ts`), sessão no SecureStore.

## Rodar

```bash
npm install
npm run web        # navegador, http://localhost:3001
npm run typecheck
```

Sem `EXPO_PUBLIC_API_URL` o app roda em **modo demonstração**: qualquer e-mail e senha entram e
as OS são exemplos de `src/lib/demo.ts`, só na memória.

Com a API de verdade: `EXPO_PUBLIC_API_URL=https://dash.cmport.com.br/api/tecnico/v1` (é o que
o `eas.json` já põe nos builds). A API é um serviço separado no `cmport-system`
(`app/main_tecnico.py`, contêiner `cmport_tecnico`), com usuário de banco que só enxerga as OS.

## O atendimento

1. **Cheguei no local**: check-in com hora e GPS (sem sinal, vai só a hora).
2. Checklist, fotos (reduzidas para ~300 KB antes de subir), pausar e retomar.
3. **Concluir**: exige checklist completo, pelo menos 1 foto, relato e assinatura do cliente.

O login é criado na dash (aba Técnicos) a partir de um funcionário, com senha provisória de 7
dias; no primeiro acesso o app pede para criar a senha. A sessão renova sozinha por até 30 dias.

## Onde fica cada coisa

| Arquivo | O quê |
|---|---|
| `src/lib/types.ts` | Formato da OS: o contrato com a API (`schemas/os_schema.py` no backend) |
| `src/lib/os.ts` | Leitura e ações da OS (demo ou API) |
| `src/lib/api.ts` | Pedidos à API, token e renovação da sessão |
| `src/lib/local.ts` | GPS do check-in e da conclusão |
| `src/lib/foto.ts` | Redução da foto antes de subir |
| `src/contexts/AuthContext.tsx` | Login, sessão e troca da senha provisória |
| `src/app/(abas)/index.tsx` | Lista "Minhas OS" com filtros |
| `src/app/os/[id]/index.tsx` | A OS e o atendimento |
| `src/app/os/[id]/concluir.tsx` | Relato e assinatura |
| `src/app/primeira-senha.tsx` | Criar a senha no primeiro acesso |

## Próximos passos

- Funcionar sem sinal (guardar as ações e enviar quando a internet voltar).
- Relatório de atendimento (e-mail aos condomínios) lendo também estas OS.
- Ícone e nome próprios na loja; build pelo EAS só quando for pedido.
