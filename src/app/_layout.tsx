import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { ThemeProvider, useTheme } from '@/theme';
import { FavoritesProvider } from '@/state/FavoritesProvider';
import { PlacesProvider } from '@/state/PlacesProvider';
import { LocationProvider } from '@/state/LocationProvider';
import { RecentlyViewedProvider } from '@/state/RecentlyViewedProvider';
import { TripsProvider } from '@/state/TripsProvider';
import { SettingsProvider } from '@/state/SettingsProvider';
import { OnboardingProvider, useOnboarding } from '@/state/OnboardingProvider';
import { AuthProvider, useAuth } from '@/state/AuthProvider';
import { DiaryProvider } from '@/state/DiaryProvider';
import { FxProvider } from '@/state/FxProvider';
import { OfflineProvider } from '@/state/OfflineProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { colors, scheme, ready: themeReady } = useTheme();
  const { done: onboardingDone, ready: onboardingReady } = useOnboarding();
  const { isAuthed, ready: authReady } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const bootReady = themeReady && onboardingReady && authReady;

  useEffect(() => {
    if (bootReady) SplashScreen.hideAsync().catch(() => {});
  }, [bootReady]);

  useEffect(() => {
    if (!bootReady) return;
    const seg0 = segments[0];
    const inOnboarding = seg0 === 'onboarding';
    const inAuth = seg0 === 'auth';

    if (!onboardingDone) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }
    if (!isAuthed) {
      if (!inAuth) router.replace('/auth/login');
      return;
    }
    if (inOnboarding || inAuth) router.replace('/(tabs)');
  }, [bootReady, onboardingDone, isAuthed, segments, router]);

  if (!bootReady) return null;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth/login" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth/signup" />
        <Stack.Screen
          name="place/[type]/[id]"
          options={{ animation: 'slide_from_bottom', presentation: 'card' }}
        />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="recently" />
        <Stack.Screen name="destinations" />
        <Stack.Screen name="diary/new" options={{ animation: 'slide_from_bottom', presentation: 'card' }} />
        <Stack.Screen name="diary/[id]" options={{ animation: 'slide_from_bottom', presentation: 'card' }} />
        <Stack.Screen name="trips/[id]" />
        <Stack.Screen name="ai/planner" />
        <Stack.Screen name="ai/chat" options={{ animation: 'slide_from_bottom', presentation: 'card' }} />
        <Stack.Screen name="ai/budget" />
        <Stack.Screen name="ai/packing" />
        <Stack.Screen name="ai/memories" />
        <Stack.Screen name="ai/assist" />
        <Stack.Screen name="ai/twin" />
        <Stack.Screen name="ai/planners" />
        <Stack.Screen name="social/index" />
        <Stack.Screen name="social/feed" />
        <Stack.Screen name="social/channels" />
        <Stack.Screen name="social/pooling" />
        <Stack.Screen name="social/matching" />
        <Stack.Screen name="social/wallet" />
        <Stack.Screen name="social/marketplace" />
        <Stack.Screen name="social/rewards" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <OnboardingProvider>
            <AuthProvider>
              <SettingsProvider>
                <LocationProvider>
                  <FavoritesProvider>
                    <RecentlyViewedProvider>
                      <TripsProvider>
                        <DiaryProvider>
                          <FxProvider>
                            <PlacesProvider>
                              <OfflineProvider>
                                <RootNavigator />
                              </OfflineProvider>
                            </PlacesProvider>
                          </FxProvider>
                        </DiaryProvider>
                      </TripsProvider>
                    </RecentlyViewedProvider>
                  </FavoritesProvider>
                </LocationProvider>
              </SettingsProvider>
            </AuthProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
