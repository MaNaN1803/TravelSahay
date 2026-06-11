import { useEffect, useState } from 'react';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, Card, Button, Field, Chip } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { useTrips } from '@/state/TripsProvider';
import { useDiary } from '@/state/DiaryProvider';
import { ai, type TravelProfile } from '@/api/ai';

const BUDGET = ['budget', 'moderate', 'luxury'];
const PACE = ['relaxed', 'balanced', 'packed'];
const INTERESTS = ['Food', 'History', 'Nightlife', 'Nature', 'Beaches', 'Adventure', 'Photography', 'Shopping'];

export default function TravelTwinScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const { trips } = useTrips();
  const { entries } = useDiary();
  const [profile, setProfile] = useState<TravelProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deriving, setDeriving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    ai.getProfile(token).then((p) => { setProfile(p); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  const set = (patch: Partial<TravelProfile>) => setProfile((p) => ({ ...(p ?? {}), ...patch }));
  const toggleInterest = (i: string) =>
    set({ interests: profile?.interests?.includes(i) ? profile.interests.filter((x) => x !== i) : [...(profile?.interests ?? []), i] });

  const save = async () => {
    if (!token || !profile) return;
    setSaving(true);
    try { setProfile(await ai.saveProfile(profile, token)); } finally { setSaving(false); }
  };

  const derive = async () => {
    if (!token) return;
    setDeriving(true);
    try {
      const res = await ai.deriveProfile(
        { trips: trips.map((t) => ({ title: t.title, days: t.days, stops: t.stops })), diaryEntries: entries.map((e) => ({ title: e.title, note: e.note })) },
        token,
      );
      setProfile((p) => ({ ...(p ?? {}), ...res.profile }));
      setSuggested(res.suggestedNextTrips ?? []);
    } finally { setDeriving(false); }
  };

  if (loading) return <Screen><ScreenHeader title="Travel Twin" /><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View></Screen>;

  return (
    <Screen>
      <ScreenHeader title="Travel Twin" subtitle="Your personal AI travel agent" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 }}>
        <Card padded style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="person-circle" size={26} color={colors.primary} />
            <AppText variant="subtitle" style={{ flex: 1 }}>Your travel persona</AppText>
          </View>
          <AppText tone="muted">{profile?.aiSummary || 'Tap "Learn from my trips" and the AI will build a persona from your trips & diary — making future planning almost one-click.'}</AppText>
          <Button label={deriving ? 'Learning…' : 'Learn from my trips'} icon="sparkles" loading={deriving} onPress={derive} variant="secondary" fullWidth />
        </Card>

        {suggested.length ? (
          <Card padded style={{ gap: 6 }}>
            <AppText variant="subtitle">✈ Suggested next trips</AppText>
            {suggested.map((s, i) => <AppText key={i} tone="muted">• {s}</AppText>)}
          </Card>
        ) : null}

        <Field label="Home city" icon="home-outline" placeholder="e.g. Pune" value={profile?.homeCity ?? ''} onChangeText={(t) => set({ homeCity: t })} />

        <View style={{ gap: spacing.sm }}>
          <AppText variant="caption" tone="muted" style={{ fontWeight: '600' }}>BUDGET STYLE</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {BUDGET.map((x) => <Chip key={x} label={x} active={profile?.budgetStyle === x} onPress={() => set({ budgetStyle: x })} />)}
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppText variant="caption" tone="muted" style={{ fontWeight: '600' }}>PACE</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {PACE.map((x) => <Chip key={x} label={x} active={profile?.pace === x} onPress={() => set({ pace: x })} />)}
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppText variant="caption" tone="muted" style={{ fontWeight: '600' }}>INTERESTS</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {INTERESTS.map((x) => <Chip key={x} label={x} active={profile?.interests?.includes(x)} onPress={() => toggleInterest(x)} />)}
          </View>
        </View>

        <Field label="Transport preference" icon="car-outline" placeholder="e.g. trains, self-drive" value={profile?.transportPreference ?? ''} onChangeText={(t) => set({ transportPreference: t })} />
        <Field label="Avoid (comma separated)" icon="close-circle-outline" placeholder="e.g. crowds, long flights" value={(profile?.avoid ?? []).join(', ')} onChangeText={(t) => set({ avoid: t.split(',').map((s) => s.trim()).filter(Boolean) })} />

        <Button label={saving ? 'Saving…' : 'Save profile'} icon="save" loading={saving} onPress={save} fullWidth />
      </ScrollView>
    </Screen>
  );
}
