import { useState, useCallback } from 'react';
import { View, FlatList, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, Skeleton, EmptyState } from '@/components/ui';
import { CategoryTabs } from '@/components/CategoryTabs';
import { PlaceCard } from '@/components/PlaceCard';
import { SearchModal } from '@/components/SearchModal';
import { FilterSheet } from '@/components/FilterSheet';
import { usePlaces } from '@/state/PlacesProvider';
import { openPlace } from '@/lib/nav';
import { TYPE_META } from '@/lib/place';

export default function ExploreScreen() {
  const { colors } = useTheme();
  const {
    type,
    setType,
    locationLabel,
    setLocation,
    results,
    loading,
    error,
    refresh,
    filters,
    setFilters,
    activeFilterCount,
  } = usePlaces();

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const renderHeader = useCallback(
    () => (
      <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" tone="muted">
              Discover places in
            </AppText>
            <Pressable
              onPress={() => setSearchOpen(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="location" size={18} color={colors.primary} />
              <AppText variant="heading" numberOfLines={1} style={{ flexShrink: 1 }}>
                {locationLabel}
              </AppText>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={() => setSearchOpen(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: colors.surfaceAlt,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            height: 50,
          }}
        >
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <AppText tone="muted" style={{ flex: 1 }}>
            Search a city or destination
          </AppText>
        </Pressable>

        <CategoryTabs value={type} onChange={setType} />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText variant="heading">{TYPE_META[type].label}</AppText>
          <Pressable
            onPress={() => setFilterOpen(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: radius.pill,
              backgroundColor: activeFilterCount > 0 ? colors.primaryMuted : colors.surfaceAlt,
            }}
          >
            <Ionicons name="options-outline" size={16} color={colors.primary} />
            <AppText variant="caption" tone="primary" style={{ fontWeight: '700' }}>
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </AppText>
          </Pressable>
        </View>
        {!loading && !error && (
          <AppText variant="caption" tone="muted" style={{ marginTop: -8 }}>
            {results.length} result{results.length === 1 ? '' : 's'}
          </AppText>
        )}
      </View>
    ),
    [colors, locationLabel, type, setType, activeFilterCount, results.length, loading, error],
  );

  if (loading) {
    return (
      <Screen>
        <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
          {renderHeader()}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={{ width: '48%', marginBottom: spacing.lg }}>
                <Skeleton height={150} rounded={radius.lg} />
                <Skeleton height={14} width="80%" style={{ marginTop: 8 }} />
                <Skeleton height={12} width="55%" style={{ marginTop: 6 }} />
              </View>
            ))}
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={results}
        keyExtractor={(item) => item.location_id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.x3,
          gap: spacing.lg,
        }}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: '48%' }}>
            <PlaceCard place={item} type={type} onPress={() => openPlace(item, type)} />
          </View>
        )}
        ListEmptyComponent={
          error ? (
            <EmptyState
              icon="cloud-offline"
              title="Couldn't load places"
              message={error}
              actionLabel="Try again"
              onAction={refresh}
            />
          ) : (
            <EmptyState
              icon="search"
              title="No places found"
              message="Try another city, category, or relax your filters."
              actionLabel={activeFilterCount > 0 ? 'Clear filters' : undefined}
              onAction={
                activeFilterCount > 0
                  ? () => setFilters({ minRating: 0, price: [], openNow: false, sort: 'recommended' })
                  : undefined
              }
            />
          )
        }
      />

      <SearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} onSelect={setLocation} />
      <FilterSheet
        visible={filterOpen}
        initial={filters}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
      />
    </Screen>
  );
}
