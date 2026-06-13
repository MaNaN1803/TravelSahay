import { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radius, shadow, type ThemeMode } from '@/theme';
import { useRouter } from 'expo-router';
import { Screen, AppText, Chip, Badge } from '@/components/ui';
import { useFavorites } from '@/state/FavoritesProvider';
import { useSettings, CURRENCY_SYMBOL, type Currency } from '@/state/SettingsProvider';
import { useAuth } from '@/state/AuthProvider';
import { useTrips } from '@/state/TripsProvider';
import { useDiary } from '@/state/DiaryProvider';
import { community, type Gamification } from '@/api/community';
import { hasGoogleMaps, hasRapidApi } from '@/lib/env';

const CURRENCIES: Currency[] = ['auto', 'USD', 'EUR', 'GBP', 'INR', 'AED'];

const MODES: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export default function ProfileScreen() {
  const { colors, scheme, mode, setMode } = useTheme();
  const { favorites, clear } = useFavorites();
  const { units, currency, setUnits, setCurrency } = useSettings();
  const { user, token, updateUser, logout } = useAuth();
  const { trips } = useTrips();
  const { entries } = useDiary();
  const router = useRouter();
  const [game, setGame] = useState<Gamification | null>(null);

  // Pull gamification stats derived from this traveller's activity.
  useEffect(() => {
    if (!token) return;
    const cities = new Set(trips.flatMap((t) => t.stops.map((s) => s.place.location_string).filter(Boolean))).size;
    community
      .gamification({ trips: trips.length, cities, diary: entries.length }, token)
      .then((r) => setGame(r.gamification))
      .catch(() => {});
  }, [token, trips, entries]);

  const editUsername = () => {
    const apply = async (name?: string) => {
      const v = (name ?? '').trim();
      if (!v || v === user?.username) return;
      try { await updateUser(v); } catch (e: any) { Alert.alert('Could not update', e?.message ?? 'Try again'); }
    };
    if (Alert.prompt) {
      Alert.prompt('Edit username', 'Choose a new display name', apply, 'plain-text', user?.username ?? '');
    } else {
      Alert.alert('Edit username', 'Username editing needs a text prompt (iOS). Coming to Android soon.');
    }
  };

  const confirmLogout = () =>
    Alert.alert('Sign out', 'Sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);

  const counts = {
    hotels: favorites.filter((f) => f.type === 'hotels').length,
    attractions: favorites.filter((f) => f.type === 'attractions').length,
    restaurants: favorites.filter((f) => f.type === 'restaurants').length,
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.x3 }}>
        {/* Profile header */}
        <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.md }}>
          <Image
            source={require('@/assets/travel/avatar.png')}
            style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: colors.surfaceAlt }}
            contentFit="cover"
          />
          <View style={{ alignItems: 'center' }}>
            <Pressable onPress={editUsername} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppText variant="title">{user?.username || 'Traveler'}</AppText>
              <Ionicons name="pencil" size={15} color={colors.textMuted} />
            </Pressable>
            <AppText tone="muted">{user?.email || 'Welcome to TravelSahay'}</AppText>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <StatBox label="Saved" value={favorites.length} icon="heart" />
          <StatBox label="Hotels" value={counts.hotels} icon="bed" />
          <StatBox label="Eats" value={counts.restaurants} icon="restaurant" />
          <StatBox label="Sights" value={counts.attractions} icon="camera" />
        </View>

        {/* Gamification */}
        {game && (
          <View style={[{ backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: scheme === 'dark' ? 1 : 0, borderColor: colors.border }, shadow(scheme, 1)]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                <AppText variant="subtitle" tone="primary">{game.level}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="subtitle">Level {game.level} Explorer</AppText>
                <AppText tone="muted" variant="caption">{game.xp} XP · {game.toNext} XP to next level</AppText>
              </View>
              <Badge label={`Score ${game.explorerScore}`} tone="accent" />
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.primary, width: `${Math.min(100, Math.round((game.xp / Math.max(1, game.nextLevelXp)) * 100))}%` }} />
            </View>
            {game.badges.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {game.badges.map((b) => (
                  <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 }}>
                    <Ionicons name={b.icon as any} size={14} color={colors.primary} />
                    <AppText variant="caption">{b.label}</AppText>
                  </View>
                ))}
              </View>
            ) : <AppText tone="muted" variant="caption">Take trips & write diary entries to earn badges.</AppText>}
          </View>
        )}

        {/* AI & Social */}
        <Group title="AI & Social">
          <Pressable onPress={() => router.push('/ai/twin')}>
            <Row icon="person-circle-outline" label="Travel Twin" value="Your AI agent" chevron />
          </Pressable>
          <Divider />
          <Pressable onPress={() => router.push('/social/buddies')}>
            <Row icon="people-outline" label="Travel Buddies" value="Find companions" chevron />
          </Pressable>
          <Divider />
          <Pressable onPress={() => router.push('/social')}>
            <Row icon="globe-outline" label="Community Hub" chevron />
          </Pressable>
          <Divider />
          <Pressable onPress={() => router.push('/social/rewards')}>
            <Row icon="trophy-outline" label="Rewards & Challenges" chevron />
          </Pressable>
        </Group>

        {/* Appearance */}
        <Group title="Appearance">
          <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md }}>
            {MODES.map((m) => {
              const active = mode === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => setMode(m.key)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: spacing.md,
                    borderRadius: radius.md,
                    backgroundColor: active ? colors.primaryMuted : colors.surfaceAlt,
                    borderWidth: 1.5,
                    borderColor: active ? colors.primary : 'transparent',
                  }}
                >
                  <Ionicons name={m.icon} size={20} color={active ? colors.primary : colors.textMuted} />
                  <AppText variant="caption" style={{ color: active ? colors.primary : colors.textMuted, fontWeight: '600' }}>
                    {m.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Group>

        {/* Quick links */}
        <Group title="Library">
          <Pressable onPress={() => router.push('/favorites')}>
            <Row icon="heart-outline" label="Favorites" value={`${favorites.length}`} chevron />
          </Pressable>
          <Divider />
          <Pressable onPress={() => router.push('/recently')}>
            <Row icon="time-outline" label="Recently viewed" chevron />
          </Pressable>
          <Divider />
          <Pressable onPress={() => router.push('/trips')}>
            <Row icon="airplane-outline" label="My trips" chevron />
          </Pressable>
        </Group>

        {/* Preferences */}
        <Group title="Preferences">
          <View style={{ padding: spacing.md, gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText variant="subtitle">Distance units</AppText>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Chip label="km" active={units === 'km'} onPress={() => setUnits('km')} />
                <Chip label="miles" active={units === 'mi'} onPress={() => setUnits('mi')} />
              </View>
            </View>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="subtitle">Currency</AppText>
              <AppText variant="caption" tone="muted">
                Auto shows prices in each destination&apos;s local currency.
              </AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {CURRENCIES.map((cur) => (
                  <Chip
                    key={cur}
                    label={cur === 'auto' ? '🌐 Auto' : `${CURRENCY_SYMBOL[cur].trim()} ${cur}`}
                    active={currency === cur}
                    onPress={() => setCurrency(cur)}
                  />
                ))}
              </View>
            </View>
          </View>
        </Group>

        {/* Data */}
        <Group title="Data">
          <Row icon="server-outline" label="Places data" value="Live travel data" status={hasRapidApi} />
          <Divider />
          <Row icon="map-outline" label="Search & maps" value={hasGoogleMaps ? 'Enhanced' : 'Standard'} status={hasGoogleMaps} />
          <Divider />
          <Pressable
            onPress={() =>
              Alert.alert('Clear saved data', 'Remove all favorites from this device?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: clear },
              ])
            }
          >
            <Row icon="trash-outline" label="Clear favorites" tint={colors.danger} chevron />
          </Pressable>
        </Group>

        {/* About */}
        <Group title="About">
          <Row icon="information-circle-outline" label="TravelSahay" value="v2.0.0" />
          <Divider />
          <Row icon="phone-portrait-outline" label="Platform" value={scheme === 'dark' ? 'Dark mode' : 'Light mode'} />
        </Group>

        <Group title="Account">
          <Pressable onPress={() => router.push('/(tabs)/diary')}>
            <Row icon="book-outline" label="Travel diary" chevron />
          </Pressable>
          <Divider />
          <Pressable onPress={confirmLogout}>
            <Row icon="log-out-outline" label="Sign out" tint={colors.danger} chevron />
          </Pressable>
        </Group>

      </ScrollView>
    </Screen>
  );
}

function StatBox({ label, value, icon }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap }) {
  const { colors, scheme } = useTheme();
  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          gap: 4,
          backgroundColor: colors.card,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          borderWidth: scheme === 'dark' ? 1 : 0,
          borderColor: colors.border,
        },
        shadow(scheme, 1),
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
      <AppText variant="subtitle">{value}</AppText>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors, scheme } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" tone="muted" style={{ marginLeft: 4 }}>
        {title.toUpperCase()}
      </AppText>
      <View
        style={[
          {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            overflow: 'hidden',
            borderWidth: scheme === 'dark' ? 1 : 0,
            borderColor: colors.border,
          },
          shadow(scheme, 1),
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  status,
  tint,
  chevron,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  status?: boolean;
  tint?: string;
  chevron?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}>
      <Ionicons name={icon} size={20} color={tint ?? colors.primary} />
      <AppText style={{ flex: 1, color: tint ?? colors.text }} variant="subtitle">
        {label}
      </AppText>
      {value && (
        <AppText tone="muted" variant="caption">
          {value}
        </AppText>
      )}
      {status != null && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: status ? colors.success : colors.danger,
          }}
        />
      )}
      {chevron && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </View>
  );
}

function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 52 }} />;
}
