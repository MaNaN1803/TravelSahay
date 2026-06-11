import { View, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { spacing } from '@/theme';
import { Screen, AppText } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { DestinationCard } from '@/components/DestinationCard';
import { usePlaces } from '@/state/PlacesProvider';
import { viewportAround } from '@/api/search';
import { DESTINATIONS, type Destination } from '@/lib/destinations';

export default function DestinationsScreen() {
  const router = useRouter();
  const { applyViewport } = usePlaces();

  const go = (d: Destination) => {
    applyViewport(viewportAround(d.latitude, d.longitude, 0.12), `${d.name}, ${d.country}`, d.countryCode);
    router.push('/explore');
  };

  return (
    <Screen>
      <ScreenHeader title="Popular destinations" subtitle="Tap a city to explore it" />
      <FlatList
        data={DESTINATIONS}
        keyExtractor={(d) => d.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.x3 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: '48%' }}>
            <DestinationCard destination={item} variant="tile" onPress={() => go(item)} />
            <AppText variant="caption" tone="muted" numberOfLines={1} style={{ marginTop: 4 }}>
              {item.blurb}
            </AppText>
          </View>
        )}
      />
    </Screen>
  );
}
