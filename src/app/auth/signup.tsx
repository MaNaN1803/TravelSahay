import { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing } from '@/theme';
import { AppText, Button, Field } from '@/components/ui';
import { useAuth } from '@/state/AuthProvider';
import { unsplash, IMG } from '@/lib/images';

export default function SignupScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register(email.trim(), username.trim(), password);
      // account created — send to login to sign in
      router.replace({ pathname: '/auth/login', params: { registered: '1', email: email.trim() } });
    } catch (e: any) {
      setError(e?.message ?? 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <View style={{ height: 220 }}>
        <Image source={{ uri: unsplash('1488646953014-85cb44e25828', 1000, 70) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.2)', colors.bg]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }} />
        <View style={{ position: 'absolute', bottom: 20, left: spacing.lg }}>
          <AppText variant="title" style={{ color: '#fff' }}>
            Start your journey
          </AppText>
          <AppText style={{ color: 'rgba(255,255,255,0.9)' }}>Create your free account</AppText>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          <Field
            label="Email"
            icon="mail-outline"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            label="Username"
            icon="person-outline"
            placeholder="explorer"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />
          <Field
            label="Password"
            icon="lock-closed-outline"
            placeholder="At least 6 characters"
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

          <Button label="Create account" loading={loading} fullWidth onPress={submit} />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: spacing.sm }}>
            <AppText tone="muted">Already have an account?</AppText>
            <Pressable onPress={() => router.replace('/auth/login')}>
              <AppText tone="primary" style={{ fontWeight: '700' }}>
                Sign in
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
