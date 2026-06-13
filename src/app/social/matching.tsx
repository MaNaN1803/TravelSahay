import { useEffect, useState } from 'react';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, Card, Button, Field, Chip, Badge, EmptyState } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { useLocation } from '@/state/LocationProvider';
import { community, type Match } from '@/api/community';

const INTERESTS = ['Food', 'History', 'Nightlife', 'Nature', 'Beaches', 'Adventure', 'Photography'];
const STYLES = ['backpacker', 'nomad', 'solo', 'family', 'adventure', 'luxury'];

export default function MatchingScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const { coords, request } = useLocation();
  const [profile, setProfile] = useState<any>({ interests: [] });
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [nearby, setNearby] = useState<any[] | null>(null);
  const [dating, setDating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [verdicts, setVerdicts] = useState<Record<string, string>>({});
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const connect = async (m: Match) => {
    if (!token || followed.has(m.userId)) return;
    setFollowed((s) => new Set(s).add(m.userId)); // optimistic
    try {
      await community.follow(m.userId, token);
    } catch {
      setFollowed((s) => { const n = new Set(s); n.delete(m.userId); return n; });
    }
  };

  const trustCheck = async (m: Match) => {
    if (!token) return;
    setVerdicts((v) => ({ ...v, [m.userId]: 'Checking…' }));
    try {
      const r = await community.fraudCheck(`Name: ${m.name}; style: ${m.travelStyle}; bio: ${m.bio ?? ''}`, token);
      setVerdicts((v) => ({ ...v, [m.userId]: r.verdict }));
    } catch { setVerdicts((v) => ({ ...v, [m.userId]: 'Check failed' })); }
  };

  const findNearby = async () => {
    if (!token) return;
    setLocating(true);
    try {
      const c = coords ?? (await request());
      if (!c) { setNearby([]); return; }
      await community.saveMatchProfile({ lat: c.latitude, lng: c.longitude, active: true }, token);
      const r = await community.nearby(token);
      setNearby(r.nearby);
    } finally { setLocating(false); }
  };

  useEffect(() => {
    if (!token) return;
    community.getMatchProfile(token).then((r) => setProfile(r.profile ?? { interests: [] })).catch(() => {});
  }, [token]);

  const set = (p: any) => setProfile((prev: any) => ({ ...prev, ...p }));
  const toggle = (i: string) => set({ interests: profile.interests?.includes(i) ? profile.interests.filter((x: string) => x !== i) : [...(profile.interests ?? []), i] });

  const saveAndFind = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await community.saveMatchProfile({
        name: profile.name, destination: profile.destination, budget: profile.budget ? Number(profile.budget) : undefined,
        interests: profile.interests, travelStyle: profile.travelStyle, ageGroup: profile.ageGroup, bio: profile.bio,
        datingMode: dating, active: true,
      }, token);
      setLoading(true);
      const r = await community.findMatches(token, dating);
      setMatches(r.matches);
    } finally { setSaving(false); setLoading(false); }
  };

  return (
    <Screen>
      <ScreenHeader title="Find Travellers" subtitle="Matching & compatibility" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 }}>
        <Card padded style={{ gap: spacing.md }}>
          <Field label="Display name" icon="person-outline" placeholder="e.g. Manan" value={profile.name ?? ''} onChangeText={(t) => set({ name: t })} />
          <Field label="Destination" icon="location-outline" placeholder="e.g. Goa" value={profile.destination ?? ''} onChangeText={(t) => set({ destination: t })} />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}><Field label="Budget (INR)" icon="wallet-outline" placeholder="20000" keyboardType="number-pad" value={profile.budget ? String(profile.budget) : ''} onChangeText={(t) => set({ budget: t })} /></View>
            <View style={{ flex: 1 }}><Field label="Age group" icon="people-outline" placeholder="26-35" value={profile.ageGroup ?? ''} onChangeText={(t) => set({ ageGroup: t })} /></View>
          </View>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="caption" tone="muted" style={{ fontWeight: '600' }}>TRAVEL STYLE</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {STYLES.map((s) => <Chip key={s} label={s} active={profile.travelStyle === s} onPress={() => set({ travelStyle: s })} />)}
            </View>
          </View>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="caption" tone="muted" style={{ fontWeight: '600' }}>INTERESTS</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {INTERESTS.map((i) => <Chip key={i} label={i} active={profile.interests?.includes(i)} onPress={() => toggle(i)} />)}
            </View>
          </View>
          <Field label="Short bio" icon="document-text-outline" placeholder="Tell travellers about you" value={profile.bio ?? ''} onChangeText={(t) => set({ bio: t })} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Chip label={dating ? '❤️ Dating mode ON' : 'Dating mode OFF'} icon="heart" active={dating} onPress={() => setDating((d) => !d)} />
            <AppText variant="caption" tone="muted" style={{ flex: 1 }}>Opt-in, privacy-controlled</AppText>
          </View>
          <Button label={saving || loading ? 'Finding matches…' : 'Save & find matches'} icon="sparkles" loading={saving || loading} onPress={saveAndFind} fullWidth />
          <Button label={locating ? 'Locating…' : 'Find travellers near me'} icon="navigate" variant="secondary" loading={locating} onPress={findNearby} fullWidth />
        </Card>

        {nearby && (
          <Card padded style={{ gap: spacing.sm }}>
            <AppText variant="subtitle">📍 Nearby travellers</AppText>
            {nearby.length === 0 ? <AppText tone="muted" variant="caption">None nearby yet (exact location stays private — only distance is shared).</AppText> :
              nearby.map((n, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Ionicons name="person-circle" size={22} color={colors.primary} />
                  <AppText style={{ flex: 1 }}>{n.name || 'Traveller'} · <AppText tone="muted" variant="caption">{n.travelStyle || ''}</AppText></AppText>
                  <Badge label={`~${n.approxDistanceKm} km`} tone="neutral" />
                </View>
              ))}
          </Card>
        )}

        {matches && matches.length === 0 && <EmptyState icon="people-outline" title="No matches yet" message="You're discoverable now. Check back as more travellers join." />}

        {matches?.map((m) => (
          <Card key={m.userId} padded style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                <AppText variant="subtitle" tone="primary">{(m.name || 'T')[0].toUpperCase()}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="subtitle">{m.name || 'Traveller'}</AppText>
                <AppText tone="muted" variant="caption">{m.travelStyle || 'traveller'} · {m.destination || ''}</AppText>
              </View>
              <Badge label={`${m.compatibility}% match`} tone={m.compatibility >= 70 ? 'success' : m.compatibility >= 40 ? 'primary' : 'neutral'} />
            </View>
            {m.bio ? <AppText tone="muted" variant="caption">{m.bio}</AppText> : null}
            {m.interests?.length ? <AppText variant="caption" tone="muted">Interests: {m.interests.join(', ')}</AppText> : null}
            {verdicts[m.userId] ? <AppText variant="caption" tone={/high/i.test(verdicts[m.userId]) ? 'danger' : 'muted'}>🛡 {verdicts[m.userId]}</AppText> : null}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {followed.has(m.userId)
                ? <Button label="Connected ✓" size="sm" variant="secondary" icon="checkmark-circle" onPress={() => {}} />
                : <Button label="Connect" size="sm" variant="secondary" icon="person-add" onPress={() => connect(m)} />}
              <Button label="Trust check" size="sm" variant="ghost" icon="shield-checkmark" onPress={() => trustCheck(m)} />
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
