import { useState } from 'react';
import { View, ScrollView, Pressable, FlatList, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius, shadow } from '@/theme';
import { Screen, AppText, Skeleton, Rating, EmptyState } from '@/components/ui';
import { PlaceCard } from '@/components/PlaceCard';
import { DestinationCard } from '@/components/DestinationCard';
import { SearchModal } from '@/components/SearchModal';
import { usePlaces } from '@/state/PlacesProvider';
import { useRecentlyViewed } from '@/state/RecentlyViewedProvider';
import { useDiscover, type DiscoverSection } from '@/hooks/useDiscover';
import { useNearMe } from '@/hooks/useNearMe';
import { openPlace } from '@/lib/nav';
import { photoUrl, ALL_TYPES, TYPE_META } from '@/lib/place';
import { viewportAround } from '@/api/search';
import { DESTINATIONS, type Destination } from '@/lib/destinations';

export default function HomeScreen() {
  const { colors, scheme } = useTheme();
  const router = useRouter();
  const { setLocation, setType, applyViewport, locationLabel } = usePlaces();
  const { recent } = useRecentlyViewed();
  const { loading, error, featured, sections, refresh } = useDiscover();
  const { goNearMe, loading: nearLoading } = useNearMe();
  const [searchOpen, setSearchOpen] = useState(false);

  const surprise = () => {
    const pool = sections.flatMap((s) => s.items);
    if (pool.length === 0) return;
    const pick = pool[Math.floor((Date.now() / 1000) % pool.length)];
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    openPlace(pick.place, pick.type);
  };

  const goCategory = (t: (typeof ALL_TYPES)[number]) => {
    setType(t);
    router.push('/explore');
  };

  const goDestination = (d: Destination) => {
    applyViewport(viewportAround(d.latitude, d.longitude, 0.12), `${d.name}, ${d.country}`, d.countryCode);
    router.push('/explore');
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.x3 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" tone="muted">
                Welcome back 👋
              </AppText>
              <AppText variant="title">Let&apos;s explore</AppText>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <IconBtn icon="time-outline" onPress={() => router.push('/recently')} />
              <IconBtn icon="heart-outline" onPress={() => router.push('/favorites')} />
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
              Search destinations, places…
            </AppText>
            <Ionicons name="options-outline" size={18} color={colors.primary} />
          </Pressable>

          {/* Quick actions */}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <QuickAction icon="navigate" label={nearLoading ? 'Locating…' : 'Near me'} onPress={goNearMe} />
            <QuickAction icon="sparkles" label="Surprise me" onPress={surprise} />
            <QuickAction icon="map" label="Map" onPress={() => router.push('/map')} />
          </View>

          {/* Categories */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {ALL_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => goCategory(t)}
                style={{ alignItems: 'center', gap: 8, flex: 1 }}
              >
                <View
                  style={[
                    {
                      width: 64,
                      height: 64,
                      borderRadius: 22,
                      backgroundColor: colors.primaryMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    shadow(scheme, 1),
                  ]}
                >
                  <Ionicons name={TYPE_META[t].icon} size={26} color={colors.primary} />
                </View>
                <AppText variant="caption" style={{ fontWeight: '600' }}>
                  {TYPE_META[t].label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Popular destinations */}
        <Section title="Popular destinations" subtitle="Tap a city to explore" onSeeAll={() => router.push('/destinations')}>
          <FlatList
            horizontal
            data={DESTINATIONS}
            keyExtractor={(d) => d.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
            renderItem={({ item }) => (
              <DestinationCard destination={item} onPress={() => goDestination(item)} />
            )}
          />
        </Section>

        {/* Featured hero */}
        {loading ? (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
            <Skeleton height={200} rounded={radius.xl} />
          </View>
        ) : featured ? (
          <Pressable
            onPress={() => openPlace(featured.place, featured.type)}
            style={{ marginTop: spacing.xl, marginHorizontal: spacing.lg, borderRadius: radius.xl, overflow: 'hidden', height: 210 }}
          >
            <Image source={{ uri: photoUrl(featured.place, 'large') }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={250} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 130 }} />
            <View style={{ position: 'absolute', top: 14, left: 14, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="star" size={12} color={colors.onPrimary} />
              <AppText style={{ color: colors.onPrimary, fontSize: 11, fontWeight: '800' }}>EDITOR&apos;S PICK</AppText>
            </View>
            <View style={{ position: 'absolute', left: 16, right: 16, bottom: 14, gap: 4 }}>
              <AppText variant="heading" style={{ color: '#fff' }} numberOfLines={1}>
                {featured.place.name}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Rating value={featured.place.rating} reviews={featured.place.num_reviews} />
                <AppText style={{ color: 'rgba(255,255,255,0.9)' }} variant="caption" numberOfLines={1}>
                  {featured.place.location_string}
                </AppText>
              </View>
            </View>
          </Pressable>
        ) : null}

        {/* Recently viewed */}
        {recent.length > 0 && (
          <Section title="Jump back in" subtitle="Recently viewed">
            <FlatList
              horizontal
              data={recent.slice(0, 10)}
              keyExtractor={(i) => i.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
              renderItem={({ item }) => (
                <PlaceCard place={item.place} type={item.type} variant="compact" onPress={() => openPlace(item.place, item.type)} />
              )}
            />
          </Section>
        )}

        {/* Discover sections */}
        {loading ? (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl, flexDirection: 'row', gap: spacing.md }}>
            {[0, 1].map((i) => (
              <View key={i} style={{ gap: 8 }}>
                <Skeleton width={210} height={130} rounded={radius.lg} />
                <Skeleton width={140} height={14} />
                <Skeleton width={90} height={12} />
              </View>
            ))}
          </View>
        ) : error ? (
          <EmptyState icon="cloud-offline" title="Couldn't load" message={error} actionLabel="Retry" onAction={refresh} />
        ) : (
          sections.map((s) => (
            <Carousel key={s.key} section={s} onSeeAll={() => router.push('/explore')} />
          ))
        )}
      </ScrollView>

      <SearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} onSelect={setLocation} />
    </Screen>
  );
}

function Carousel({ section, onSeeAll }: { section: DiscoverSection; onSeeAll: () => void }) {
  return (
    <Section title={section.title} subtitle={section.subtitle} onSeeAll={onSeeAll}>
      <FlatList
        horizontal
        data={section.items}
        keyExtractor={(i, idx) => `${section.key}-${i.place.location_id}-${idx}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
        renderItem={({ item }) => (
          <PlaceCard place={item.place} type={item.type} variant="compact" onPress={() => openPlace(item.place, item.type)} />
        )}
      />
    </Section>
  );
}

function Section({
  title,
  subtitle,
  onSeeAll,
  children,
}: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={{ marginTop: spacing.xl, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg }}>
        <View>
          <AppText variant="heading">{title}</AppText>
          {subtitle && (
            <AppText tone="muted" variant="caption">
              {subtitle}
            </AppText>
          )}
        </View>
        {onSeeAll && (
          <Pressable hitSlop={8} onPress={onSeeAll}>
            <AppText tone="primary" variant="caption" style={{ fontWeight: '700' }}>
              See all
            </AppText>
          </Pressable>
        )}
      </View>
      {children}
    </Animated.View>
  );
}

function IconBtn({ icon, onPress }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.md,
        paddingVertical: 12,
      }}
    >
      <Ionicons name={icon} size={16} color={colors.primary} />
      <AppText variant="caption" style={{ fontWeight: '600' }} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}
