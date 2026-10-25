/**
 * Endereço da API dos técnicos. É o ÚNICO lugar do código que sabe o endereço.
 *
 * Enquanto o backend não existe, deixe EXPO_PUBLIC_API_URL vazio: o app roda em
 * MODO DEMONSTRAÇÃO (login aceita qualquer coisa e as OS são dados de exemplo em memória).
 *
 * Para apontar na API de verdade:
 *   - prévia no computador: arquivo .env.local com EXPO_PUBLIC_API_URL (modelo em .env.example);
 *   - APK/AAB: o valor de EXPO_PUBLIC_API_URL de cada build, em eas.json.
 */
const BRUTO = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');

/** Endereço da API, ou string vazia quando ninguém definiu (modo demonstração). */
export const API_URL = BRUTO;

/** Sem endereço de API = roda só com dados de exemplo, sem rede. */
export const MODO_DEMO = API_URL === '';

/**
 * A API devolve o link das fotos como caminho ("/api/tecnico/v1/fotos/…"); a tela precisa do
 * endereço inteiro. Arquivo local (foto da demonstração) e link completo passam direto.
 */
export function urlAbsoluta(caminho: string): string {
  if (MODO_DEMO || /^(https?|file|blob|data|content):/.test(caminho)) return caminho;
  return new URL(API_URL).origin + (caminho.startsWith('/') ? caminho : `/${caminho}`);
}
