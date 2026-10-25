/** Ícones do app, em traço fino. Cor e tamanho vêm de quem usa. */
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface Props { cor: string; tamanho?: number }

export function GlifoLista({ cor, tamanho = 22 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={4} y={3} width={16} height={18} rx={3} />
      <Path d="M8 8h8M8 12h8M8 16h5" />
    </Svg>
  );
}

export function GlifoConta({ cor, tamanho = 22 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
    </Svg>
  );
}

export function GlifoLocal({ cor, tamanho = 16 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <Circle cx={12} cy={9.5} r={2.5} />
    </Svg>
  );
}

export function GlifoRelogio({ cor, tamanho = 16 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </Svg>
  );
}

export function GlifoVoltar({ cor, tamanho = 22 }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 5l-7 7 7 7" />
    </Svg>
  );
}
