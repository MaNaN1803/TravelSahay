import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, shadow, spacing } from '@/theme';
import { AppText, Rating } from '@/components/ui';
import { photoUrl, isOpen, TYPE_META } from '@/lib/place';
import { usePriceLabel } from '@/hooks/usePriceLabel';
import { useFavorites } from '@/state/FavoritesProvider';
import type { Place, PlaceType } from '@/types/place';

type Props = {
  place: Place;
  type: PlaceType;
  onPress: () => void;
  variant?: 'grid' | 'list' | 'compact';
};

export function PlaceCard({ place, type, onPress, variant = 'grid' }: Props) {
  const { colors, scheme } = useTheme();
  const { isFavorite, toggle } = useFavorites();
  const priceLabel = usePriceLabel();
  const fav = isFavorite(place.location_id);
  const price = priceLabel(place);
  const open = isOpen(place);

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            width: 210,
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            overflow: 'hidden',
            borderWidth: scheme === 'dark' ? 1 : 0,
            borderColor: colors.border,
            opacity: pressed ? 0.95 : 1,
          },
          shadow(scheme, 1),
        ]}
      >
        <View>
          <Image
            source={{ uri: photoUrl(place) }}
            style={{ width: '100%', height: 130 }}
            contentFit="cover"
            transition={200}
          />
          <Pressable
            hitSlop={10}
            onPress={() => toggle(place, type)}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: colors.overlay,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={15} color={fav ? colors.danger : '#fff'} />
          </Pressable>
        </View>
        <View style={{ padding: spacing.md, gap: 3 }}>
          <AppText variant="subtitle" numberOfLines={1}>
            {place.name}
          </AppText>
          <AppText tone="muted" variant="caption" numberOfLines={1}>
            {place.location_string ?? TYPE_META[type].singular}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <Rating value={place.rating} reviews={place.num_reviews} />
            {price && (
              <AppText variant="caption" tone="primary" style={{ fontWeight: '700' }}>
                {price}
              </AppText>
            )}
          </View>
        </View>
      </Pressable>
    );
  }

  const Heart = (
    <Pressable
      hitSlop={10}
      onPress={() => toggle(place, type)}
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.overlay,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons
        name={fav ? 'heart' : 'heart-outline'}
        size={18}
        color={fav ? colors.danger : '#fff'}
      />
    </Pressable>
  );

  if (variant === 'list') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            padding: spacing.sm,
            gap: spacing.md,
            borderWidth: scheme === 'dark' ? 1 : 0,
            borderColor: colors.border,
            opacity: pressed ? 0.9 : 1,
          },
          shadow(scheme, 1),
        ]}
      >
        <Image
          source={{ uri: photoUrl(place) }}
          style={{ width: 96, height: 96, borderRadius: radius.md }}
          contentFit="cover"
          transition={200}
        />
        <View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
          <AppText variant="subtitle" numberOfLines={1}>
            {place.name}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <AppText tone="muted" variant="caption" numberOfLines={1} style={{ flex: 1 }}>
              {place.location_string ?? TYPE_META[type].singular}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Rating value={place.rating} reviews={place.num_reviews} />
            {price && (
              <AppText variant="caption" tone="primary">
                {price}
              </AppText>
            )}
          </View>
        </View>
        <Pressable hitSlop={10} onPress={() => toggle(place, type)} style={{ padding: 4 }}>
          <Ionicons
            name={fav ? 'heart' : 'heart-outline'}
            size={20}
            color={fav ? colors.danger : colors.textMuted}
          />
        </Pressable>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: '100%',
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          overflow: 'hidden',
          borderWidth: scheme === 'dark' ? 1 : 0,
          borderColor: colors.border,
          opacity: pressed ? 0.95 : 1,
        },
        shadow(scheme, 1),
      ]}
    >
      <View>
        <Image
          source={{ uri: photoUrl(place) }}
          style={{ width: '100%', height: 150 }}
          contentFit="cover"
          transition={200}
        />
        {Heart}
        {open != null && (
          <View
            style={{
              position: 'absolute',
              bottom: 10,
              left: 10,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: radius.sm,
              backgroundColor: open ? colors.success : colors.danger,
            }}
          >
            <AppText style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
              {open ? 'Open' : 'Closed'}
            </AppText>
          </View>
        )}
      </View>
      <View style={{ padding: spacing.md, gap: 4 }}>
        <AppText variant="subtitle" numberOfLines={1}>
          {place.name}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="location-outline" size={13} color={colors.textMuted} />
          <AppText tone="muted" variant="caption" numberOfLines={1} style={{ flex: 1 }}>
            {place.location_string ?? TYPE_META[type].singular}
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <Rating value={place.rating} reviews={place.num_reviews} />
          {price && (
            <AppText variant="caption" tone="primary" style={{ fontWeight: '700' }}>
              {price}
            </AppText>
          )}
        </View>
      </View>
    </Pressable>
  );
}
