import { useEffect, useState } from 'react';
import { ScrollView, View, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, Card, Button, Field, Chip, Badge } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { storage } from '@/lib/storage';
import { ai, type PackingResult } from '@/api/ai';

const STORE_KEY = 'ts.packing';
const TRIP_TYPES = ['General', 'Beach', 'Trek', 'Corporate', 'Winter', 'Backpacking'];

type Saved = { result: PackingResult; checked: string[]; destination: string };

export default function PackingScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ destination?: string; days?: string }>();
  const [destination, setDestination] = useState(params.destination ?? '');
  const [days, setDays] = useState(params.days ?? '5');
  const [tripType, setTripType] = useState('General');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PackingResult | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // Restore the last generated list so it survives navigation/offline.
  useEffect(() => {
    storage.get<Saved>(STORE_KEY).then((s) => {
      if (s?.result) {
        setResult(s.result);
        setChecked(new Set(s.checked ?? []));
        // Don't clobber a destination passed in via navigation params.
        if (!params.destination) setDestination(s.destination ?? '');
      }
    });
  }, []);

  const persist = (res: PackingResult, chk: Set<string>, dest: string) =>
    storage.set<Saved>(STORE_KEY, { result: res, checked: [...chk], destination: dest });

  const generate = async () => {
    if (!destination.trim() || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ai.packing({ destination: destination.trim(), days: Number(days) || 3, tripType: tripType.toLowerCase() }, token);
      setResult(res.packing);
      const fresh = new Set<string>();
      setChecked(fresh);
      persist(res.packing, fresh, destination.trim());
    } catch (e: any) {
      setError(e?.message ?? 'Could not build packing list');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      if (result) persist(result, next, destination);
      return next;
    });
  };

  const total = result?.categories.reduce((n, c) => n + c.items.length, 0) ?? 0;
  const done = checked.size;

  return (
    <Screen>
      <ScreenHeader title="Packing Assistant" subtitle={result ? `${done}/${total} packed` : 'Smart packing lists'} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 }}>
        <Card padded style={{ gap: spacing.md }}>
          <Field label="Destination" icon="location-outline" placeholder="e.g. Leh, Ladakh" value={destination} onChangeText={setDestination} />
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-end' }}>
            <View style={{ width: 110 }}>
              <Field label="Days" icon="calendar-outline" placeholder="5" keyboardType="number-pad" value={days} onChangeText={setDays} />
            </View>
          </View>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="caption" tone="muted" style={{ fontWeight: '600' }}>TRIP TYPE</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {TRIP_TYPES.map((t) => <Chip key={t} label={t} active={tripType === t} onPress={() => setTripType(t)} />)}
            </View>
          </View>
          {error && <AppText tone="danger">{error}</AppText>}
          <Button label={loading ? 'Building list…' : result ? 'Regenerate list' : 'Generate packing list'} icon="briefcase" loading={loading} onPress={generate} disabled={!destination.trim()} fullWidth />
        </Card>

        {result && (
          <>
            {result.weatherNote ? <AppText tone="muted" variant="caption">🌤 {result.weatherNote}</AppText> : null}
            {result.categories.map((cat) => (
              <Card key={cat.category} padded style={{ gap: spacing.sm }}>
                <AppText variant="subtitle">{cat.category}</AppText>
                {cat.items.map((item, idx) => {
                  const id = `${cat.category}:${item.name}`;
                  const on = checked.has(id);
                  return (
                    <Pressable key={idx} onPress={() => toggle(id)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 }}>
                      <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={on ? colors.success : colors.textMuted} />
                      <AppText style={{ flex: 1, textDecorationLine: on ? 'line-through' : 'none' }} tone={on ? 'muted' : 'default'}>
                        {item.name}{item.qty && item.qty > 1 ? ` ×${item.qty}` : ''}
                      </AppText>
                      {item.essential ? <Badge label="Essential" tone="accent" /> : null}
                    </Pressable>
                  );
                })}
              </Card>
            ))}
            {result.reminders?.length ? (
              <Card padded style={{ gap: 6 }}>
                <AppText variant="subtitle">🔔 Don't forget</AppText>
                {result.reminders.map((r, i) => <AppText key={i} tone="muted">• {r}</AppText>)}
              </Card>
            ) : null}

            <Card padded style={{ gap: spacing.sm }}>
              <AppText variant="subtitle">✨ Next steps for {result.destination}</AppText>
              <Button label="Plan this trip" icon="map" variant="secondary" onPress={() => router.push({ pathname: '/ai/planner', params: { destination: result.destination, days } })} fullWidth />
              <Button label="Check safety" icon="shield-checkmark" variant="secondary" onPress={() => router.push({ pathname: '/ai/assist', params: { destination: result.destination } })} fullWidth />
            </Card>
          </>
        )}

        {loading && !result && (
          <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
