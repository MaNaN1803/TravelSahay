import { useState } from 'react';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, Card, Button, Field, Chip } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { ai, type BudgetResult, type BudgetVariant } from '@/api/ai';

const TIER_COLOR: Record<string, string> = { luxury: '#D4AF37', moderate: '#4F8DF9', budget: '#46B6DC' };
const CATS: { key: keyof BudgetVariant['breakdown']; label: string; icon: any }[] = [
  { key: 'flights', label: 'Flights', icon: 'airplane' },
  { key: 'hotels', label: 'Hotels', icon: 'bed' },
  { key: 'food', label: 'Food', icon: 'restaurant' },
  { key: 'activities', label: 'Activities', icon: 'ticket' },
  { key: 'transport', label: 'Transport', icon: 'car' },
  { key: 'shopping', label: 'Shopping', icon: 'bag' },
  { key: 'emergency', label: 'Emergency', icon: 'medkit' },
];

function VariantCard({ v, currency }: { v: BudgetVariant; currency: string }) {
  const { colors } = useTheme();
  const accent = TIER_COLOR[v.tier?.toLowerCase()] ?? colors.primary;
  return (
    <Card padded style={{ gap: spacing.sm, borderLeftWidth: 4, borderLeftColor: accent }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="subtitle" style={{ textTransform: 'capitalize' }}>{v.tier}</AppText>
        <AppText variant="heading" color={accent}>{currency} {(v.breakdown.total ?? 0).toLocaleString()}</AppText>
      </View>
      {v.summary ? <AppText tone="muted" variant="caption">{v.summary}</AppText> : null}
      {v.perPersonPerDay ? <AppText variant="caption" tone="muted">≈ {currency} {v.perPersonPerDay.toLocaleString()} / person / day</AppText> : null}
      <View style={{ gap: 4, marginTop: 4 }}>
        {CATS.map((c) => {
          const val = v.breakdown[c.key];
          if (!val) return null;
          return (
            <View key={c.key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name={c.icon} size={15} color={colors.textMuted} />
              <AppText variant="caption" style={{ flex: 1 }}>{c.label}</AppText>
              <AppText variant="caption" tone="muted">{currency} {Number(val).toLocaleString()}</AppText>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export default function BudgetScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ destination?: string; days?: string }>();
  const [destination, setDestination] = useState(params.destination ?? '');
  const [days, setDays] = useState(params.days ?? '5');
  const [travelers, setTravelers] = useState('2');
  const [origin, setOrigin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BudgetResult | null>(null);

  const generate = async () => {
    if (!destination.trim() || !token) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await ai.budget(
        { destination: destination.trim(), days: Number(days) || 3, travelers: Number(travelers) || 1, origin: origin || undefined, currency: 'INR' },
        token,
      );
      setResult(res.budget);
    } catch (e: any) {
      setError(e?.message ?? 'Could not estimate budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Smart Budget" subtitle="Luxury · Moderate · Budget" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 }}>
        {!result && (
          <>
            <Field label="Destination" icon="location-outline" placeholder="e.g. Bali, Indonesia" value={destination} onChangeText={setDestination} />
            <Field label="From (origin, optional)" icon="navigate-outline" placeholder="e.g. Mumbai" value={origin} onChangeText={setOrigin} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Field label="Days" icon="calendar-outline" placeholder="5" keyboardType="number-pad" value={days} onChangeText={setDays} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Travellers" icon="people-outline" placeholder="2" keyboardType="number-pad" value={travelers} onChangeText={setTravelers} />
              </View>
            </View>
            {error && <AppText tone="danger">{error}</AppText>}
            <Button label={loading ? 'Estimating…' : 'Estimate budget'} icon="wallet" loading={loading} onPress={generate} disabled={!destination.trim()} fullWidth />
          </>
        )}

        {result && (
          <>
            <AppText variant="heading">{result.destination}</AppText>
            {result.variants.map((v) => <VariantCard key={v.tier} v={v} currency={result.currency} />)}
            {result.emergencyReserveSuggestion ? (
              <Card padded style={{ gap: 4 }}>
                <AppText variant="subtitle">🛟 Emergency reserve</AppText>
                <AppText tone="muted">Keep aside ~{result.currency} {result.emergencyReserveSuggestion.toLocaleString()}.</AppText>
              </Card>
            ) : null}
            {result.forecastNote ? (
              <Card padded style={{ gap: 4 }}>
                <AppText variant="subtitle">📈 Forecast</AppText>
                <AppText tone="muted">{result.forecastNote}</AppText>
              </Card>
            ) : null}
            {result.moneyTips?.length ? (
              <Card padded style={{ gap: 6 }}>
                <AppText variant="subtitle">💡 Money tips</AppText>
                {result.moneyTips.map((t, i) => <AppText key={i} tone="muted">• {t}</AppText>)}
              </Card>
            ) : null}
            <Card padded style={{ gap: spacing.sm }}>
              <AppText variant="subtitle">✨ Next steps for {result.destination}</AppText>
              <Button label="Plan a trip here" icon="map" variant="secondary" onPress={() => router.push({ pathname: '/ai/planner', params: { destination: result.destination, days } })} fullWidth />
              <Button label="Build a packing list" icon="briefcase" variant="secondary" onPress={() => router.push({ pathname: '/ai/packing', params: { destination: result.destination, days } })} fullWidth />
            </Card>
            <Button label="New estimate" variant="ghost" onPress={() => setResult(null)} fullWidth />
          </>
        )}

        {loading && !result && (
          <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}>
            <ActivityIndicator color={colors.primary} />
            <AppText tone="muted" variant="caption">Crunching realistic costs…</AppText>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
