import { View, FlatList, Pressable, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, spacing, radius, shadow } from '@/theme';
import { Screen, AppText, EmptyState, Skeleton } from '@/components/ui';
import { useDiary } from '@/state/DiaryProvider';
import type { DiaryEntry } from '@/api/backend';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function DiaryScreen() {
  const { colors, scheme } = useTheme();
  const router = useRouter();
  const { entries, loading, error, refresh } = useDiary();

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg }}>
        <View>
          <AppText variant="title">Travel Diary</AppText>
          <AppText tone="muted" variant="caption">
            {entries.length} memor{entries.length === 1 ? 'y' : 'ies'} · synced
          </AppText>
        </View>
        <Pressable
          onPress={() => router.push('/diary/new')}
          style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="add" size={26} color={colors.onPrimary} />
        </Pressable>
      </View>

      {loading && entries.length === 0 ? (
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={180} rounded={radius.lg} />
          ))}
        </View>
      ) : entries.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
          <EmptyState
            icon="book-outline"
            title={error ? 'Could not load diary' : 'Your diary is empty'}
            message={error ?? 'Capture moments from your trips — add a photo, a note, and a memory.'}
            actionLabel={error ? 'Retry' : 'Add first memory'}
            onAction={error ? refresh : () => router.push('/diary/new')}
          />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e._id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.x3, gap: spacing.lg }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
          renderItem={({ item }) => <DiaryCard entry={item} onPress={() => router.push(`/diary/${item._id}`)} />}
        />
      )}
    </Screen>
  );
}

function DiaryCard({ entry, onPress }: { entry: DiaryEntry; onPress: () => void }) {
  const { colors, scheme } = useTheme();
  const cover = entry.photos?.[0]?.data;

  return (
    <Pressable onPress={onPress} style={[{ borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.card }, shadow(scheme, 1)]}>
      {cover ? (
        <View style={{ height: 180 }}>
          <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 }} />
          <View style={{ position: 'absolute', left: 14, right: 14, bottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {entry.mood ? <AppText style={{ fontSize: 18 }}>{entry.mood}</AppText> : null}
              <AppText variant="subtitle" style={{ color: '#fff', flex: 1 }} numberOfLines={1}>
                {entry.title}
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 }}>
              <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>{formatDate(entry.date)}</AppText>
              {entry.placeName ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="location" size={11} color="rgba(255,255,255,0.85)" />
                  <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }} numberOfLines={1}>{entry.placeName}</AppText>
                </View>
              ) : null}
              {entry.photos && entry.photos.length > 1 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="images" size={11} color="rgba(255,255,255,0.85)" />
                  <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>{entry.photos.length}</AppText>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      ) : (
        <View style={{ padding: spacing.lg, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {entry.mood ? <AppText style={{ fontSize: 18 }}>{entry.mood}</AppText> : null}
            <AppText variant="subtitle" numberOfLines={1} style={{ flex: 1 }}>{entry.title}</AppText>
          </View>
          <AppText variant="caption" tone="muted">{formatDate(entry.date)}{entry.placeName ? ` · ${entry.placeName}` : ''}</AppText>
          {entry.note ? <AppText tone="muted" numberOfLines={2}>{entry.note}</AppText> : null}
        </View>
      )}
    </Pressable>
  );
}
