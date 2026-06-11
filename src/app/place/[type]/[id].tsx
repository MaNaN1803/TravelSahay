import { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Linking,
  Share,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, spacing, radius, shadow } from '@/theme';
import { AppText, Button, Badge, Chip, Skeleton } from '@/components/ui';
import { PlaceCard } from '@/components/PlaceCard';
import { AddToTripModal } from '@/components/AddToTripModal';
import { getPlaceDetails, listPlaces, getPlacePhotos } from '@/api/travelAdvisor';
import { PhotoGallery } from '@/components/PhotoGallery';
import { viewportAround } from '@/api/search';
import { placeCache } from '@/lib/placeCache';
import {
  photoUrl,
  isOpen,
  coords,
  formatHours,
  reviewText,
  distanceKm,
  formatDistance,
  TYPE_META,
} from '@/lib/place';
import { usePriceLabel } from '@/hooks/usePriceLabel';
import { openPlace } from '@/lib/nav';
import { useFavorites } from '@/state/FavoritesProvider';
import { useRecentlyViewed } from '@/state/RecentlyViewedProvider';
import { useLocation } from '@/state/LocationProvider';
import { useSettings } from '@/state/SettingsProvider';
import { usePlaces } from '@/state/PlacesProvider';
import type { Place, PlaceType, Review } from '@/types/place';

export default function PlaceDetails() {
  const { colors, scheme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ type: PlaceType; id: string }>();
  const type = (params.type ?? 'restaurants') as PlaceType;
  const id = String(params.id);

  const cached = placeCache.get(id);
  const [place, setPlace] = useState<Place | null>(cached?.place ?? null);
  const [loading, setLoading] = useState(!cached);
  const [similar, setSimilar] = useState<Place[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [tripOpen, setTripOpen] = useState(false);
  const { isFavorite, toggle } = useFavorites();
  const { track } = useRecentlyViewed();
  const { coords: myCoords } = useLocation();
  const { units } = useSettings();
  const { currency } = usePlaces();
  const priceLabel = usePriceLabel();

  useEffect(() => {
    let active = true;
    getPlaceDetails(type, id, currency)
      .then((detail) => {
        if (active && detail) setPlace((prev) => ({ ...(prev ?? {}), ...detail }) as Place);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [type, id, currency]);

  // record recently viewed once we have a place
  useEffect(() => {
    if (place) track(place, type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.location_id]);

  // similar nearby places
  useEffect(() => {
    const c = coords(place);
    if (!c) return;
    let active = true;
    listPlaces({ type, viewport: viewportAround(c.latitude, c.longitude, 0.05), limit: 12, currency })
      .then((list) => {
        if (active) setSimilar(list.filter((p) => p.location_id !== id).slice(0, 8));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [place?.location_id, type, id]);

  // photo gallery
  useEffect(() => {
    let active = true;
    getPlacePhotos(id, 8).then((urls) => active && setPhotos(urls));
    return () => {
      active = false;
    };
  }, [id]);

  if (!place) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Skeleton width="100%" height={340} rounded={0} />
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} width="31%" height={72} rounded={radius.md} />
            ))}
          </View>
          <Skeleton width="60%" height={22} />
          <Skeleton width="100%" height={16} />
          <Skeleton width="90%" height={16} />
          <Skeleton width="75%" height={16} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Skeleton width={90} height={32} rounded={radius.pill} />
            <Skeleton width={90} height={32} rounded={radius.pill} />
            <Skeleton width={90} height={32} rounded={radius.pill} />
          </View>
          <Skeleton width="100%" height={120} rounded={radius.md} />
        </View>
        <View style={{ position: 'absolute', top: 50, left: spacing.lg }}>
          <CircleBtn icon="chevron-back" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const fav = isFavorite(place.location_id);
  const price = priceLabel(place);
  const open = isOpen(place);
  const c = coords(place);
  const hours = formatHours(place);
  const reviews = (place.reviews ?? []).filter((r) => reviewText(r));
  const distance = c && myCoords ? formatDistance(distanceKm(myCoords, c), units) : place.distance_string;

  const openMaps = () => {
    if (!c) return;
    const label = encodeURIComponent(place.name ?? '');
    const url = Platform.select({
      web: `https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}`,
      ios: `maps:0,0?q=${label}@${c.latitude},${c.longitude}`,
      default: `geo:0,0?q=${c.latitude},${c.longitude}(${label})`,
    });
    if (!url) return;
    // On web open in a new tab; on native hand off to the maps app, with an
    // https fallback if the native scheme can't be handled.
    if (Platform.OS === 'web') {
      Linking.openURL(url).catch(() => {});
      return;
    }
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}`).catch(() => {}),
    );
  };
  const call = () => place.phone && Linking.openURL(`tel:${place.phone}`).catch(() => {});
  const website = () => place.website && Linking.openURL(place.website).catch(() => {});
  const tripadvisor = () => place.web_url && Linking.openURL(place.web_url).catch(() => {});
  const share = () =>
    Share.share({
      message: `Check out ${place.name}${place.location_string ? ` in ${place.location_string}` : ''} on TravelSahay! travelsahay://place/${type}/${id}`,
    }).catch(() => {});
  const onFav = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggle(place, type);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <View style={{ height: 340 }}>
          <PhotoGallery uris={photos.length > 0 ? photos : [photoUrl(place, 'large')]} height={340} />
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.75)']} locations={[0, 0.4, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          </View>
          <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg }}>
              <CircleBtn icon="chevron-back" onPress={() => router.back()} />
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <CircleBtn icon="share-outline" onPress={share} />
                <CircleBtn icon={fav ? 'heart' : 'heart-outline'} onPress={onFav} tint={fav ? colors.danger : '#fff'} />
              </View>
            </View>
          </SafeAreaView>
          <View style={{ position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg, gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Badge label={TYPE_META[type].singular} tone="primary" />
              {open != null && <Badge label={open ? 'Open now' : 'Closed'} tone={open ? 'success' : 'danger'} solid />}
              {place.photo_count && <Badge label={`${place.photo_count} photos`} tone="neutral" />}
            </View>
            <AppText variant="title" style={{ color: '#fff' }} numberOfLines={2}>
              {place.name}
            </AppText>
            {place.location_string && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="location" size={15} color="#fff" />
                <AppText style={{ color: 'rgba(255,255,255,0.92)' }}>{place.location_string}</AppText>
                {distance && <AppText style={{ color: 'rgba(255,255,255,0.75)' }} variant="caption">· {distance}</AppText>}
              </View>
            )}
          </View>
        </View>

        <View style={{ padding: spacing.lg, gap: spacing.xl }}>
          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Stat icon="star" label="Rating" value={place.rating ?? '—'} sub={place.num_reviews ? `${place.num_reviews} reviews` : undefined} />
            <Stat icon="cash-outline" label="Price" value={price ?? '—'} />
            <Stat icon="trophy-outline" label="Ranking" value={place.ranking ? `#${place.ranking.match(/#(\d+)/)?.[1] ?? ''}` : '—'} />
          </View>

          {/* Add to trip */}
          <Button label="Add to a trip" icon="airplane" variant="secondary" onPress={() => setTripOpen(true)} />

          {place.ranking ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primaryMuted, padding: spacing.md, borderRadius: radius.md }}>
              <Ionicons name="ribbon" size={18} color={colors.primary} />
              <AppText variant="caption" style={{ color: colors.primary, fontWeight: '600', flex: 1 }}>
                {place.ranking}
              </AppText>
            </View>
          ) : null}

          {place.description ? (
            <Section title="About">
              <AppText tone="muted" style={{ lineHeight: 22 }}>
                {place.description}
              </AppText>
            </Section>
          ) : null}

          {/* Rating breakdown */}
          {place.rating_histogram && place.num_reviews ? (
            <Section title="Ratings">
              <Histogram place={place} />
            </Section>
          ) : null}

          {/* Cuisine / dishes / dietary */}
          {place.cuisine && place.cuisine.length > 0 ? (
            <ChipSection title="Cuisine" items={place.cuisine.map((x) => x.name ?? '')} />
          ) : null}
          {place.dishes && place.dishes.length > 0 ? (
            <ChipSection title="Popular dishes" items={place.dishes.map((x) => x.name ?? '')} />
          ) : null}
          {place.dietary_restrictions && place.dietary_restrictions.length > 0 ? (
            <ChipSection title="Dietary options" items={place.dietary_restrictions.map((x) => x.name ?? '')} />
          ) : null}

          {/* Hours */}
          {hours.length > 0 ? (
            <Section title="Opening hours">
              <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, gap: 8 }}>
                {hours.map((h) => (
                  <View key={h.day} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <AppText variant="caption" style={{ fontWeight: '600' }}>
                      {h.day}
                    </AppText>
                    <AppText variant="caption" tone={h.ranges === 'Closed' ? 'danger' : 'muted'}>
                      {h.ranges}
                    </AppText>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}

          {/* Reviews */}
          {reviews.length > 0 ? (
            <Section title={`Reviews (${place.num_reviews ?? reviews.length})`}>
              <View style={{ gap: spacing.md }}>
                {reviews.slice(0, 4).map((r, i) => (
                  <ReviewCard key={i} review={r} />
                ))}
                {place.web_url && (
                  <Pressable onPress={tripadvisor} style={{ alignSelf: 'flex-start' }}>
                    <AppText tone="primary" variant="caption" style={{ fontWeight: '700' }}>
                      Read all reviews →
                    </AppText>
                  </Pressable>
                )}
              </View>
            </Section>
          ) : null}

          {/* Contact */}
          <Section title="Contact & location">
            <View style={{ gap: spacing.sm }}>
              {place.address && <ContactRow icon="location-outline" text={place.address} onPress={openMaps} action="Map" />}
              {place.phone && <ContactRow icon="call-outline" text={place.phone} onPress={call} action="Call" />}
              {place.website && <ContactRow icon="globe-outline" text="Visit website" onPress={website} action="Open" />}
              {place.email && <ContactRow icon="mail-outline" text={place.email} onPress={() => Linking.openURL(`mailto:${place.email}`)} action="Email" />}
            </View>
          </Section>

          {c && (
            <Pressable
              onPress={openMaps}
              style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: scheme === 'dark' ? 1 : 0, borderColor: colors.border }, shadow(scheme, 1)]}
            >
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="navigate" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="subtitle">Get directions</AppText>
                <AppText tone="muted" variant="caption">
                  Open in your maps app
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Similar */}
        {similar.length > 0 && (
          <View style={{ gap: spacing.md, marginTop: -spacing.sm }}>
            <AppText variant="heading" style={{ paddingHorizontal: spacing.lg }}>
              You might also like
            </AppText>
            <FlatList
              horizontal
              data={similar}
              keyExtractor={(p) => p.location_id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.md }}
              renderItem={({ item }) => (
                <PlaceCard place={item} type={type} variant="compact" onPress={() => openPlace(item, type)} />
              )}
            />
          </View>
        )}

        {loading && (
          <AppText tone="muted" variant="caption" center style={{ paddingVertical: spacing.md }}>
            Loading more details…
          </AppText>
        )}
      </ScrollView>

      {/* Bottom bar */}
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" tone="muted">
              {price ? 'Avg. price' : TYPE_META[type].singular}
            </AppText>
            <AppText variant="subtitle" numberOfLines={1}>
              {price ?? place.name}
            </AppText>
          </View>
          <Button
            label={type === 'hotels' ? 'Book Now' : type === 'restaurants' ? 'Reserve' : 'Get Tickets'}
            icon="checkmark-circle"
            onPress={() => (place.website ? website() : openMaps())}
            style={{ flex: 1.2 }}
          />
        </View>
      </SafeAreaView>

      <AddToTripModal visible={tripOpen} place={place} type={type} onClose={() => setTripOpen(false)} />
    </View>
  );
}

function Histogram({ place }: { place: Place }) {
  const { colors } = useTheme();
  const h = place.rating_histogram ?? {};
  const rows = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: parseInt((h as any)[`count_${star}`] ?? '0', 10) || 0,
  }));
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  return (
    <View style={{ gap: 6 }}>
      {rows.map((r) => (
        <View key={r.star} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AppText variant="caption" style={{ width: 12 }}>
            {r.star}
          </AppText>
          <Ionicons name="star" size={12} color={colors.star} />
          <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
            <View style={{ width: `${(r.count / total) * 100}%`, height: '100%', backgroundColor: colors.primary }} />
          </View>
          <AppText variant="caption" tone="muted" style={{ width: 44, textAlign: 'right' }}>
            {r.count}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const { colors, scheme } = useTheme();
  const stars = parseInt(review.rating ?? '0', 10) || 0;
  return (
    <View style={[{ backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, gap: 6, borderWidth: scheme === 'dark' ? 1 : 0, borderColor: colors.border }, shadow(scheme, 1)]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons key={i} name="star" size={12} color={i < stars ? colors.star : colors.border} />
          ))}
        </View>
        {review.author && (
          <AppText variant="caption" tone="muted" numberOfLines={1} style={{ maxWidth: 140 }}>
            {review.author}
          </AppText>
        )}
      </View>
      {review.title && (
        <AppText variant="subtitle" numberOfLines={1}>
          {review.title}
        </AppText>
      )}
      <AppText tone="muted" variant="caption" numberOfLines={4} style={{ lineHeight: 19 }}>
        {reviewText(review)}
      </AppText>
    </View>
  );
}

function ChipSection({ title, items }: { title: string; items: string[] }) {
  return (
    <Section title={title}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {items.filter(Boolean).map((label, i) => (
          <Chip key={`${label}-${i}`} label={label} />
        ))}
      </View>
    </Section>
  );
}

function CircleBtn({ icon, onPress, tint = '#fff' }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; tint?: string }) {
  return (
    <Pressable onPress={onPress} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={20} color={tint} />
    </Pressable>
  );
}

function Stat({ icon, label, value, sub }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; sub?: string }) {
  const { colors, scheme } = useTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, gap: 4, borderWidth: scheme === 'dark' ? 1 : 0, borderColor: colors.border }, shadow(scheme, 1)]}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <AppText variant="subtitle" numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="label" tone="muted">
        {sub ?? label}
      </AppText>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="heading">{title}</AppText>
      {children}
    </View>
  );
}

function ContactRow({ icon, text, onPress, action }: { icon: keyof typeof Ionicons.glyphMap; text: string; onPress: () => void; action: string }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md }}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <AppText style={{ flex: 1 }} numberOfLines={1}>
        {text}
      </AppText>
      <AppText variant="caption" tone="primary" style={{ fontWeight: '700' }}>
        {action}
      </AppText>
    </Pressable>
  );
}
