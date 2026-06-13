import { View, ScrollView, Pressable, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, EmptyState, Button, Card } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PlaceCard } from '@/components/PlaceCard';
import { useTrips, type TripStop } from '@/state/TripsProvider';
import { openPlace } from '@/lib/nav';

export default function TripDetail() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trips, addDay, removeStop, moveStop } = useTrips();
  const trip = trips.find((t) => t.id === id);

  if (!trip) {
    return (
      <Screen>
        <ScreenHeader title="Trip" />
        <EmptyState icon="alert-circle-outline" title="Trip not found" />
      </Screen>
    );
  }

  const shareTrip = () => {
    const lines = [`🗺️ ${trip.title} (${trip.days} days)`, ''];
    for (let d = 1; d <= trip.days; d++) {
      const stops = trip.stops.filter((s) => s.day === d);
      if (stops.length === 0) continue;
      lines.push(`Day ${d}:`);
      stops.forEach((s) => lines.push(`  • ${s.place.name}`));
    }
    lines.push('', 'Planned with TravelSahay');
    Share.share({ message: lines.join('\n') }).catch(() => {});
  };

  const days = Array.from({ length: trip.days }, (_, i) => i + 1);
  // Best-effort destination for AI deep-links (strip the "(AI)" suffix, fall back to a stop).
  const destination = trip.title.replace(/\s*\(AI\)\s*$/i, '').trim() || trip.stops[0]?.place.location_string || '';

  const aiActions = (
    <Card padded style={{ gap: spacing.sm }}>
      <AppText variant="subtitle">✨ AI actions for this trip</AppText>
      <Button label="Get budget" icon="wallet" variant="secondary" onPress={() => router.push({ pathname: '/ai/budget', params: { destination, days: String(trip.days) } })} fullWidth />
      <Button label="Packing list" icon="briefcase" variant="secondary" onPress={() => router.push({ pathname: '/ai/packing', params: { destination, days: String(trip.days) } })} fullWidth />
      <Button label="Generate memories" icon="sparkles" variant="secondary" onPress={() => router.push('/ai/memories')} fullWidth />
      <Button label="Find travel buddies" icon="people" variant="secondary" onPress={() => router.push('/social/buddies')} fullWidth />
      <Button label="Share trip" icon="share-social" variant="ghost" onPress={shareTrip} fullWidth />
    </Card>
  );

  return (
    <Screen>
      <ScreenHeader
        title={trip.title}
        subtitle={`${trip.days} days · ${trip.stops.length} places`}
        right={
          <Pressable hitSlop={8} onPress={shareTrip}>
            <Ionicons name="share-outline" size={22} color={colors.primary} />
          </Pressable>
        }
      />

      {trip.stops.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
          <EmptyState icon="location-outline" title="No places yet" message="Browse and tap 'Add to trip' on any place to build your itinerary." />
          <View style={{ paddingHorizontal: spacing.x2 }}>
            <Button label="Find places" icon="compass" onPress={() => router.push('/explore')} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.x3 }}>
          {days.map((day) => {
            const stops = trip.stops.filter((s) => s.day === day);
            return (
              <View key={day} style={{ gap: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <AppText style={{ color: colors.onPrimary, fontWeight: '800' }}>{day}</AppText>
                  </View>
                  <AppText variant="subtitle">Day {day}</AppText>
                  <AppText tone="muted" variant="caption">
                    · {stops.length} stop{stops.length === 1 ? '' : 's'}
                  </AppText>
                </View>

                {stops.length === 0 ? (
                  <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center' }}>
                    <AppText tone="muted" variant="caption">
                      Nothing planned. Move a place here or add one.
                    </AppText>
                  </View>
                ) : (
                  stops.map((s) => (
                    <StopRow
                      key={s.id}
                      stop={s}
                      maxDay={trip.days}
                      onOpen={() => openPlace(s.place, s.type)}
                      onMove={(d) => moveStop(trip.id, s.id, d)}
                      onRemove={() =>
                        Alert.alert('Remove', `Remove ${s.place.name} from this trip?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => removeStop(trip.id, s.id) },
                        ])
                      }
                    />
                  ))
                )}
              </View>
            );
          })}

          <Button label="Add a day" icon="add" variant="secondary" onPress={() => addDay(trip.id)} />
          {aiActions}
        </ScrollView>
      )}
    </Screen>
  );
}

function StopRow({
  stop,
  maxDay,
  onOpen,
  onMove,
  onRemove,
}: {
  stop: TripStop;
  maxDay: number;
  onOpen: () => void;
  onMove: (day: number) => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <PlaceCard place={stop.place} type={stop.type} variant="list" onPress={onOpen} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs }}>
        <MiniBtn icon="arrow-back" disabled={stop.day <= 1} onPress={() => onMove(stop.day - 1)} />
        <AppText tone="muted" variant="caption">
          Day {stop.day}
        </AppText>
        <MiniBtn icon="arrow-forward" disabled={stop.day >= maxDay} onPress={() => onMove(stop.day + 1)} />
        <View style={{ flex: 1 }} />
        <Pressable hitSlop={8} onPress={onRemove} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="trash-outline" size={15} color={colors.danger} />
          <AppText variant="caption" style={{ color: colors.danger }}>
            Remove
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function MiniBtn({ icon, onPress, disabled }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Ionicons name={icon} size={15} color={colors.primary} />
    </Pressable>
  );
}
