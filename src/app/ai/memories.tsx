import { useState } from 'react';
import { ScrollView, View, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, Card, Button, EmptyState, Badge } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { useTrips, type Trip } from '@/state/TripsProvider';
import { useDiary } from '@/state/DiaryProvider';
import { ai, type MemoryResult } from '@/api/ai';

export default function MemoriesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { token } = useAuth();
  const { trips } = useTrips();
  const { add } = useDiary();

  const [selected, setSelected] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memory, setMemory] = useState<MemoryResult | null>(null);
  const [saved, setSaved] = useState(false);

  const generate = async (trip: Trip) => {
    if (!token) return;
    setSelected(trip);
    setLoading(true);
    setError(null);
    setMemory(null);
    setSaved(false);
    try {
      const res = await ai.memories(
        { trip: { title: trip.title, days: trip.days, stops: trip.stops }, currency: 'INR' },
        token,
      );
      setMemory(res.memory);
    } catch (e: any) {
      setError(e?.message ?? 'Could not generate memory');
    } finally {
      setLoading(false);
    }
  };

  const saveToDiary = async () => {
    if (!memory) return;
    try {
      await add({
        title: memory.title,
        note: `${memory.summary}\n\n${memory.diary}`,
        placeName: selected?.title ?? '',
        mood: '✨',
        date: new Date().toISOString(),
        photos: [],
      });
      setSaved(true);
    } catch (e: any) {
      setError(e?.message ?? 'Could not save to diary');
    }
  };

  return (
    <Screen>
      <ScreenHeader title="AI Memories" subtitle="Turn a trip into a story" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.x3 }}>
        {!memory && (
          <>
            <AppText tone="muted">Pick a trip and AI will write its travel diary, highlights & a shareable caption.</AppText>
            {trips.length === 0 ? (
              <EmptyState icon="airplane-outline" title="No trips yet" message="Create or plan a trip first, then come back to make a memory." actionLabel="Open Trips" onAction={() => router.push('/(tabs)/trips')} />
            ) : (
              trips.map((t) => (
                <Pressable key={t.id} onPress={() => generate(t)} disabled={loading}>
                  {({ pressed }) => (
                    <Card padded style={{ opacity: pressed ? 0.85 : 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                      <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="airplane" size={22} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="subtitle">{t.title}</AppText>
                        <AppText tone="muted" variant="caption">{t.days} days · {t.stops.length} stops</AppText>
                      </View>
                      <Ionicons name="sparkles" size={20} color={colors.primary} />
                    </Card>
                  )}
                </Pressable>
              ))
            )}
          </>
        )}

        {loading && (
          <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.x2 }}>
            <ActivityIndicator color={colors.primary} />
            <AppText tone="muted" variant="caption">Reliving your trip…</AppText>
          </View>
        )}

        {memory && !loading && (
          <>
            <Card padded style={{ gap: spacing.sm }}>
              <AppText variant="title">{memory.title}</AppText>
              <AppText tone="muted">{memory.summary}</AppText>
            </Card>

            {memory.highlights?.length ? (
              <Card padded style={{ gap: 6 }}>
                <AppText variant="subtitle">✨ Highlights</AppText>
                {memory.highlights.map((h, i) => <AppText key={i} tone="muted">• {h}</AppText>)}
              </Card>
            ) : null}

            <Card padded style={{ gap: 6 }}>
              <AppText variant="subtitle">📖 Travel diary</AppText>
              <AppText style={{ lineHeight: 22 }}>{memory.diary}</AppText>
            </Card>

            {memory.socialCaption ? (
              <Card padded style={{ gap: 6 }}>
                <AppText variant="subtitle">📱 Share caption</AppText>
                <AppText tone="muted">{memory.socialCaption}</AppText>
              </Card>
            ) : null}

            {error && <AppText tone="danger">{error}</AppText>}

            {saved ? (
              <Button label="Saved to Diary" icon="checkmark-circle" variant="secondary" onPress={() => router.push('/(tabs)/diary')} fullWidth />
            ) : (
              <Button label="Save to Diary" icon="book" onPress={saveToDiary} fullWidth />
            )}
            <Button label="Make another memory" variant="ghost" onPress={() => { setMemory(null); setSelected(null); setSaved(false); }} fullWidth />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
