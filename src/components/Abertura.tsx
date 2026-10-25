/**
 * Abertura do app: o leão aparece no meio enquanto o app se prepara e, quando fica pronto, sobe
 * e some, deixando a primeira tela por baixo. Só na primeira abertura de cada vez que o app liga.
 */
import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet } from 'react-native';

import { useMenosMovimento } from '@/components/movimento';
import { LogoPlaca } from '@/components/ui';
import { useTema } from '@/contexts/TemaContext';
import { componentes } from '@/lib/tema';

const NATIVO = Platform.OS !== 'web';
const SAIDA = Easing.bezier(0.23, 1, 0.32, 1);

export default function Abertura({ pronto }: { pronto: boolean }) {
  const { cores } = useTema();
  const menos = useMenosMovimento();
  const [entrada] = useState(() => new Animated.Value(0));
  const [saida] = useState(() => new Animated.Value(0));
  const [acabou, setAcabou] = useState(false);

  useEffect(() => {
    if (menos) { entrada.setValue(1); return; }
    Animated.spring(entrada, { toValue: 1, damping: 14, stiffness: 160, mass: 1, useNativeDriver: NATIVO }).start();
  }, [entrada, menos]);

  useEffect(() => {
    if (!pronto) return;
    // espera o leão terminar de aparecer antes de sair, para não piscar quando o app abre rápido
    const anim = Animated.timing(saida, { toValue: 1, duration: menos ? 150 : 520, delay: menos ? 0 : 450, easing: SAIDA, useNativeDriver: NATIVO });
    anim.start(({ finished }) => { if (finished) setAcabou(true); });
    return () => anim.stop();
  }, [pronto, saida, menos]);

  if (acabou) return null;
  return (
    <Animated.View
      pointerEvents={pronto ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFill, {
        backgroundColor: cores.fundo, alignItems: 'center', justifyContent: 'center',
        opacity: saida.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
      }]}
      accessibilityLabel="Abrindo o CMPort OS"
    >
      <Animated.View
        style={{
          opacity: entrada,
          transform: [
            { translateY: saida.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) },
            { scale: Animated.multiply(
              entrada.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
              saida.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }),
            ) },
          ],
        }}
      >
        <LogoPlaca tamanho={componentes.logoPlaca.entrada} completo />
      </Animated.View>
    </Animated.View>
  );
}
