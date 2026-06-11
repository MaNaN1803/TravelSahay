import { useEffect, useState } from 'react';
import { ScrollView, View, ActivityIndicator, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, Card, Button, Field, Badge } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { useTrips } from '@/state/TripsProvider';
import { useDiary } from '@/state/DiaryProvider';
import { storage } from '@/lib/storage';
import { community, type Gamification } from '@/api/community';

const BADGES_KEY = 'ts.challengeBadges';
type EarnedBadge = { reward: string; title: string; at: number };

export default function RewardsScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const { trips } = useTrips();
  const { entries } = useDiary();
  const [game, setGame] = useState<Gamification | null>(null);
  const [referral, setReferral] = useState<{ code: string; shareText: string; reward: string } | null>(null);
  const [metrics, setMetrics] = useState<Record<string, number> | null>(null);
  const [challengeDest, setChallengeDest] = useState('');
  const [challenges, setChallenges] = useState<any[] | null>(null);
  const [loadingC, setLoadingC] = useState(false);
  const [earned, setEarned] = useState<EarnedBadge[]>([]);

  // Load collected challenge badges (persisted locally).
  useEffect(() => {
    storage.get<EarnedBadge[]>(BADGES_KEY).then((b) => b && setEarned(b));
  }, []);

  const claim = (c: any) => {
    const reward = c.reward ?? c.title;
    if (earned.some((e) => e.reward === reward)) return; // already collected
    const next = [{ reward, title: c.title, at: Date.now() }, ...earned];
    setEarned(next);
    storage.set(BADGES_KEY, next);
  };
  const isClaimed = (c: any) => earned.some((e) => e.reward === (c.reward ?? c.title));

  // Distinct cities from saved trip stops.
  const cities = new Set<string>();
  trips.forEach((t) => t.stops.forEach((s) => s.place?.location_string && cities.add(s.place.location_string)));

  useEffect(() => {
    if (!token) return;
    community.gamification({ trips: trips.length, cities: cities.size, diary: entries.length }, token).then((r) => setGame(r.gamification)).catch(() => {});
    community.referral(token).then((r) => setReferral(r.referral)).catch(() => {});
    community.metrics(token).then((r) => setMetrics(r.metrics)).catch(() => {});
  }, [token, trips.length, entries.length]);

  const getChallenges = async () => {
    if (!token) return;
    setLoadingC(true);
    try { const r = await community.challenges({ destination: challengeDest || undefined }, token); setChallenges(r.challenges); } finally { setLoadingC(false); }
  };

  const share = () => { if (referral) Share.share({ message: referral.shareText }).catch(() => {}); };

  return (
    <Screen>
      <ScreenHeader title="Rewards" subtitle="Levels · badges · referrals" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 }}>
        {game && (
          <Card padded style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <AppText style={{ color: colors.onPrimary, fontWeight: '800', fontSize: 22 }}>{game.level}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="subtitle">Level {game.level} Explorer</AppText>
                <AppText tone="muted" variant="caption">{game.xp} XP · {game.toNext} XP to next level</AppText>
                <View style={{ height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, marginTop: 6, overflow: 'hidden' }}>
                  <View style={{ height: 8, width: `${Math.min(100, (game.xp / game.nextLevelXp) * 100)}%`, backgroundColor: colors.primary }} />
                </View>
              </View>
            </View>
            <AppText tone="muted">Explorer score: <AppText tone="primary">{game.explorerScore}/100</AppText></AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 }}>
              {game.badges.length === 0 ? <AppText tone="muted" variant="caption">Take trips & write diary entries to earn badges.</AppText> :
                game.badges.map((b) => (
                  <View key={b.id} style={{ alignItems: 'center', gap: 2, width: 72 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={b.icon as any} size={24} color={colors.primary} />
                    </View>
                    <AppText variant="caption" tone="muted" center numberOfLines={2}>{b.label}</AppText>
                  </View>
                ))}
            </View>
          </Card>
        )}

        <Card padded style={{ gap: spacing.md }}>
          <AppText variant="subtitle">🎯 Travel challenges</AppText>
          <Field label="Destination (optional)" icon="location-outline" placeholder="e.g. Rajasthan" value={challengeDest} onChangeText={setChallengeDest} />
          <Button label={loadingC ? 'Generating…' : 'Get challenges'} icon="sparkles" loading={loadingC} onPress={getChallenges} fullWidth />
          {challenges?.map((c, i) => {
            const claimed = isClaimed(c);
            return (
              <View key={i} style={{ gap: 4, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border, paddingTop: i === 0 ? 0 : 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <AppText style={{ fontWeight: '700', flex: 1 }}>{c.title}</AppText>
                  {c.difficulty && <Badge label={c.difficulty} tone="neutral" />}
                </View>
                <AppText tone="muted" variant="caption">{c.goal}</AppText>
                {c.reward && <AppText variant="caption" tone="primary">🏅 {c.reward}</AppText>}
                <Button
                  label={claimed ? 'Collected ✓' : 'Mark done & collect'}
                  size="sm"
                  variant={claimed ? 'secondary' : 'primary'}
                  icon={claimed ? 'checkmark-circle' : 'flag'}
                  onPress={() => claim(c)}
                  disabled={claimed}
                />
              </View>
            );
          })}
        </Card>

        {earned.length > 0 && (
          <Card padded style={{ gap: spacing.sm }}>
            <AppText variant="subtitle">🏅 Collected challenge badges ({earned.length})</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {earned.map((b, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryMuted, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Ionicons name="ribbon" size={15} color={colors.primary} />
                  <AppText variant="caption" tone="primary" style={{ fontWeight: '700' }}>{b.reward}</AppText>
                </View>
              ))}
            </View>
          </Card>
        )}

        {referral && (
          <Card padded style={{ gap: spacing.sm }}>
            <AppText variant="subtitle">🎁 Invite & earn</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Badge label={referral.code} tone="primary" />
              <AppText tone="muted" variant="caption" style={{ flex: 1 }}>{referral.reward}</AppText>
            </View>
            <Button label="Share invite" icon="share-social" onPress={share} fullWidth />
          </Card>
        )}

        {metrics && (
          <Card padded style={{ gap: 6 }}>
            <AppText variant="subtitle">📊 Community pulse</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              {Object.entries(metrics).map(([k, v]) => (
                <View key={k} style={{ minWidth: 90 }}>
                  <AppText variant="heading" tone="primary">{v}</AppText>
                  <AppText variant="caption" tone="muted">{k}</AppText>
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
