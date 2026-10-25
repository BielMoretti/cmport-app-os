import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlifoLocal, GlifoRelogio } from '@/components/arte';
import { Aviso, Carregando, Cartao, SeloSituacao, Tela } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useEstilos, useTema } from '@/contexts/TemaContext';
import { listarOS, ordenarOS, quando } from '@/lib/os';
import { componentes, corpo, espaco, fontes, vidro, type Paleta } from '@/lib/tema';
import { ROTULO_PRIORIDADE, type OrdemServico } from '@/lib/types';

type Filtro = 'abertas' | 'concluidas' | 'todas';

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: 'abertas', rotulo: 'A fazer' },
  { valor: 'concluidas', rotulo: 'Concluídas' },
  { valor: 'todas', rotulo: 'Todas' },
];

function passaNoFiltro(os: OrdemServico, filtro: Filtro): boolean {
  if (filtro === 'todas') return true;
  const feita = os.situacao === 'concluida' || os.situacao === 'cancelada';
  return filtro === 'concluidas' ? feita : !feita;
}

function LinhaDaOS({ os }: { os: OrdemServico }) {
  const styles = useEstilos(criarEstilos);
  const { cores } = useTema();
  const router = useRouter();
  const urgente = os.prioridade === 'urgente' || os.prioridade === 'alta';
  return (
    <Cartao onPress={() => router.push({ pathname: '/os/[id]', params: { id: String(os.id) } })} rotulo={`${os.numero}, ${os.titulo}`}>
      <View style={styles.linhaTopo}>
        <Text style={styles.numero}>{os.numero}</Text>
        <SeloSituacao situacao={os.situacao} />
      </View>
      <Text style={styles.titulo} numberOfLines={2}>{os.titulo}</Text>
      <Text style={styles.cliente} numberOfLines={1}>{os.cliente.nome}</Text>
      <View style={styles.rodape}>
        <View style={styles.info}>
          <GlifoRelogio cor={cores.textoSuave} />
          <Text style={styles.infoTexto}>{quando(os.agendada_para)}</Text>
        </View>
        <View style={[styles.info, { flexShrink: 1 }]}>
          <GlifoLocal cor={cores.textoSuave} />
          <Text style={styles.infoTexto} numberOfLines={1}>{os.endereco.split(' — ')[0]}</Text>
        </View>
      </View>
      {urgente && (
        <Text style={[styles.prioridade, { color: os.prioridade === 'urgente' ? cores.erro : cores.andamento.texto }]}>
          Prioridade {ROTULO_PRIORIDADE[os.prioridade].toLowerCase()}
        </Text>
      )}
    </Cartao>
  );
}

export default function MinhasOS() {
  const styles = useEstilos(criarEstilos);
  const { cores } = useTema();
  const { usuario } = useAuth();
  const margem = useSafeAreaInsets();
  const [lista, setLista] = useState<OrdemServico[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('abertas');

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setLista(ordenarOS(await listarOS()));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar as OS.');
    }
  }, []);

  // busca de novo sempre que a aba aparece: a OS aberta ou mudada na dash chega sem puxar a lista
  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  async function puxar() {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }

  const visiveis = useMemo(() => (lista ?? []).filter(os => passaNoFiltro(os, filtro)), [lista, filtro]);
  const aFazer = useMemo(() => (lista ?? []).filter(os => passaNoFiltro(os, 'abertas')).length, [lista]);
  const primeiroNome = usuario?.nome.split(' ')[0] ?? '';

  const cabecalho = (
    <View style={{ gap: espaco[4], paddingBottom: espaco[2] }}>
      <View style={{ gap: espaco[1] }}>
        <Text style={styles.ola}>Olá, {primeiroNome}</Text>
        <Text style={styles.resumo} accessibilityRole="header">
          {lista === null ? 'Carregando…' : aFazer === 0 ? 'Nada pendente' : aFazer === 1 ? '1 OS a fazer' : `${aFazer} OS a fazer`}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espaco[2] }}>
        {FILTROS.map(f => {
          const ativo = f.valor === filtro;
          return (
            <Pressable
              key={f.valor}
              onPress={() => setFiltro(f.valor)}
              accessibilityRole="button"
              accessibilityState={{ selected: ativo }}
              style={[styles.chip, ativo ? { backgroundColor: cores.azul, borderColor: cores.azul } : vidro(cores)]}
            >
              <Text style={[styles.chipTexto, ativo && { color: cores.sobreAzul }]}>{f.rotulo}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {erro && <Aviso texto={erro} />}
    </View>
  );

  // a <Tela> (fundo opaco) é da própria aba: sem ela, a aba de onde se saiu aparecia por baixo
  if (lista === null && !erro) return <Tela><Carregando /></Tela>;

  return (
    <Tela>
    <FlatList
      data={visiveis}
      keyExtractor={os => String(os.id)}
      renderItem={({ item }) => <LinhaDaOS os={item} />}
      ListHeaderComponent={cabecalho}
      ListEmptyComponent={lista ? <Text style={styles.vazio}>Nenhuma OS aqui.</Text> : null}
      ItemSeparatorComponent={() => <View style={{ height: espaco[3] }} />}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={puxar} tintColor={cores.azul} />}
      contentContainerStyle={[styles.conteudo, { paddingTop: margem.top + espaco[6], paddingBottom: componentes.abas.reserva + margem.bottom }]}
    />
    </Tela>
  );
}

const criarEstilos = (c: Paleta) => StyleSheet.create({
  conteudo: { paddingHorizontal: componentes.tela.margem, width: '100%', maxWidth: componentes.conteudo.larguraMaxima, alignSelf: 'center' },
  ola: { fontFamily: fontes.texto, fontSize: corpo.base, color: c.textoSuave },
  resumo: { fontFamily: fontes.nome, fontSize: corpo.titulo, color: c.texto },
  chip: { height: componentes.chip.altura, borderRadius: componentes.chip.raio, paddingHorizontal: componentes.chip.respiroH, justifyContent: 'center', borderWidth: 1 },
  chipTexto: { fontFamily: fontes.textoForte, fontSize: corpo.pequeno, color: c.texto },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaco[2] },
  numero: { fontFamily: fontes.textoForte, fontSize: corpo.pequeno, color: c.textoSuave, fontVariant: ['tabular-nums'] },
  titulo: { fontFamily: fontes.nome, fontSize: corpo.nome, color: c.texto },
  cliente: { fontFamily: fontes.texto, fontSize: corpo.legenda, color: c.textoSuave },
  rodape: { flexDirection: 'row', gap: espaco[4], marginTop: espaco[1] },
  info: { flexDirection: 'row', alignItems: 'center', gap: espaco[1.5] },
  infoTexto: { fontFamily: fontes.texto, fontSize: corpo.pequeno, color: c.textoSuave, flexShrink: 1 },
  prioridade: { fontFamily: fontes.textoForte, fontSize: corpo.micro },
  vazio: { fontFamily: fontes.texto, fontSize: corpo.base, color: c.textoSuave, textAlign: 'center', paddingVertical: espaco[10] },
});
