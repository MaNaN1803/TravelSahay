import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, Card, Button, Field, Chip, Badge, EmptyState } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { community, type OpenTrip, type OpenTripRequest } from '@/api/community';
import { ai, type BuddyAnalysis } from '@/api/ai';

const STYLES = ['backpacker', 'nomad', 'solo', 'family', 'adventure', 'luxury'];
const INTERESTS = ['Food', 'History', 'Nightlife', 'Nature', 'Beaches', 'Adventure', 'Photography'];
type Tab = 'browse' | 'mine' | 'publish';

function tone(c?: number) {
  if (c == null) return 'neutral' as const;
  return c >= 70 ? ('success' as const) : c >= 40 ? ('primary' as const) : ('neutral' as const);
}

export default function BuddiesScreen() {
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('browse');

  /* browse */
  const [browse, setBrowse] = useState<OpenTrip[] | null>(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [analysis, setAnalysis] = useState<Record<string, BuddyAnalysis | 'loading'>>({});

  /* mine */
  const [mine, setMine] = useState<OpenTrip[] | null>(null);

  /* publish */
  const [form, setForm] = useState<any>({ days: '3', maxBuddies: '3', interests: [], travelStyle: 'solo' });
  const [publishing, setPublishing] = useState(false);

  const loadBrowse = useCallback(async () => {
    if (!token) return;
    try { setBrowse((await community.browseOpenTrips(token, search.trim())).trips); } catch { setBrowse([]); }
  }, [token, search]);

  const loadMine = useCallback(async () => {
    if (!token) return;
    try { setMine((await community.myOpenTrips(token)).trips); } catch { setMine([]); }
  }, [token]);

  useEffect(() => { if (tab === 'browse' && browse === null) loadBrowse(); }, [tab, browse, loadBrowse]);
  useEffect(() => { if (tab === 'mine' && mine === null) loadMine(); }, [tab, mine, loadMine]);

  const refresh = async () => {
    setRefreshing(true);
    await (tab === 'mine' ? loadMine() : loadBrowse());
    setRefreshing(false);
  };

  const runAnalysis = async (t: OpenTrip) => {
    if (!token) return;
    setAnalysis((a) => ({ ...a, [t._id]: 'loading' }));
    try {
      const me = await community.getMatchProfile(token).then((r) => r.profile ?? {}).catch(() => ({}));
      const { analysis: res } = await ai.buddy({
        me: { name: user?.username, travelStyle: me.travelStyle, budget: me.budget, interests: me.interests, ageGroup: me.ageGroup, languages: me.languages },
        trip: { title: t.title, destination: t.destination, startDate: t.startDate, endDate: t.endDate, days: t.days, budget: t.budget, travelStyle: t.travelStyle, interests: t.interests, notes: t.notes, ownerName: t.ownerName },
        owner: { name: t.ownerName },
      }, token);
      setAnalysis((a) => ({ ...a, [t._id]: res }));
    } catch {
      setAnalysis((a) => { const n = { ...a }; delete n[t._id]; return n; });
      Alert.alert('AI unavailable', 'Could not analyse compatibility right now.');
    }
  };

  const requestJoin = (t: OpenTrip) => {
    if (!token) return;
    Alert.prompt?.('Request to join', `Send a note to ${t.ownerName}`, async (message) => {
      try {
        await community.requestOpenTrip(t._id, message ?? '', token);
        Alert.alert('Request sent', `${t.ownerName} will review your request.`);
        loadBrowse();
      } catch (e: any) { Alert.alert('Could not send', e?.message ?? 'Try again'); }
    });
    // Android has no Alert.prompt — fall back to a direct request.
    if (!Alert.prompt) {
      community.requestOpenTrip(t._id, '', token)
        .then(() => { Alert.alert('Request sent', `${t.ownerName} will review your request.`); loadBrowse(); })
        .catch((e: any) => Alert.alert('Could not send', e?.message ?? 'Try again'));
    }
  };

  const decide = async (trip: OpenTrip, r: OpenTripRequest, accept: boolean) => {
    if (!token) return;
    try {
      if (accept) await community.acceptBuddy(trip._id, r.id, token);
      else await community.rejectBuddy(trip._id, r.id, token);
      loadMine();
    } catch (e: any) { Alert.alert('Action failed', e?.message ?? 'Try again'); }
  };

  const set = (p: any) => setForm((prev: any) => ({ ...prev, ...p }));
  const toggleInterest = (i: string) =>
    set({ interests: form.interests?.includes(i) ? form.interests.filter((x: string) => x !== i) : [...(form.interests ?? []), i] });

  const publish = async () => {
    if (!token || !form.title?.trim() || !form.destination?.trim()) return;
    setPublishing(true);
    try {
      await community.publishOpenTrip({
        title: form.title.trim(), destination: form.destination.trim(),
        startDate: form.startDate, endDate: form.endDate,
        days: Number(form.days) || 3, budget: form.budget ? Number(form.budget) : 0,
        travelStyle: form.travelStyle, interests: form.interests, notes: form.notes,
        maxBuddies: Number(form.maxBuddies) || 3,
      }, token);
      setForm({ days: '3', maxBuddies: '3', interests: [], travelStyle: 'solo' });
      setMine(null);
      setTab('mine');
    } catch (e: any) { Alert.alert('Could not publish', e?.message ?? 'Try again'); }
    finally { setPublishing(false); }
  };

  return (
    <Screen>
      <ScreenHeader title="Travel Buddies" subtitle="Find companions · combine plans" />
      <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <Chip label="Browse" icon="search" active={tab === 'browse'} onPress={() => setTab('browse')} />
        <Chip label="My trips" icon="briefcase" active={tab === 'mine'} onPress={() => setTab('mine')} />
        <Chip label="Publish" icon="add-circle" active={tab === 'publish'} onPress={() => setTab('publish')} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.x3 }}
        refreshControl={tab !== 'publish' ? <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} /> : undefined}
      >
        {tab === 'browse' && (
          <>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}>
                <Field label="Search destination" icon="location-outline" placeholder="e.g. Goa" value={search} onChangeText={setSearch} onSubmitEditing={() => { setBrowse(null); loadBrowse(); }} />
              </View>
              <View style={{ paddingBottom: 2 }}>
                <Button label="Find" icon="search" size="sm" onPress={() => { setBrowse(null); loadBrowse(); }} />
              </View>
            </View>

            {browse === null ? <ActivityIndicator color={colors.primary} /> :
              browse.length === 0 ? <EmptyState icon="people-outline" title="No open trips yet" message="Be the first — publish a trip and let buddies find you." /> :
              browse.map((t) => {
                const an = analysis[t._id];
                const requested = t.myRequestStatus === 'pending';
                return (
                  <Card key={t._id} padded style={{ gap: spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                        <AppText variant="subtitle" tone="primary">{(t.ownerName || 'T')[0].toUpperCase()}</AppText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="subtitle">{t.title}</AppText>
                        <AppText tone="muted" variant="caption">by {t.ownerName} · {t.destination || 'TBD'}</AppText>
                      </View>
                      {t.compatibility != null && <Badge label={`${t.compatibility}%`} tone={tone(t.compatibility)} />}
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                      {!!t.days && <Badge label={`${t.days} days`} tone="neutral" />}
                      {!!t.budget && <Badge label={`₹${t.budget.toLocaleString()}`} tone="neutral" />}
                      {!!t.travelStyle && <Badge label={t.travelStyle} tone="neutral" />}
                      <Badge label={`${t.spotsLeft ?? 0} spot${t.spotsLeft === 1 ? '' : 's'} left`} tone={t.spotsLeft ? 'accent' : 'neutral'} />
                    </View>
                    {t.notes ? <AppText tone="muted" variant="caption">{t.notes}</AppText> : null}
                    {t.interests?.length ? <AppText variant="caption" tone="muted">Interests: {t.interests.join(', ')}</AppText> : null}

                    {an === 'loading' ? (
                      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}><ActivityIndicator color={colors.primary} size="small" /><AppText variant="caption" tone="muted">AI analysing compatibility…</AppText></View>
                    ) : an ? (
                      <View style={{ gap: 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                          <Ionicons name="sparkles" size={15} color={colors.primary} />
                          <AppText variant="caption" style={{ flex: 1, fontWeight: '700' }}>{an.verdict}</AppText>
                          <Badge label={`${an.compatibility}%`} tone={tone(an.compatibility)} />
                        </View>
                        {an.sharedStrengths?.slice(0, 3).map((s, i) => <AppText key={i} variant="caption" tone="muted">✓ {s}</AppText>)}
                        {an.potentialFriction?.slice(0, 2).map((s, i) => <AppText key={i} variant="caption" tone="muted">⚠ {s}</AppText>)}
                        {an.splitSavings ? <AppText variant="caption" tone="primary">💰 {an.splitSavings}</AppText> : null}
                        {an.icebreakers?.length ? <AppText variant="caption" tone="muted" style={{ fontStyle: 'italic' }}>💬 “{an.icebreakers[0]}”</AppText> : null}
                      </View>
                    ) : null}

                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      {t.joined ? (
                        <Button label="You're in ✓" size="sm" variant="secondary" icon="checkmark-circle" onPress={() => t.sharedTrip && router.push('/social/wallet')} />
                      ) : requested ? (
                        <Button label="Requested ✓" size="sm" variant="secondary" icon="hourglass" onPress={() => {}} />
                      ) : (
                        <Button label="Request to join" size="sm" icon="person-add" disabled={!t.spotsLeft} onPress={() => requestJoin(t)} />
                      )}
                      {!an && <Button label="AI compatibility" size="sm" variant="ghost" icon="sparkles" onPress={() => runAnalysis(t)} />}
                    </View>
                  </Card>
                );
              })}
          </>
        )}

        {tab === 'mine' && (
          mine === null ? <ActivityIndicator color={colors.primary} /> :
          mine.length === 0 ? <EmptyState icon="briefcase-outline" title="No trips yet" message="Publish an open trip or join one to see it here." /> :
          mine.map((t) => (
            <Card key={t._id} padded style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="subtitle">{t.title}</AppText>
                  <AppText tone="muted" variant="caption">{t.destination || 'TBD'} · {t.isOwner ? 'You host' : `host: ${t.ownerName}`}</AppText>
                </View>
                <Badge label={t.status} tone={t.status === 'open' ? 'success' : 'neutral'} />
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <Badge label={`${t.buddies.length} buddy${t.buddies.length === 1 ? '' : 'ies'}`} tone="primary" />
                <Badge label={`${t.spotsLeft ?? 0} spots left`} tone="neutral" />
              </View>
              {t.buddies.length ? <AppText variant="caption" tone="muted">Buddies: {t.buddies.map((b) => b.name).join(', ')}</AppText> : null}

              {t.isOwner && t.requests?.filter((r) => r.status === 'pending').length ? (
                <View style={{ gap: spacing.sm, marginTop: 2 }}>
                  <AppText variant="caption" tone="muted" style={{ fontWeight: '700' }}>JOIN REQUESTS</AppText>
                  {t.requests.filter((r) => r.status === 'pending').map((r) => (
                    <View key={r.id} style={{ gap: 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <AppText style={{ flex: 1, fontWeight: '600' }}>{r.name}</AppText>
                        <Badge label={`${r.compatibility}%`} tone={tone(r.compatibility)} />
                      </View>
                      {r.message ? <AppText variant="caption" tone="muted">“{r.message}”</AppText> : null}
                      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                        <Button label="Accept" size="sm" icon="checkmark" onPress={() => decide(t, r, true)} />
                        <Button label="Decline" size="sm" variant="ghost" icon="close" onPress={() => decide(t, r, false)} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {t.sharedTrip ? <Button label="Group wallet" size="sm" variant="secondary" icon="wallet" onPress={() => router.push('/social/wallet')} /> : null}
                {t.isOwner ? <Button label={t.status === 'open' ? 'Close' : 'Reopen'} size="sm" variant="ghost" icon="power" onPress={() => token && community.toggleOpenTrip(t._id, token).then(() => { setMine(null); loadMine(); })} /> : null}
              </View>
            </Card>
          ))
        )}

        {tab === 'publish' && (
          <Card padded style={{ gap: spacing.md }}>
            <AppText variant="subtitle">Publish an open trip</AppText>
            <AppText tone="muted" variant="caption">Travellers who match your plan can ask to join. Accept them to combine plans and share a group wallet.</AppText>
            <Field label="Trip title" icon="airplane-outline" placeholder="e.g. Goa beach week" value={form.title ?? ''} onChangeText={(t) => set({ title: t })} />
            <Field label="Destination" icon="location-outline" placeholder="e.g. Goa" value={form.destination ?? ''} onChangeText={(t) => set({ destination: t })} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}><Field label="Start date" icon="calendar-outline" placeholder="2026-07-01" value={form.startDate ?? ''} onChangeText={(t) => set({ startDate: t })} /></View>
              <View style={{ flex: 1 }}><Field label="End date" icon="calendar-outline" placeholder="2026-07-07" value={form.endDate ?? ''} onChangeText={(t) => set({ endDate: t })} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}><Field label="Days" icon="time-outline" placeholder="3" keyboardType="number-pad" value={String(form.days ?? '')} onChangeText={(t) => set({ days: t })} /></View>
              <View style={{ flex: 1 }}><Field label="Budget (INR)" icon="wallet-outline" placeholder="20000" keyboardType="number-pad" value={form.budget ? String(form.budget) : ''} onChangeText={(t) => set({ budget: t })} /></View>
              <View style={{ flex: 1 }}><Field label="Max buddies" icon="people-outline" placeholder="3" keyboardType="number-pad" value={String(form.maxBuddies ?? '')} onChangeText={(t) => set({ maxBuddies: t })} /></View>
            </View>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="caption" tone="muted" style={{ fontWeight: '600' }}>TRAVEL STYLE</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {STYLES.map((s) => <Chip key={s} label={s} active={form.travelStyle === s} onPress={() => set({ travelStyle: s })} />)}
              </View>
            </View>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="caption" tone="muted" style={{ fontWeight: '600' }}>INTERESTS</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {INTERESTS.map((i) => <Chip key={i} label={i} active={form.interests?.includes(i)} onPress={() => toggleInterest(i)} />)}
              </View>
            </View>
            <Field label="Notes (optional)" icon="document-text-outline" placeholder="What kind of buddy are you looking for?" value={form.notes ?? ''} onChangeText={(t) => set({ notes: t })} />
            <Button label={publishing ? 'Publishing…' : 'Publish open trip'} icon="megaphone" loading={publishing} onPress={publish} disabled={!form.title?.trim() || !form.destination?.trim()} fullWidth />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
