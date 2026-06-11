import { useState } from 'react';
import { View, FlatList, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, spacing, radius, shadow } from '@/theme';
import { Screen, AppText, EmptyState, Button } from '@/components/ui';
import { NewTripModal } from '@/components/NewTripModal';
import { useTrips, type Trip } from '@/state/TripsProvider';
import { photoUrl } from '@/lib/place';

export default function TripsScreen() {
  const { colors, scheme } = useTheme();
  const router = useRouter();
  const { trips, createTrip, deleteTrip } = useTrips();
  const [modal, setModal] = useState(false);

  const onCreate = (title: string, days: number) => {
    const trip = createTrip(title, days);
    router.push(`/trips/${trip.id}`);
  };

  const confirmDelete = (t: Trip) =>
    Alert.alert('Delete trip', `Delete "${t.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTrip(t.id) },
    ]);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg }}>
        <View>
          <AppText variant="title">Trips</AppText>
          <AppText tone="muted" variant="caption">
            Plan your next adventure
          </AppText>
        </View>
        <Pressable
          onPress={() => setModal(true)}
          style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="add" size={26} color={colors.onPrimary} />
        </Pressable>
      </View>

      {trips.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
          <EmptyState icon="airplane-outline" title="No trips yet" message="Create a trip and start adding places to build your itinerary." />
          <View style={{ paddingHorizontal: spacing.x2 }}>
            <Button label="Create your first trip" icon="add" onPress={() => setModal(true)} />
          </View>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.x3, gap: spacing.lg }}
          renderItem={({ item }) => {
            const cover = item.stops[0]?.place;
            return (
              <Pressable
                onPress={() => router.push(`/trips/${item.id}`)}
                onLongPress={() => confirmDelete(item)}
                style={[{ borderRadius: radius.xl, overflow: 'hidden', height: 170 }, shadow(scheme, 2)]}
              >
                {cover ? (
                  <Image source={{ uri: photoUrl(cover, 'large') }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <View style={{ flex: 1, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="map-outline" size={40} color={colors.primary} />
                  </View>
                )}
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 }} />
                <View style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>
                  <AppText variant="heading" style={{ color: '#fff' }} numberOfLines={1}>
                    {item.title}
                  </AppText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 4 }}>
                    <Meta icon="calendar-outline" text={`${item.days} day${item.days === 1 ? '' : 's'}`} />
                    <Meta icon="location-outline" text={`${item.stops.length} place${item.stops.length === 1 ? '' : 's'}`} />
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <NewTripModal visible={modal} onClose={() => setModal(false)} onCreate={onCreate} />
    </Screen>
  );
}

function Meta({ icon, text }: { icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={13} color="#fff" />
      <AppText style={{ color: 'rgba(255,255,255,0.92)' }} variant="caption">
        {text}
      </AppText>
    </View>
  );
}
