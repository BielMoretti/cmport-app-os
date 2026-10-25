import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlifoConta, GlifoLista } from '@/components/arte';
import { useEstilos, useTema } from '@/contexts/TemaContext';
import { componentes, corpo, espaco, fontes, raio, vidro, type Paleta } from '@/lib/tema';

const ABAS: Record<string, { titulo: string; icone: (cor: string) => ReactNode }> = {
  index: { titulo: 'Minhas OS', icone: cor => <GlifoLista cor={cor} tamanho={componentes.abas.icone} /> },
  conta: { titulo: 'Conta', icone: cor => <GlifoConta cor={cor} tamanho={componentes.abas.icone} /> },
};

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
            {state.routes.filter(r => ABAS[r.name]).map(rota => {
              const ativa = state.routes[state.index]?.key === rota.key;
              const aba = ABAS[rota.name];
              return (
                <Pressable
                  key={rota.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: ativa }}
                  accessibilityLabel={aba.titulo}
                  style={[styles.aba, ativa && styles.abaAtiva]}
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
  abaAtiva: { backgroundColor: c.azulSuave },
  abaTexto: { fontFamily: fontes.textoForte, fontSize: corpo.micro, color: c.textoSuave },
});
