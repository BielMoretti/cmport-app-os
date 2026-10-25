import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CampoDeAssinatura } from '@/components/Assinatura';
import { Aviso, Botao, Campo, Topo } from '@/components/ui';
import { useEstilos } from '@/contexts/TemaContext';
import { marcarAqui } from '@/lib/local';
import { concluir } from '@/lib/os';
import { componentes, corpo, espaco, fontes, type Paleta } from '@/lib/tema';

export default function ConcluirOS() {
  const styles = useEstilos(criarEstilos);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const margem = useSafeAreaInsets();
  const [relato, setRelato] = useState('');
  const [nome, setNome] = useState('');
  const [traco, setTraco] = useState('');
  const [desenhando, setDesenhando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const faltando = [
    !relato.trim() && 'o relato',
    !nome.trim() && 'o nome de quem assina',
    !traco && 'a assinatura',
  ].filter(Boolean) as string[];

  async function enviar() {
    setErro(null);
    setEnviando(true);
    try {
      await concluir(Number(id), { relato: relato.trim(), assinatura: { nome: nome.trim(), traco }, aqui: await marcarAqui() });
      router.back();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível concluir. Tente de novo.');
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Topo titulo="Concluir OS" />
      <ScrollView
        scrollEnabled={!desenhando}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.conteudo, { paddingBottom: margem.bottom + espaco[10] }]}
      >
        <Campo
          rotulo="O que foi feito"
          value={relato}
          onChangeText={setRelato}
          multiline
          placeholder="Ex.: troquei o conector da câmera e testei no app com o síndico."
          style={{ minHeight: 110, textAlignVertical: 'top' }}
        />

        <View style={{ gap: espaco[3] }}>
          <Text style={styles.rotulo}>Assinatura do cliente</Text>
          <Campo rotulo="Nome de quem assina" value={nome} onChangeText={setNome} placeholder="Ex.: Síndico, zelador, porteiro" autoCapitalize="words" />
          <CampoDeAssinatura aoMudar={setTraco} aoDesenhar={setDesenhando} />
        </View>

        {erro && <Aviso texto={erro} />}
        {faltando.length > 0 && <Text style={styles.ajuda}>Falta {faltando.join(', ')}.</Text>}

        <Botao rotulo="Concluir e enviar" onPress={enviar} carregando={enviando} desativado={faltando.length > 0} />
        <Text style={styles.ajuda}>Ao concluir, a hora e a sua localização ficam registradas na OS.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const criarEstilos = (c: Paleta) => StyleSheet.create({
  conteudo: { paddingHorizontal: componentes.tela.margem, gap: espaco[5], width: '100%', maxWidth: componentes.conteudo.larguraMaxima, alignSelf: 'center' },
  rotulo: { fontFamily: fontes.textoForte, fontSize: corpo.micro, color: c.textoSuave, textTransform: 'uppercase', letterSpacing: 0.6 },
  ajuda: { fontFamily: fontes.texto, fontSize: corpo.pequeno, color: c.textoSuave },
});
