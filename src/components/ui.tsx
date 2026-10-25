/** Peças básicas da interface. Cores sempre da paleta do tema; medidas de lib/tema. */
import type { ReactNode } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlifoVoltar } from '@/components/arte';
import { Pulso } from '@/components/movimento';
import { useEstilos, useTema } from '@/contexts/TemaContext';
import { aceso, componentes, corpo, espaco, fontes, raio, vidro, type Paleta } from '@/lib/tema';
import { ROTULO_SITUACAO, type Situacao } from '@/lib/types';

/** Fundo de todas as telas: degradê do topo para o fundo do tema. */
export function Tela({ children }: { children: ReactNode }) {
  const { cores } = useTema();
  const degrade = `linear-gradient(180deg, ${cores.fundoAlto} 0%, ${cores.fundo} 55%)`;
  const fundo = (Platform.OS === 'web' ? { backgroundImage: degrade } : { experimental_backgroundImage: degrade }) as ViewStyle;
  return <View style={[{ flex: 1, backgroundColor: cores.fundo }, fundo]}>{children}</View>;
}

/** A logo da CM Port numa placa clara (o leão é cinza: some no fundo escuro sem ela). */
export function LogoPlaca({ tamanho, completo = false }: { tamanho: number; completo?: boolean }) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={[styles.logoPlaca, { width: tamanho, height: tamanho, borderRadius: tamanho * 0.3, padding: tamanho * 0.12 }]}>
      <Image
        source={completo ? require('../../assets/logo.png') : require('../../assets/leao.png')}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
        accessibilityLabel="CM Port"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

/** Topo de uma tela de detalhe: voltar + título. */
export function Topo({ titulo, voltar = true }: { titulo: string; voltar?: boolean }) {
  const styles = useEstilos(criarEstilos);
  const { cores } = useTema();
  const router = useRouter();
  const topo = useSafeAreaInsets().top;
  return (
    <View style={[styles.topo, { paddingTop: topo + espaco[2] }]}>
      {voltar && (
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8} style={styles.voltar}>
          <GlifoVoltar cor={cores.texto} />
        </Pressable>
      )}
      <Text style={styles.topoTitulo} numberOfLines={1} accessibilityRole="header">{titulo}</Text>
    </View>
  );
}

export function Botao({ rotulo, onPress, carregando, desativado, tipo = 'principal' }: {
  rotulo: string; onPress: () => void; carregando?: boolean; desativado?: boolean; tipo?: 'principal' | 'secundario';
}) {
  const styles = useEstilos(criarEstilos);
  const { cores } = useTema();
  const parado = desativado || carregando;
  return (
    <Pressable
      onPress={onPress}
      disabled={parado}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!parado, busy: !!carregando }}
      style={({ pressed }) => [
        styles.botao,
        tipo === 'principal' ? aceso(cores) : vidro(cores, 'forte'),
        parado && { opacity: 0.55 },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      {carregando
        ? <ActivityIndicator color={tipo === 'principal' ? '#FFFFFF' : cores.azul} />
        : <Text style={[styles.botaoTexto, tipo === 'secundario' && { color: cores.texto }]}>{rotulo}</Text>}
    </Pressable>
  );
}

export function Campo({ rotulo, ...props }: TextInputProps & { rotulo: string }) {
  const styles = useEstilos(criarEstilos);
  const { cores } = useTema();
  return (
    <View style={{ gap: espaco[1.5] }}>
      <Text style={styles.campoRotulo}>{rotulo}</Text>
      <TextInput
        placeholderTextColor={cores.textoSuave}
        accessibilityLabel={rotulo}
        {...props}
        style={[styles.campo, props.style]}
      />
    </View>
  );
}

export function Cartao({ children, onPress, rotulo }: { children: ReactNode; onPress?: () => void; rotulo?: string }) {
  const styles = useEstilos(criarEstilos);
  const { cores } = useTema();
  // o fio de luz no topo é o que faz o painel ler como vidro
  const fio = <View style={styles.fio} pointerEvents="none" />;
  if (!onPress) return <View style={[styles.cartao, vidro(cores)]}>{fio}{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [styles.cartao, vidro(cores), pressed && styles.cartaoApertado]}
    >
      {fio}
      {children}
    </Pressable>
  );
}

/** Selo da situação: ponto + texto escrito (a cor nunca fala sozinha). */
export function SeloSituacao({ situacao }: { situacao: Situacao }) {
  const styles = useEstilos(criarEstilos);
  const { cores } = useTema();
  const c = cores[situacao];
  return (
    <View style={[styles.selo, { backgroundColor: c.fundo }]}>
      {situacao === 'andamento'
        ? <Pulso cor={c.texto} tamanho={componentes.selo.ponto} />
        : <View style={[styles.seloPonto, { backgroundColor: c.texto }]} />}
      <Text style={[styles.seloTexto, { color: c.texto }]}>{ROTULO_SITUACAO[situacao]}</Text>
    </View>
  );
}

export function Carregando() {
  const { cores } = useTema();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: espaco[8] }}>
      <ActivityIndicator color={cores.azul} />
    </View>
  );
}

export function Aviso({ texto, tipo = 'erro' }: { texto: string; tipo?: 'erro' | 'info' }) {
  const styles = useEstilos(criarEstilos);
  const { cores } = useTema();
  return (
    <View
      style={[styles.aviso, { backgroundColor: tipo === 'erro' ? cores.erroSuave : cores.azulSuave }]}
      accessibilityRole={tipo === 'erro' ? 'alert' : undefined}
    >
      <Text style={[styles.avisoTexto, { color: tipo === 'erro' ? cores.erro : cores.azul }]}>{texto}</Text>
    </View>
  );
}

const criarEstilos = (c: Paleta) => StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', gap: espaco[2], paddingHorizontal: componentes.tela.margem, paddingBottom: espaco[3] },
  voltar: { width: componentes.alvoDeToque, height: componentes.alvoDeToque, alignItems: 'center', justifyContent: 'center', marginLeft: -espaco[2] },
  topoTitulo: { flex: 1, fontFamily: fontes.nome, fontSize: corpo.cabecalho, color: c.texto },
  botao: { height: componentes.botao.altura, borderRadius: componentes.botao.raio, alignItems: 'center', justifyContent: 'center', paddingHorizontal: espaco[6] },
  botaoTexto: { fontFamily: fontes.textoForte, fontSize: corpo.base, color: '#FFFFFF' },
  campoRotulo: { fontFamily: fontes.textoForte, fontSize: corpo.pequeno, color: c.textoSuave },
  campo: {
    ...vidro(c), borderRadius: componentes.campo.raio, paddingHorizontal: componentes.campo.respiroH,
    paddingVertical: componentes.campo.respiroV, fontFamily: fontes.texto, fontSize: corpo.base, color: c.texto,
  },
  cartao: { borderRadius: componentes.cartao.raio, padding: componentes.cartao.respiro, gap: espaco[2.5], boxShadow: c.vidroSombra },
  cartaoApertado: { transform: [{ scale: 0.98 }], borderColor: c.azul, boxShadow: c.brilho },
  fio: { position: 'absolute', top: 0, left: raio.grande, right: raio.grande, height: 1, backgroundColor: c.vidroFio },
  logoPlaca: { backgroundColor: c.placa, borderWidth: 1, borderColor: c.vidroFio, boxShadow: c.brilho },
  selo: { flexDirection: 'row', alignItems: 'center', gap: espaco[1.5], alignSelf: 'flex-start', borderRadius: componentes.selo.raio, paddingHorizontal: espaco[2.5], paddingVertical: espaco[1] },
  seloPonto: { width: componentes.selo.ponto, height: componentes.selo.ponto, borderRadius: raio.pilula },
  seloTexto: { fontFamily: fontes.textoForte, fontSize: corpo.micro },
  aviso: { borderRadius: raio.medio, padding: espaco[3] },
  avisoTexto: { fontFamily: fontes.textoForte, fontSize: corpo.pequeno },
});
