import { useMemo, useState } from 'react';
import { View, FlatList, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing } from '@/theme';
import { Screen, AppText, EmptyState, Chip } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PlaceCard } from '@/components/PlaceCard';
import { useFavorites } from '@/state/FavoritesProvider';
import { openPlace } from '@/lib/nav';
import { ALL_TYPES, TYPE_META } from '@/lib/place';
import type { PlaceType } from '@/types/place';

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const { favorites, clear } = useFavorites();
  const [filter, setFilter] = useState<PlaceType | 'all'>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? favorites : favorites.filter((f) => f.type === filter)),
    [favorites, filter],
  );

  const confirmClear = () =>
    Alert.alert('Clear favorites', 'Remove all saved places?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear all', style: 'destructive', onPress: clear },
    ]);

  return (
    <Screen>
      <ScreenHeader
        title="Favorites"
        subtitle={`${favorites.length} saved place${favorites.length === 1 ? '' : 's'}`}
        right={
          favorites.length > 0 ? (
            <Pressable hitSlop={8} onPress={confirmClear} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <AppText style={{ color: colors.danger, fontWeight: '600' }}>Clear</AppText>
            </Pressable>
          ) : undefined
        }
      />

      {favorites.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            icon="heart-outline"
            title="No favorites yet"
            message="Tap the heart on any place to save it here for quick access."
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.x3, gap: spacing.md }}
          ListHeaderComponent={
            <View style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm }}>
              <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
              {ALL_TYPES.map((t) => (
                <Chip
                  key={t}
                  label={TYPE_META[t].label}
                  icon={TYPE_META[t].icon}
                  active={filter === t}
                  onPress={() => setFilter(t)}
                />
              ))}
            </View>
          }
          renderItem={({ item }) => (
            <PlaceCard place={item.place} type={item.type} variant="list" onPress={() => openPlace(item.place, item.type)} />
          )}
          ListEmptyComponent={
            <View style={{ paddingTop: spacing.x2 }}>
              <EmptyState
                icon="filter"
                title={`No ${filter === 'all' ? '' : TYPE_META[filter as PlaceType].label.toLowerCase()} saved`}
                message="Switch category or save more places."
              />
            </View>
          }
        />
      )}
    </Screen>
  );
}
