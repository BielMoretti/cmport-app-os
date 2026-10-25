import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Aviso, Botao, Campo } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useEstilos } from '@/contexts/TemaContext';
import { MODO_DEMO } from '@/lib/config';
import { componentes, corpo, espaco, fontes, type Paleta } from '@/lib/tema';

export default function Login() {
  const styles = useEstilos(criarEstilos);
  const { login } = useAuth();
  const margem = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar() {
    setErro(null);
    setEntrando(true);
    try {
      await login(email, senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.');
    } finally {
      setEntrando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingTop: margem.top + espaco[12], paddingBottom: margem.bottom + espaco[8] }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formulario}>
          <View style={{ gap: espaco[2] }}>
            <Text style={styles.marca}>CMPort OS</Text>
            <Text style={styles.titulo} accessibilityRole="header">Entrar</Text>
            <Text style={styles.sub}>Suas ordens de serviço do dia, no bolso.</Text>
          </View>

          {MODO_DEMO && <Aviso tipo="info" texto="Modo demonstração: qualquer e-mail e senha entram. As OS são exemplos." />}

          <Campo
            rotulo="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="voce@cmport.com.br"
          />
          <Campo
            rotulo="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={entrar}
            returnKeyType="go"
          />

          {erro && <Aviso texto={erro} />}

          <Botao rotulo="Entrar" onPress={entrar} carregando={entrando} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const criarEstilos = (c: Paleta) => StyleSheet.create({
  conteudo: { flexGrow: 1, paddingHorizontal: componentes.tela.margem, alignItems: 'center' },
  formulario: { width: '100%', maxWidth: componentes.tela.larguraMaxFormulario, gap: espaco[5] },
  marca: { fontFamily: fontes.textoForte, fontSize: corpo.pequeno, color: c.azul, letterSpacing: 1 },
  titulo: { fontFamily: fontes.nome, fontSize: corpo.destaque, color: c.texto },
  sub: { fontFamily: fontes.texto, fontSize: corpo.base, color: c.textoSuave },
});
