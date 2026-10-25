import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Botao, Cartao, Tela } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useEstilos, useTema } from '@/contexts/TemaContext';
import { MODO_DEMO } from '@/lib/config';
import { componentes, corpo, espaco, fontes, type Paleta } from '@/lib/tema';

const PAPEL: Record<string, string> = { TECNICO: 'Técnico', SUPERVISOR: 'Supervisor', ADMIN: 'Administrador' };

export default function Conta() {
  const styles = useEstilos(criarEstilos);
  const { usuario, logout } = useAuth();
  const { modo, alternar } = useTema();
  const margem = useSafeAreaInsets();

  return (
    <Tela>
    <ScrollView contentContainerStyle={[styles.conteudo, { paddingTop: margem.top + espaco[6], paddingBottom: componentes.abas.reserva + margem.bottom }]}>
      <Text style={styles.titulo} accessibilityRole="header">Conta</Text>
      <Cartao>
        <Text style={styles.nome}>{usuario?.nome}</Text>
        <Text style={styles.papel}>{PAPEL[usuario?.role ?? ''] ?? usuario?.role}</Text>
        {MODO_DEMO && <Text style={styles.papel}>Modo demonstração (sem servidor)</Text>}
      </Cartao>
      <View style={{ gap: espaco[3] }}>
        <Botao tipo="secundario" rotulo={modo === 'escuro' ? 'Usar tema claro' : 'Usar tema escuro'} onPress={alternar} />
        <Botao tipo="secundario" rotulo="Sair" onPress={() => { void logout(); }} />
      </View>
    </ScrollView>
    </Tela>
  );
}

const criarEstilos = (c: Paleta) => StyleSheet.create({
  conteudo: { paddingHorizontal: componentes.tela.margem, gap: espaco[5], width: '100%', maxWidth: componentes.conteudo.larguraMaxima, alignSelf: 'center' },
  titulo: { fontFamily: fontes.nome, fontSize: corpo.titulo, color: c.texto },
  nome: { fontFamily: fontes.nome, fontSize: corpo.nome, color: c.texto },
  papel: { fontFamily: fontes.texto, fontSize: corpo.legenda, color: c.textoSuave },
});
