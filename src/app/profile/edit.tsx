import { useEffect, useState } from 'react';
import { ScrollView, View, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { spacing } from '@/theme';
import { Screen, AppText, Card, Button, Field, Chip } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { community } from '@/api/community';

const STYLES = ['backpacker', 'nomad', 'solo', 'family', 'adventure', 'luxury'];
const INTERESTS = ['Food', 'History', 'Nightlife', 'Nature', 'Beaches', 'Adventure', 'Photography', 'Shopping'];
const AGE_GROUPS = ['18-25', '26-35', '36-45', '46+'];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, token, updateUser, changePassword } = useAuth();

  // Account
  const [username, setUsername] = useState(user?.username ?? '');
  const [savingName, setSavingName] = useState(false);

  // Password
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  // Travel persona (MatchProfile — also powers matching & buddies)
  const [p, setP] = useState<any>({ interests: [] });
  const [savingP, setSavingP] = useState(false);

  useEffect(() => {
    if (!token) return;
    community.getMatchProfile(token).then((r) => setP(r.profile ?? { interests: [] })).catch(() => {});
  }, [token]);

  const set = (patch: any) => setP((prev: any) => ({ ...prev, ...patch }));
  const toggle = (i: string) => set({ interests: p.interests?.includes(i) ? p.interests.filter((x: string) => x !== i) : [...(p.interests ?? []), i] });

  const saveName = async () => {
    const v = username.trim();
    if (!v || v === user?.username) return;
    setSavingName(true);
    try { await updateUser(v); Alert.alert('Saved', 'Username updated.'); }
    catch (e: any) { Alert.alert('Could not update', e?.message ?? 'Try again'); }
    finally { setSavingName(false); }
  };

  const savePassword = async () => {
    if (!curPw || !newPw) return;
    setSavingPw(true);
    try {
      await changePassword(curPw, newPw);
      setCurPw(''); setNewPw('');
      Alert.alert('Saved', 'Password changed.');
    } catch (e: any) { Alert.alert('Could not change', e?.message ?? 'Try again'); }
    finally { setSavingPw(false); }
  };

  const savePersona = async () => {
    if (!token) return;
    setSavingP(true);
    try {
      await community.saveMatchProfile({
        name: p.name, bio: p.bio, destination: p.destination, ageGroup: p.ageGroup,
        travelStyle: p.travelStyle, interests: p.interests,
        languages: typeof p.languages === 'string' ? p.languages.split(',').map((s: string) => s.trim()).filter(Boolean) : p.languages,
        budget: p.budget ? Number(p.budget) : undefined,
      }, token);
      Alert.alert('Saved', 'Travel persona updated — this improves your matches.');
    } catch (e: any) { Alert.alert('Could not save', e?.message ?? 'Try again'); }
    finally { setSavingP(false); }
  };

  const languagesValue = Array.isArray(p.languages) ? p.languages.join(', ') : (p.languages ?? '');

  return (
    <Screen>
      <ScreenHeader title="Edit profile" subtitle="Account · travel persona" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 }} keyboardShouldPersistTaps="handled">
          {/* Account */}
          <Card padded style={{ gap: spacing.md }}>
            <AppText variant="subtitle">Account</AppText>
            <Field label="Username" icon="person-outline" placeholder="Your display name" value={username} onChangeText={setUsername} autoCapitalize="none" />
            <AppText variant="caption" tone="muted">{user?.email}</AppText>
            <Button label={savingName ? 'Saving…' : 'Save username'} icon="save" loading={savingName} onPress={saveName} disabled={!username.trim() || username.trim() === user?.username} fullWidth />
          </Card>

          {/* Password */}
          <Card padded style={{ gap: spacing.md }}>
            <AppText variant="subtitle">Change password</AppText>
            <Field label="Current password" icon="lock-closed-outline" placeholder="••••••" secure value={curPw} onChangeText={setCurPw} />
            <Field label="New password" icon="key-outline" placeholder="At least 6 characters" secure value={newPw} onChangeText={setNewPw} />
            <Button label={savingPw ? 'Saving…' : 'Update password'} icon="shield-checkmark" loading={savingPw} onPress={savePassword} disabled={!curPw || newPw.length < 6} fullWidth />
          </Card>

          {/* Travel persona */}
          <Card padded style={{ gap: spacing.md }}>
            <AppText variant="subtitle">Travel persona</AppText>
            <AppText variant="caption" tone="muted">Used across matching & Travel Buddies to find compatible companions.</AppText>
            <Field label="Display name for travellers" icon="happy-outline" placeholder="e.g. Manan" value={p.name ?? ''} onChangeText={(t) => set({ name: t })} />
            <Field label="Bio" icon="document-text-outline" placeholder="Tell travellers about you" value={p.bio ?? ''} onChangeText={(t) => set({ bio: t })} />
            <Field label="Usual destination" icon="location-outline" placeholder="e.g. Goa" value={p.destination ?? ''} onChangeText={(t) => set({ destination: t })} />
            <Field label="Typical budget (INR)" icon="wallet-outline" placeholder="20000" keyboardType="number-pad" value={p.budget ? String(p.budget) : ''} onChangeText={(t) => set({ budget: t })} />
            <Field label="Languages (comma separated)" icon="language-outline" placeholder="English, Hindi" value={languagesValue} onChangeText={(t) => set({ languages: t })} />

            <View style={{ gap: spacing.sm }}>
              <AppText variant="caption" tone="muted" style={{ fontWeight: '600' }}>AGE GROUP</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {AGE_GROUPS.map((a) => <Chip key={a} label={a} active={p.ageGroup === a} onPress={() => set({ ageGroup: a })} />)}
              </View>
            </View>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="caption" tone="muted" style={{ fontWeight: '600' }}>TRAVEL STYLE</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {STYLES.map((s) => <Chip key={s} label={s} active={p.travelStyle === s} onPress={() => set({ travelStyle: s })} />)}
              </View>
            </View>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="caption" tone="muted" style={{ fontWeight: '600' }}>INTERESTS</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {INTERESTS.map((i) => <Chip key={i} label={i} active={p.interests?.includes(i)} onPress={() => toggle(i)} />)}
              </View>
            </View>
            <Button label={savingP ? 'Saving…' : 'Save travel persona'} icon="save" loading={savingP} onPress={savePersona} fullWidth />
          </Card>

          <Button label="Done" variant="ghost" onPress={() => router.back()} fullWidth />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
