import { useState } from 'react';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, Card, Button, Field, Badge, EmptyState } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { community, type PoolGroup } from '@/api/community';

const TIER_TONE: Record<string, any> = { budget: 'success', moderate: 'primary', luxury: 'accent', flex: 'neutral' };

export default function PoolingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { token } = useAuth();
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [groups, setGroups] = useState<PoolGroup[] | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Turn a pool group into an actionable shared trip (wallet + cost split).
  const startWallet = async (g: PoolGroup) => {
    if (!token) return;
    setBusyKey(g.key + 'w');
    try {
      await community.createShared({ title: `${g.destination} ${g.budgetTier} pool`, destination: g.destination, days: 3 }, token);
      router.push('/social/wallet');
    } finally { setBusyKey(null); }
  };
  // Open a coordination channel for the group.
  const openChannel = async (g: PoolGroup) => {
    if (!token) return;
    setBusyKey(g.key + 'c');
    try {
      await community.createChannel({ name: `${g.destination} pool (${g.budgetTier})`, destination: g.destination }, token);
      router.push('/social/channels');
    } finally { setBusyKey(null); }
  };

  const search = async () => {
    if (!token || !destination.trim()) return;
    setLoading(true);
    try {
      // Make sure I'm discoverable for this destination before clustering.
      await community.saveMatchProfile({ destination: destination.trim(), budget: budget ? Number(budget) : undefined, openToGroups: true, active: true }, token);
      const r = await community.pooling(destination.trim(), token);
      setGroups(r.groups);
    } finally { setLoading(false); }
  };

  const joinPool = async () => {
    if (!token || !destination.trim()) return;
    setJoining(true);
    try {
      await community.saveMatchProfile({ destination: destination.trim(), budget: budget ? Number(budget) : undefined, openToGroups: true, active: true }, token);
      const r = await community.pooling(destination.trim(), token);
      setGroups(r.groups);
    } finally { setJoining(false); }
  };

  return (
    <Screen>
      <ScreenHeader title="Travel Pooling" subtitle="Cluster · split costs · bulk deals" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 }}>
        <Card padded style={{ gap: spacing.md }}>
          <AppText tone="muted">Find or form a travel group by destination & budget. AI clusters travellers so you split transport, share stays and unlock bulk deals.</AppText>
          <Field label="Destination" icon="location-outline" placeholder="e.g. Goa" value={destination} onChangeText={setDestination} />
          <Field label="Budget (INR, optional)" icon="wallet-outline" placeholder="e.g. 20000" keyboardType="number-pad" value={budget} onChangeText={setBudget} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}><Button label={loading ? 'Searching…' : 'Find groups'} icon="search" loading={loading} onPress={search} disabled={!destination.trim()} fullWidth /></View>
            <View style={{ flex: 1 }}><Button label={joining ? 'Joining…' : 'Join pool'} icon="people-circle" variant="secondary" loading={joining} onPress={joinPool} disabled={!destination.trim()} fullWidth /></View>
          </View>
        </Card>

        {loading && <ActivityIndicator color={colors.primary} />}

        {groups && groups.length === 0 && (
          <EmptyState icon="people-outline" title="No groups yet" message="You're now discoverable — be the first. Others searching this destination will cluster with you." />
        )}

        {groups?.map((g) => (
          <Card key={g.key} padded style={{ gap: spacing.sm, borderLeftWidth: 4, borderLeftColor: g.youIncluded ? colors.primary : colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="people-circle" size={24} color={colors.primary} />
              <AppText variant="subtitle" style={{ flex: 1, textTransform: 'capitalize' }}>{g.destination} · {g.budgetTier}</AppText>
              <Badge label={`${g.size} ${g.size === 1 ? 'traveller' : 'travellers'}`} tone={TIER_TONE[g.budgetTier] ?? 'neutral'} />
            </View>
            {g.youIncluded && <Badge label="You're in this group" tone="success" />}
            <AppText variant="caption" tone="muted">Members: {g.members.map((m) => m.name || 'Traveller').join(', ')}</AppText>
            <View style={{ gap: 2 }}>
              {g.perks.map((p, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                  <AppText variant="caption" tone="muted">{p}</AppText>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4 }}>
              <View style={{ flex: 1 }}><Button label="Group wallet" size="sm" icon="wallet" loading={busyKey === g.key + 'w'} onPress={() => startWallet(g)} fullWidth /></View>
              <View style={{ flex: 1 }}><Button label="Coordinate" size="sm" variant="secondary" icon="chatbubbles" loading={busyKey === g.key + 'c'} onPress={() => openChannel(g)} fullWidth /></View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
