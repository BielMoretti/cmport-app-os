import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AvisoDaFila from '@/components/AvisoDaFila';
import { Surgir } from '@/components/movimento';
import { Aviso, Botao, Cartao, LogoPlaca, Tela } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useEstilos, useTema } from '@/contexts/TemaContext';
import { MODO_DEMO } from '@/lib/config';
import { useFila } from '@/lib/fila';
import { componentes, corpo, espaco, fontes, type Paleta } from '@/lib/tema';

const PAPEL: Record<string, string> = { TECNICO: 'Técnico', SUPERVISOR: 'Supervisor', ADMIN: 'Administrador' };

export default function Conta() {
  const styles = useEstilos(criarEstilos);
  const { usuario, logout } = useAuth();
  const { modo, alternar } = useTema();
  const margem = useSafeAreaInsets();
  const { itens } = useFila();
  // sair apaga do aparelho o que não subiu: com ação na fila, o primeiro toque só avisa
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const pendentes = itens.length;

  const sair = () => {
    if (pendentes > 0 && !confirmarSaida) { setConfirmarSaida(true); return; }
    void logout();
  };

  return (
    <Tela>
    <ScrollView contentContainerStyle={[styles.conteudo, { paddingTop: margem.top + espaco[6], paddingBottom: componentes.abas.reserva + margem.bottom }]}>
      <Text style={styles.titulo} accessibilityRole="header">Conta</Text>
      <Surgir>
      <Cartao>
        <View style={styles.pessoa}>
          <LogoPlaca tamanho={componentes.logoPlaca.topo} />
          <View style={{ flex: 1, gap: espaco[0.5] }}>
            <Text style={styles.nome}>{usuario?.nome}</Text>
            <Text style={styles.papel}>{PAPEL[usuario?.role ?? ''] ?? usuario?.role} · CM Port</Text>
          </View>
        </View>
        {MODO_DEMO && <Text style={styles.papel}>Modo demonstração (sem servidor)</Text>}
      </Cartao>
      </Surgir>
      <AvisoDaFila />
      <View style={{ gap: espaco[3] }}>
        <Botao tipo="secundario" rotulo={modo === 'escuro' ? 'Usar tema claro' : 'Usar tema escuro'} onPress={alternar} />
        {confirmarSaida && pendentes > 0 && (
          <Aviso texto={`Ainda há ${pendentes === 1 ? '1 ação' : `${pendentes} ações`} sem enviar. Sair agora apaga do celular: espere o sinal voltar para não perder o atendimento.`} />
        )}
        <Botao tipo="secundario" rotulo={confirmarSaida && pendentes > 0 ? 'Sair mesmo assim' : 'Sair'} onPress={sair} />
      </View>
    </ScrollView>
    </Tela>
  );
}

const criarEstilos = (c: Paleta) => StyleSheet.create({
  conteudo: { paddingHorizontal: componentes.tela.margem, gap: espaco[5], width: '100%', maxWidth: componentes.conteudo.larguraMaxima, alignSelf: 'center' },
  titulo: { fontFamily: fontes.nome, fontSize: corpo.titulo, color: c.texto },
  pessoa: { flexDirection: 'row', alignItems: 'center', gap: espaco[3] },
  nome: { fontFamily: fontes.nome, fontSize: corpo.nome, color: c.texto },
  papel: { fontFamily: fontes.texto, fontSize: corpo.legenda, color: c.textoSuave },
});
