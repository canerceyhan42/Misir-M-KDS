import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { getPreferences, UserPreferences } from '@/lib/storage';
import { ThemeProvider } from '@/lib/theme';

// Prevent the splash screen from auto-hiding before resources are ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [initialPreference, setInitialPreference] = useState<UserPreferences['theme'] | undefined>(
    undefined
  );
  const [isReady, setIsReady] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    async function prepare() {
      try {
        // Load user preferences from storage before rendering
        const prefs = await getPreferences();
        setInitialPreference(prefs.theme);
        setOnboardingCompleted(prefs.onboardingCompleted);
      } catch {
        // Fall back to system theme on error
        setInitialPreference('system');
        setOnboardingCompleted(true);
      } finally {
        setIsReady(true);
        // Small delay for a smooth fade transition
        await new Promise((resolve) => setTimeout(resolve, 100));
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  // Navigate to onboarding if not yet completed
  useEffect(() => {
    if (isReady && onboardingCompleted === false) {
      router.replace('/onboarding');
    }
  }, [isReady, onboardingCompleted]);

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Ana Sayfa' }} />
        <Stack.Screen name="camera" options={{ title: 'Fotoğraf Çek' }} />
        <Stack.Screen name="result" options={{ title: 'Teşhis Sonucu' }} />
        <Stack.Screen
          name="history"
          options={{ title: 'Teşhis Geçmişi', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="compare"
          options={{ title: 'Karşılaştır', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ title: 'Hoş Geldiniz', headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="settings"
          options={{ title: 'Ayarlar', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="feedback-stats"
          options={{ title: 'Geri Bildirim İstatistikleri', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="disease-guide"
          options={{ title: 'Hastalık Rehberi', animation: 'slide_from_right' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
