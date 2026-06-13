import { useState } from 'react';
import { Modal, View, Pressable, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius } from '@/theme';
import { AppText, Button, EmptyState } from '@/components/ui';
import { NewTripModal } from '@/components/NewTripModal';
import { useTrips } from '@/state/TripsProvider';
import { photoUrl } from '@/lib/place';
import type { Place, PlaceType } from '@/types/place';

export function AddToTripModal({
  visible,
  place,
  type,
  onClose,
}: {
  visible: boolean;
  place: Place;
  type: PlaceType;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const { trips, createTrip, addStop, isInTrip } = useTrips();
  const [newTrip, setNewTrip] = useState(false);
  // After adding, show a confirmation with a link to the trip instead of dead-ending.
  const [added, setAdded] = useState<{ id: string; title: string } | null>(null);

  const close = () => { setAdded(null); onClose(); };

  const add = (tripId: string) => {
    Haptics.selectionAsync().catch(() => {});
    addStop(tripId, place, type, 1);
    const t = trips.find((x) => x.id === tripId);
    setAdded({ id: tripId, title: t?.title ?? 'your trip' });
  };

  const onCreate = (title: string, days: number) => {
    const trip = createTrip(title, days);
    addStop(trip.id, place, type, 1);
    setAdded({ id: trip.id, title: trip.title });
  };

  const viewTrip = () => { const id = added?.id; close(); if (id) router.push(`/trips/${id}` as any); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={close} />
      <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: 34, maxHeight: '75%' }}>
        <View style={{ alignItems: 'center', paddingTop: spacing.md }}>
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border }} />
        </View>
        {added ? (
          <View style={{ padding: spacing.lg, gap: spacing.md, alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <AppText variant="heading" center>Added to {added.title}</AppText>
            <AppText tone="muted" variant="caption" center numberOfLines={2}>{place.name} is now on your itinerary.</AppText>
            <Button label="View trip" icon="arrow-forward" fullWidth onPress={viewTrip} />
            <Button label="Keep browsing" variant="ghost" fullWidth onPress={close} />
          </View>
        ) : (
          <>
        <View style={{ padding: spacing.lg, gap: 4 }}>
          <AppText variant="heading">Add to trip</AppText>
          <AppText tone="muted" variant="caption" numberOfLines={1}>
            {place.name}
          </AppText>
        </View>

        {trips.length === 0 ? (
          <View style={{ paddingVertical: spacing.lg }}>
            <EmptyState icon="airplane-outline" title="No trips yet" message="Create one to start planning." />
          </View>
        ) : (
          <FlatList
            data={trips}
            keyExtractor={(t) => t.id}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
            renderItem={({ item }) => {
              const added = isInTrip(item.id, place.location_id);
              const cover = item.stops[0]?.place;
              return (
                <Pressable
                  onPress={() => !added && add(item.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm }}
                >
                  {cover ? (
                    <Image source={{ uri: photoUrl(cover) }} style={{ width: 48, height: 48, borderRadius: radius.sm }} contentFit="cover" />
                  ) : (
                    <View style={{ width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="airplane" size={20} color={colors.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <AppText variant="subtitle" numberOfLines={1}>
                      {item.title}
                    </AppText>
                    <AppText tone="muted" variant="caption">
                      {item.stops.length} place{item.stops.length === 1 ? '' : 's'}
                    </AppText>
                  </View>
                  <Ionicons
                    name={added ? 'checkmark-circle' : 'add-circle-outline'}
                    size={24}
                    color={added ? colors.success : colors.primary}
                  />
                </Pressable>
              );
            }}
          />
        )}

        <View style={{ padding: spacing.lg }}>
          <Button label="New trip" icon="add" variant={trips.length === 0 ? 'primary' : 'secondary'} fullWidth onPress={() => setNewTrip(true)} />
        </View>
          </>
        )}
      </View>

      <NewTripModal visible={newTrip} onClose={() => setNewTrip(false)} onCreate={onCreate} />
    </Modal>
  );
}
