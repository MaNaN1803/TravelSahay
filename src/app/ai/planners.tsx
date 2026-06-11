import { useState } from 'react';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, Card, Button, Field, Chip, Badge } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { useTrips } from '@/state/TripsProvider';
import { ai, type TripPlan } from '@/api/ai';
import type { Place, PlaceType } from '@/types/place';

const VERTICALS: { key: string; label: string; icon: any }[] = [
  { key: 'family', label: 'Family', icon: 'home' },
  { key: 'couple', label: 'Couple', icon: 'heart' },
  { key: 'friends', label: 'Friends', icon: 'people' },
  { key: 'corporate', label: 'Corporate', icon: 'briefcase' },
  { key: 'offsite', label: 'Team Offsite', icon: 'easel' },
  { key: 'nomad', label: 'Digital Nomad', icon: 'laptop' },
  { key: 'student', label: 'Student', icon: 'school' },
  { key: 'pilgrimage', label: 'Pilgrimage', icon: 'sparkles' },
  { key: 'wedding', label: 'Wedding', icon: 'rose' },
];

let synth = 0;
function toPlace(title: string, dest: string, location?: string): Place {
  synth += 1;
  return { location_id: `ai-${Date.now().toString(36)}-${synth}`, name: title, location_string: location ?? dest, address: location };
}
function toType(cat?: string): PlaceType {
  const c = (cat ?? '').toLowerCase();
  if (c.includes('food') || c.includes('restaurant')) return 'restaurants';
  if (c.includes('hotel') || c.includes('stay')) return 'hotels';
  return 'attractions';
}

export default function PlannersScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { token } = useAuth();
  const { createTrip, addStop } = useTrips();
  const [vertical, setVertical] = useState('family');
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('3');
  const [travelers, setTravelers] = useState('2');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    if (!destination.trim() || !token) return;
    setLoading(true); setError(null); setPlan(null); setSaved(false);
    try {
      const res = await ai.specializedPlan(vertical, { destination: destination.trim(), days: Number(days) || 3, travelers: Number(travelers) || 1, context, currency: 'INR' }, token);
      setPlan(res.plan);
    } catch (e: any) {
      setError(e?.message ?? 'Could not generate plan');
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    if (!plan) return;
    const label = VERTICALS.find((v) => v.key === vertical)?.label ?? 'Trip';
    const trip = createTrip(`${plan.destination} (${label})`, plan.days.length);
    for (const day of plan.days) for (const a of day.activities) addStop(trip.id, toPlace(a.title, plan.destination, a.location), toType(a.category), day.day);
    setSaved(true);
  };

  return (
    <Screen>
      <ScreenHeader title="Specialized Planners" subtitle="Vertical AI itineraries" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 }}>
        {!plan && (
          <>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="caption" tone="muted" style={{ fontWeight: '600' }}>PLANNER TYPE</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {VERTICALS.map((v) => <Chip key={v.key} label={v.label} icon={v.icon} active={vertical === v.key} onPress={() => setVertical(v.key)} />)}
              </View>
            </View>
            <Field label="Destination" icon="location-outline" placeholder="e.g. Udaipur" value={destination} onChangeText={setDestination} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}><Field label="Days" icon="calendar-outline" placeholder="3" keyboardType="number-pad" value={days} onChangeText={setDays} /></View>
              <View style={{ flex: 1 }}><Field label="Group size" icon="people-outline" placeholder="2" keyboardType="number-pad" value={travelers} onChangeText={setTravelers} /></View>
            </View>
            <Field label="Special context (optional)" icon="information-circle-outline" placeholder="e.g. 2 kids + grandparents" value={context} onChangeText={setContext} />
            {error && <AppText tone="danger">{error}</AppText>}
            <Button label={loading ? 'Planning…' : 'Generate itinerary'} icon="sparkles" loading={loading} onPress={generate} disabled={!destination.trim()} fullWidth />
          </>
        )}

        {plan && (
          <>
            <Card padded style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <AppText variant="heading" style={{ flex: 1 }}>{plan.destination}</AppText>
                <Badge label={VERTICALS.find((v) => v.key === vertical)?.label ?? ''} tone="primary" />
              </View>
              <AppText tone="muted">{plan.overview}</AppText>
            </Card>
            {plan.days.map((day) => (
              <Card key={day.day} padded style={{ gap: spacing.sm }}>
                <AppText variant="subtitle">{day.title ?? `Day ${day.day}`}</AppText>
                {day.activities.map((a, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: spacing.md, paddingVertical: 4 }}>
                    <AppText variant="caption" tone="primary" style={{ width: 58, fontWeight: '700' }}>{a.time}</AppText>
                    <View style={{ flex: 1 }}>
                      <AppText style={{ fontWeight: '600' }}>{a.title}</AppText>
                      {a.description ? <AppText tone="muted" variant="caption">{a.description}</AppText> : null}
                    </View>
                  </View>
                ))}
              </Card>
            ))}
            {saved ? (
              <Button label="Saved! View in Trips" icon="checkmark-circle" variant="secondary" fullWidth onPress={() => router.push('/(tabs)/trips')} />
            ) : (
              <Button label="Save to my Trips" icon="airplane" onPress={save} fullWidth />
            )}
            <Button label="Plan another" variant="ghost" onPress={() => { setPlan(null); setSaved(false); }} fullWidth />
          </>
        )}

        {loading && !plan && <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}><ActivityIndicator color={colors.primary} /></View>}
      </ScrollView>
    </Screen>
  );
}
