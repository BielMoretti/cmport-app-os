import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';

import Abertura from '@/components/Abertura';
import { Tela } from '@/components/ui';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TemaProvider, useTema } from '@/contexts/TemaContext';
import { registrarAvisos, useAvisoAbreOS } from '@/lib/avisos';
import { vigiarConexao } from '@/lib/fila';
import { temaEscuro } from '@/lib/tema';

function Rotas() {
  const { usuario, carregando } = useAuth();
  const { cores, modo } = useTema();
  // logado: a fila sobe quando a conexão volta e quando o app volta para a tela (sem consultar)
  const liberado = !!usuario && !usuario.trocarSenha;
  useEffect(() => { if (liberado) { vigiarConexao(); void registrarAvisos(); } }, [liberado]);
  // tocar no aviso de OS nova abre a OS
  const router = useRouter();
  useAvisoAbreOS(router, liberado);
  // se a fonte falhar, segue com a do sistema em vez de travar na espera
  const [fontesProntas, erroFontes] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold });

  const pronto = !carregando && (fontesProntas || !!erroFontes);
  // a abertura (o leão) cobre a espera e sai por cima da primeira tela quando tudo fica pronto
  if (!pronto) return <View style={{ flex: 1, backgroundColor: cores.fundo }}><Abertura pronto={false} /></View>;

  return (
    <>
      <StatusBar style={temaEscuro(modo) ? 'light' : 'dark'} />
      <Stack
        screenLayout={({ children }) => <Tela>{children}</Tela>}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}
      >
        {/* primeiro acesso: até criar a própria senha, esta é a única tela */}
        <Stack.Protected guard={!!usuario && usuario.trocarSenha}>
          <Stack.Screen name="primeira-senha" />
        </Stack.Protected>
        <Stack.Protected guard={!!usuario && !usuario.trocarSenha}>
          <Stack.Screen name="(abas)" />
          <Stack.Screen name="os/[id]/index" />
          <Stack.Screen name="os/[id]/concluir" />
          <Stack.Screen name="local/[id]" />
          <Stack.Screen name="ler-qr" />
        </Stack.Protected>
        <Stack.Protected guard={!usuario}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
      <Abertura pronto />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <TemaProvider>
        <AuthProvider>
          <Rotas />
        </AuthProvider>
      </TemaProvider>
    </SafeAreaProvider>
  );
}
