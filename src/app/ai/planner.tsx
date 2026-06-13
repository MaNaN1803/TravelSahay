import { useState } from 'react';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, Card, Button, Field, Chip, Badge } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { useTrips } from '@/state/TripsProvider';
import { ai, type TripPlan, type PlanActivity } from '@/api/ai';
import type { Place, PlaceType } from '@/types/place';

const STYLES = ['Balanced', 'Adventure', 'Relaxation', 'Culture', 'Luxury', 'Budget', 'Foodie', 'Nature'];
const INTERESTS = ['Food', 'History', 'Nightlife', 'Shopping', 'Beaches', 'Hiking', 'Museums', 'Photography', 'Wildlife'];

// Map an AI activity category to one of the app's place types.
function toPlaceType(category?: string): PlaceType {
  const c = (category ?? '').toLowerCase();
  if (c.includes('food') || c.includes('restaurant') || c.includes('dining')) return 'restaurants';
  if (c.includes('hotel') || c.includes('stay') || c.includes('rest')) return 'hotels';
  return 'attractions';
}

let synthCounter = 0;
function activityToPlace(a: PlanActivity, dest: string): Place {
  synthCounter += 1;
  return {
    location_id: `ai-${Date.now().toString(36)}-${synthCounter}`,
    name: a.title,
    description: a.description,
    location_string: a.location ?? dest,
    address: a.location,
  };
}

export default function PlannerScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { token } = useAuth();
  const { createTrip, addStop } = useTrips();
  const params = useLocalSearchParams<{ destination?: string; days?: string }>();

  const [destination, setDestination] = useState(params.destination ?? '');
  const [days, setDays] = useState(params.days ?? '3');
  const [budget, setBudget] = useState('');
  const [travelers, setTravelers] = useState('2');
  const [style, setStyle] = useState('Balanced');
  const [interests, setInterests] = useState<string[]>(['Food']);
  const [accessibility, setAccessibility] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [saved, setSaved] = useState(false);

  const toggleInterest = (i: string) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const generate = async () => {
    if (!destination.trim() || !token) return;
    setLoading(true);
    setError(null);
    setPlan(null);
    setSaved(false);
    try {
      const res = await ai.plan(
        {
          destination: destination.trim(),
          days: Number(days) || 3,
          budget: budget ? Number(budget) : undefined,
          currency: 'INR',
          travelers: Number(travelers) || 1,
          style,
          preferences: interests,
          accessibility: accessibility || undefined,
        },
        token,
      );
      setPlan(res.plan);
    } catch (e: any) {
      setError(e?.message ?? 'Could not generate plan');
    } finally {
      setLoading(false);
    }
  };

  const saveToTrips = () => {
    if (!plan) return;
    const trip = createTrip(`${plan.destination} (AI)`, plan.days.length);
    for (const day of plan.days) {
      for (const act of day.activities) {
        const place = activityToPlace(act, plan.destination);
        addStop(trip.id, place, toPlaceType(act.category), day.day);
      }
    }
    setSaved(true);
  };

  return (
    <Screen>
      <ScreenHeader title="AI Trip Planner" subtitle="Smart day-by-day itineraries" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 }}>
        {!plan && (
          <>
            <Field label="Destination" icon="location-outline" placeholder="e.g. Jaipur, India" value={destination} onChangeText={setDestination} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Field label="Days" icon="calendar-outline" placeholder="3" keyboardType="number-pad" value={days} onChangeText={setDays} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Travellers" icon="people-outline" placeholder="2" keyboardType="number-pad" value={travelers} onChangeText={setTravelers} />
              </View>
            </View>
            <Field label="Total budget (INR, optional)" icon="wallet-outline" placeholder="e.g. 20000" keyboardType="number-pad" value={budget} onChangeText={setBudget} />

            <View style={{ gap: spacing.sm }}>
              <AppText variant="caption" tone="muted" style={{ fontWeight: '600' }}>TRAVEL STYLE</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {STYLES.map((s) => (
                  <Chip key={s} label={s} active={style === s} onPress={() => setStyle(s)} />
                ))}
              </View>
            </View>

            <View style={{ gap: spacing.sm }}>
              <AppText variant="caption" tone="muted" style={{ fontWeight: '600' }}>INTERESTS</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {INTERESTS.map((i) => (
                  <Chip key={i} label={i} active={interests.includes(i)} onPress={() => toggleInterest(i)} />
                ))}
              </View>
            </View>

            <Field label="Accessibility needs (optional)" icon="accessibility-outline" placeholder="e.g. wheelchair access" value={accessibility} onChangeText={setAccessibility} />

            {error && <AppText tone="danger">{error}</AppText>}

            <Button label={loading ? 'Planning your trip…' : 'Generate itinerary'} icon="sparkles" loading={loading} onPress={generate} disabled={!destination.trim()} fullWidth />
          </>
        )}

        {plan && (
          <>
            <Card padded style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Ionicons name="map" size={22} color={colors.primary} />
                <AppText variant="heading" style={{ flex: 1 }}>{plan.destination}</AppText>
                <Badge label={`${plan.days.length} days`} tone="primary" />
              </View>
              <AppText tone="muted">{plan.overview}</AppText>
              {plan.budgetBreakdown?.total ? (
                <AppText variant="caption" tone="primary">Est. total: {plan.currency} {plan.budgetBreakdown.total.toLocaleString()}</AppText>
              ) : null}
            </Card>

            {plan.days.map((day) => (
              <Card key={day.day} padded style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <AppText style={{ color: colors.onPrimary, fontWeight: '800' }}>{day.day}</AppText>
                  </View>
                  <AppText variant="subtitle" style={{ flex: 1 }}>{day.title ?? `Day ${day.day}`}</AppText>
                </View>
                {day.summary ? <AppText tone="muted" variant="caption">{day.summary}</AppText> : null}
                {day.activities.map((a, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', gap: spacing.md, paddingVertical: 6, borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: colors.border }}>
                    <AppText variant="caption" tone="primary" style={{ width: 58, fontWeight: '700' }}>{a.time}</AppText>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText style={{ fontWeight: '600' }}>{a.title}</AppText>
                      {a.description ? <AppText tone="muted" variant="caption">{a.description}</AppText> : null}
                      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 2 }}>
                        {a.location ? <AppText variant="caption" tone="muted">📍 {a.location}</AppText> : null}
                        {a.estimatedCost ? <AppText variant="caption" tone="muted">💰 {plan.currency} {a.estimatedCost}</AppText> : null}
                      </View>
                    </View>
                  </View>
                ))}
              </Card>
            ))}

            {plan.hiddenGems?.length ? (
              <Card padded style={{ gap: 6 }}>
                <AppText variant="subtitle">💎 Hidden gems</AppText>
                {plan.hiddenGems.map((g, i) => <AppText key={i} tone="muted">• {g}</AppText>)}
              </Card>
            ) : null}
            {plan.foodRecommendations?.length ? (
              <Card padded style={{ gap: 6 }}>
                <AppText variant="subtitle">🍽 Food to try</AppText>
                {plan.foodRecommendations.map((g, i) => <AppText key={i} tone="muted">• {g}</AppText>)}
              </Card>
            ) : null}
            {plan.travelWarnings?.length ? (
              <Card padded style={{ gap: 6 }}>
                <AppText variant="subtitle" tone="danger">⚠ Travel warnings</AppText>
                {plan.travelWarnings.map((g, i) => <AppText key={i} tone="muted">• {g}</AppText>)}
              </Card>
            ) : null}
            {plan.weatherInsight ? (
              <Card padded style={{ gap: 6 }}>
                <AppText variant="subtitle">🌤 Weather</AppText>
                <AppText tone="muted">{plan.weatherInsight}</AppText>
              </Card>
            ) : null}

            {saved ? (
              <Button label="Saved! View in Trips" icon="checkmark-circle" variant="secondary" onPress={() => router.push('/(tabs)/trips')} fullWidth />
            ) : (
              <Button label="Save to my Trips" icon="airplane" onPress={saveToTrips} fullWidth />
            )}

            <Card padded style={{ gap: spacing.sm }}>
              <AppText variant="subtitle">✨ Next steps for {plan.destination}</AppText>
              <Button label="Estimate budget" icon="wallet" variant="secondary" onPress={() => router.push({ pathname: '/ai/budget', params: { destination: plan.destination, days: String(plan.days.length) } })} fullWidth />
              <Button label="Build a packing list" icon="briefcase" variant="secondary" onPress={() => router.push({ pathname: '/ai/packing', params: { destination: plan.destination, days: String(plan.days.length) } })} fullWidth />
              <Button label="Ask AI about this trip" icon="chatbubbles" variant="secondary" onPress={() => router.push({ pathname: '/ai/chat', params: { destination: plan.destination } })} fullWidth />
              <Button label="Find travel buddies" icon="people" variant="secondary" onPress={() => router.push('/social/buddies')} fullWidth />
            </Card>

            <Button label="Plan another trip" variant="ghost" onPress={() => { setPlan(null); setSaved(false); }} fullWidth />
          </>
        )}

        {loading && !plan && (
          <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}>
            <ActivityIndicator color={colors.primary} />
            <AppText tone="muted" variant="caption">Crafting your itinerary…</AppText>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
