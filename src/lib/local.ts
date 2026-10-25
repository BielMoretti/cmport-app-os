/**
 * Onde o técnico está, para o check-in e a conclusão. Nunca trava o atendimento: sem
 * permissão ou sem sinal, a marcação vai só com a hora (lat/lng nulos) e a tela avisa.
 */
import * as Location from 'expo-location';

import type { Marcacao } from './types';

const LIMITE_MS = 12_000;

export async function marcarAqui(): Promise<Marcacao> {
  const em = new Date().toISOString();
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { em, lat: null, lng: null, precisao: null };
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      new Promise<null>(r => setTimeout(() => r(null), LIMITE_MS)),
    ]);
    if (!pos) return { em, lat: null, lng: null, precisao: null };
    return {
      em,
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      precisao: pos.coords.accuracy != null ? Math.round(pos.coords.accuracy) : null,
    };
  } catch {
    return { em, lat: null, lng: null, precisao: null };
  }
}

/** "a 12 m" / "sem localização" — para mostrar na tela. */
export function descreverMarcacao(m: Marcacao): string {
  const hora = new Date(m.em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (m.lat == null) return `${hora} · sem localização`;
  return m.precisao != null ? `${hora} · GPS (±${m.precisao} m)` : `${hora} · GPS`;
}
