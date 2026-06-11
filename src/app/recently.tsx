import { View, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing } from '@/theme';
import { Screen, AppText, EmptyState } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PlaceCard } from '@/components/PlaceCard';
import { useRecentlyViewed } from '@/state/RecentlyViewedProvider';
import { openPlace } from '@/lib/nav';

export default function RecentlyScreen() {
  const { colors } = useTheme();
  const { recent, clear } = useRecentlyViewed();

  return (
    <Screen>
      <ScreenHeader
        title="Recently viewed"
        subtitle={`${recent.length} place${recent.length === 1 ? '' : 's'}`}
        right={
          recent.length > 0 ? (
            <Pressable hitSlop={8} onPress={clear}>
              <AppText style={{ color: colors.danger, fontWeight: '600' }}>Clear</AppText>
            </Pressable>
          ) : undefined
        }
      />
      {recent.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState icon="time-outline" title="Nothing here yet" message="Places you open will show up here." />
        </View>
      ) : (
        <FlatList
          data={recent}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          renderItem={({ item }) => (
            <PlaceCard place={item.place} type={item.type} variant="list" onPress={() => openPlace(item.place, item.type)} />
          )}
        />
      )}
    </Screen>
  );
}
