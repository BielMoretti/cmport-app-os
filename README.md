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

## Em campo

- **Meu dia**: na aba A fazer, as OS de hoje (com as atrasadas e as em atendimento), os
  próximos dias e as sem data, com o progresso "Hoje: 2 de 5 feitas".
- **Como chegar**: Google Maps ou Waze até o ponto do condomínio (ou pelo endereço).
- **Fotos Antes / Depois**: o servidor carimba na imagem a OS, o momento, a data e o condomínio.
- **Histórico do local** e **Pedir OS aqui**: o que já foi feito no condomínio e uma OS nova que
  vai para o escritório aprovar ("Esperando aprovação").
- **QR da etiqueta**: a dash imprime as etiquetas (`cmportos://local/<id>`); a câmera do celular
  abre o app direto no local, ou "Ler QR do equipamento" na lista.
- **Avisos**: OS nova, passada para você, remarcada ou cancelada. Para funcionar falta criar o
  projeto no EAS (`eas init`, grava o `projectId` no app.json) e pôr o `google-services.json` do
  Firebase do app novo; sem isso o app pula o registro e o resto funciona normal.
- **Relato por voz**: pelo microfone do teclado do celular (a dica aparece no campo).

## Sem internet

Tudo funciona sem sinal: a lista e cada OS ficam guardadas no celular (`lib/cache.ts`) e as
ações entram numa fila (`lib/fila.ts`) com a hora em que aconteceram. A tela já mostra a OS como
vai ficar (`lib/regras.ts`, as mesmas regras do servidor) e avisa "N ações guardadas no celular".
A fila sobe sozinha, na ordem, quando o celular avisa que a conexão voltou ou quando o app volta
para a tela. Foto da fila fica nos documentos do app até subir e leva uma identidade, para o
servidor não gravar duas vezes. Ação recusada (ex.: o escritório cancelou a OS) aparece com o
motivo e os botões Tentar de novo / Descartar; as das outras OS continuam subindo. Sair da conta
com ação pendente avisa antes, porque apaga o que está no celular.

## Bateria

- GPS só no check-in e na conclusão: usa a última posição que o celular já sabe (até 2 min) e,
  se não houver, uma leitura na precisão "equilibrada", com no máximo 12 s. Nunca em segundo plano.
- Nada fica consultando o servidor: a lista atualiza ao abrir a aba ou puxar, a fila só tenta
  quando a conexão volta. Fotos reduzidas antes de subir. Tema escuro por padrão.

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

- Medir o gasto de bateria num Android real (1 h de uso) e comparar com o Auvo.
- Relatório de atendimento (e-mail aos condomínios) lendo também estas OS.
- Ícone e nome próprios na loja; build pelo EAS só quando for pedido.
