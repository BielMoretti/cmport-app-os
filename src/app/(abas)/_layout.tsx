import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlifoConta, GlifoLista } from '@/components/arte';
import { useMenosMovimento } from '@/components/movimento';
import { useEstilos, useTema } from '@/contexts/TemaContext';
import { componentes, corpo, espaco, fontes, raio, vidro, type Paleta } from '@/lib/tema';

const ABAS: Record<string, { titulo: string; icone: (cor: string) => ReactNode }> = {
  index: { titulo: 'Minhas OS', icone: cor => <GlifoLista cor={cor} tamanho={componentes.abas.icone} /> },
  conta: { titulo: 'Conta', icone: cor => <GlifoConta cor={cor} tamanho={componentes.abas.icone} /> },
};

/** A pílula clara da aba ativa desliza até a aba tocada, em vez de pular. */
function Pilula({ indice, total }: { indice: number; total: number }) {
  const styles = useEstilos(criarEstilos);
  const menos = useMenosMovimento();
  const [largura, setLargura] = useState(0);
  const x = useState(() => new Animated.Value(indice))[0];
  useEffect(() => {
    if (menos) { x.setValue(indice); return; }
    Animated.spring(x, { toValue: indice, damping: 22, stiffness: 260, mass: 1, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [x, indice, menos]);
  const passo = largura / total;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={e => setLargura(e.nativeEvent.layout.width)}>
      {largura > 0 && (
        <Animated.View style={[styles.pilula, { width: passo, transform: [{ translateX: Animated.multiply(x, passo) }] }]} />
      )}
    </View>
  );
}

export default function AbasLayout() {
  const styles = useEstilos(criarEstilos);
  const { cores } = useTema();
  const base = useSafeAreaInsets().bottom;

  return (
    <Tabs
      // fundo opaco: transparente, a aba de onde se saiu ficava aparecendo por baixo da nova (a aba
      // inativa continua no lugar, só fica atrás). Cada tela de aba também desenha a própria <Tela>.
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: cores.fundo } }}
      // barra flutuante em pílula, igual à do app de moradores
      tabBar={({ state, navigation }) => (
        <View style={[styles.barraArea, { paddingBottom: base + componentes.abas.margem }]} pointerEvents="box-none">
          <View style={styles.barra} accessibilityRole="tablist">
            <View style={styles.trilhoDaPilula} pointerEvents="none">
              <Pilula
                indice={state.routes.filter(r => ABAS[r.name]).findIndex(r => r.key === state.routes[state.index]?.key)}
                total={state.routes.filter(r => ABAS[r.name]).length}
              />
            </View>
            {state.routes.filter(r => ABAS[r.name]).map(rota => {
              const ativa = state.routes[state.index]?.key === rota.key;
              const aba = ABAS[rota.name];
              return (
                <Pressable
                  key={rota.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: ativa }}
                  accessibilityLabel={aba.titulo}
                  style={({ pressed }) => [styles.aba, pressed && { transform: [{ scale: 0.95 }] }]}
                  onPress={() => {
                    const evento = navigation.emit({ type: 'tabPress', target: rota.key, canPreventDefault: true });
                    if (!ativa && !evento.defaultPrevented) navigation.navigate(rota.name, rota.params);
                  }}
                >
                  {aba.icone(ativa ? cores.azul : cores.textoSuave)}
                  <Text style={[styles.abaTexto, ativa && { color: cores.azul }]}>{aba.titulo}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="conta" />
    </Tabs>
  );
}

const criarEstilos = (c: Paleta) => StyleSheet.create({
  barraArea: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: componentes.abas.margem },
  barra: {
    flexDirection: 'row', width: '100%', maxWidth: componentes.abas.larguraMaxima, height: componentes.abas.altura,
    ...vidro(c, 'flutuante'), borderRadius: raio.pilula, padding: espaco[1.5], boxShadow: c.vidroSombra,
  },
  aba: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaco[0.5], borderRadius: raio.pilula },
  trilhoDaPilula: { position: 'absolute', top: espaco[1.5], bottom: espaco[1.5], left: espaco[1.5], right: espaco[1.5] },
  pilula: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: raio.pilula, backgroundColor: c.azulSuave },
  abaTexto: { fontFamily: fontes.textoForte, fontSize: corpo.micro, color: c.textoSuave },
});
