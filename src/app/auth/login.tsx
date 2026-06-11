import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radius } from '@/theme';
import { AppText, Button, Field } from '@/components/ui';
import { useAuth } from '@/state/AuthProvider';
import { unsplash, IMG } from '@/lib/images';

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { login } = useAuth();
  const params = useLocalSearchParams<{ registered?: string; email?: string }>();
  const justRegistered = params.registered === '1';
  const [identifier, setIdentifier] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!identifier.trim() || !password) {
      setError('Enter your email/username and password');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(identifier.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <View style={{ height: 260 }}>
        <Image source={{ uri: unsplash(IMG.hero, 1000, 70) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.2)', colors.bg]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }} />
        <View style={{ position: 'absolute', bottom: 20, left: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="compass" size={26} color="#fff" />
            <AppText variant="title" style={{ color: '#fff' }}>
              TravelSahay
            </AppText>
          </View>
          <AppText style={{ color: 'rgba(255,255,255,0.9)' }}>Welcome back, explorer</AppText>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          <AppText variant="heading">Sign in</AppText>

          {justRegistered && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primaryMuted, padding: spacing.md, borderRadius: radius.md }}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <AppText variant="caption" style={{ color: colors.primary, fontWeight: '600', flex: 1 }}>
                Account created! Sign in to continue.
              </AppText>
            </View>
          )}

          <Field
            label="Email or username"
            icon="person-outline"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={identifier}
            onChangeText={setIdentifier}
          />
          <Field
            label="Password"
            icon="lock-closed-outline"
            placeholder="Your password"
            secure
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
          />

          {error && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <AppText style={{ color: colors.danger }} variant="caption">
                {error}
              </AppText>
            </View>
          )}

          <Button label="Sign in" loading={loading} fullWidth onPress={submit} />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: spacing.sm }}>
            <AppText tone="muted">New here?</AppText>
            <Pressable onPress={() => router.push('/auth/signup')}>
              <AppText tone="primary" style={{ fontWeight: '700' }}>
                Create an account
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
