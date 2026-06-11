import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radius, shadow } from '@/theme';
import { AppText } from '@/components/ui';
import { CategoryTabs } from '@/components/CategoryTabs';
import { PlaceCard } from '@/components/PlaceCard';
import { usePlaces } from '@/state/PlacesProvider';
import { viewportCenter } from '@/api/search';
import { coords, TYPE_META } from '@/lib/place';
import { openPlace } from '@/lib/nav';
import { mapDarkStyle } from '@/lib/mapStyle';
import type { Place } from '@/types/place';

export function PlacesMap() {
  const { colors, scheme } = useTheme();
  const { results, type, setType, viewport, locationLabel } = usePlaces();
  const mapRef = useRef<MapView>(null);
  const [selected, setSelected] = useState<Place | null>(null);

  const region = useMemo<Region>(() => viewportCenter(viewport), [viewport]);

  const withCoords = useMemo(
    () => results.map((p) => ({ p, c: coords(p) })).filter((x) => x.c) as { p: Place; c: NonNullable<ReturnType<typeof coords>> }[],
    [results],
  );

  useEffect(() => {
    mapRef.current?.animateToRegion(region, 600);
    setSelected(null);
  }, [region]);

  const goToMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const pos = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion(
      {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      600,
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={scheme === 'dark' ? mapDarkStyle : undefined}
        onPress={() => setSelected(null)}
      >
        {withCoords.map(({ p, c }) => {
          const active = selected?.location_id === p.location_id;
          return (
            <Marker
              key={p.location_id}
              coordinate={c}
              onPress={() => setSelected(p)}
              tracksViewChanges={false}
            >
              <View
                style={[
                  {
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: radius.pill,
                    backgroundColor: active ? colors.primary : colors.card,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  },
                  shadow(scheme, 1),
                ]}
              >
                <Ionicons
                  name={TYPE_META[type].icon}
                  size={13}
                  color={active ? colors.onPrimary : colors.primary}
                />
                {p.rating && (
                  <AppText
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: active ? colors.onPrimary : colors.text,
                    }}
                  >
                    {parseFloat(p.rating).toFixed(1)}
                  </AppText>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
          <View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                alignSelf: 'flex-start',
                backgroundColor: colors.surface,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: radius.pill,
              },
              shadow(scheme, 1),
            ]}
          >
            <Ionicons name="location" size={16} color={colors.primary} />
            <AppText variant="subtitle" numberOfLines={1} style={{ maxWidth: 240 }}>
              {locationLabel}
            </AppText>
          </View>
          <View style={[{ borderRadius: radius.pill }, shadow(scheme, 1)]}>
            <CategoryTabs value={type} onChange={setType} />
          </View>
        </View>
      </SafeAreaView>

      <Pressable
        onPress={goToMyLocation}
        style={[
          {
            position: 'absolute',
            right: spacing.lg,
            bottom: selected ? 200 : spacing.x2,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          },
          shadow(scheme, 2),
        ]}
      >
        <Ionicons name="locate" size={22} color={colors.primary} />
      </Pressable>

      {selected && (
        <View style={{ position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.x2 }}>
          <PlaceCard
            place={selected}
            type={type}
            variant="list"
            onPress={() => openPlace(selected, type)}
          />
        </View>
      )}

      {withCoords.length === 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: spacing.x2,
            left: spacing.lg,
            right: spacing.lg,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            alignItems: 'center',
            ...shadow(scheme, 1),
          }}
        >
          <AppText tone="muted" center>
            No mappable {TYPE_META[type].label.toLowerCase()} here. Try another search or category.
          </AppText>
        </View>
      )}
    </View>
  );
}
