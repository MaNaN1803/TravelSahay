import { View, FlatList } from 'react-native';
import { useTheme, spacing } from '@/theme';
import { Screen, AppText } from '@/components/ui';
import { CategoryTabs } from '@/components/CategoryTabs';
import { PlaceCard } from '@/components/PlaceCard';
import { usePlaces } from '@/state/PlacesProvider';
import { coords } from '@/lib/place';
import { openPlace } from '@/lib/nav';

// react-native-maps is native-only. On web we degrade to a list of the
// mappable results so the app still runs in the browser during development.
export function PlacesMap() {
  const { colors } = useTheme();
  const { results, type, setType, locationLabel } = usePlaces();
  const mappable = results.filter((p) => coords(p));

  return (
    <Screen>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <AppText variant="heading">Map · {locationLabel}</AppText>
        <AppText tone="muted" variant="caption">
          Interactive map runs on iOS & Android. Showing list preview on web.
        </AppText>
        <CategoryTabs value={type} onChange={setType} />
      </View>
      <FlatList
        data={mappable}
        keyExtractor={(item) => item.location_id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.x3 }}
        renderItem={({ item }) => (
          <PlaceCard place={item} type={type} variant="list" onPress={() => openPlace(item, type)} />
        )}
      />
    </Screen>
  );
}
