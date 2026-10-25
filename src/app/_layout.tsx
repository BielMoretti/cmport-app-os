import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';

import { Tela } from '@/components/ui';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TemaProvider, useTema } from '@/contexts/TemaContext';
import { temaEscuro } from '@/lib/tema';

function Rotas() {
  const { usuario, carregando } = useAuth();
  const { cores, modo } = useTema();
  // se a fonte falhar, segue com a do sistema em vez de travar na espera
  const [fontesProntas, erroFontes] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold });

  if (carregando || (!fontesProntas && !erroFontes)) {
    return (
      <View style={{ flex: 1, backgroundColor: cores.fundo, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={cores.azul} />
      </View>
    );
  }

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
        </Stack.Protected>
        <Stack.Protected guard={!usuario}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
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
