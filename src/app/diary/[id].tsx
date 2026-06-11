import { View, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, EmptyState, Badge } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PhotoGallery } from '@/components/PhotoGallery';
import { useDiary } from '@/state/DiaryProvider';

function formatDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function DiaryDetail() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries, remove } = useDiary();
  const entry = entries.find((e) => e._id === id);

  if (!entry) {
    return (
      <Screen>
        <ScreenHeader title="Memory" />
        <EmptyState icon="book-outline" title="Not found" message="This memory may have been deleted." />
      </Screen>
    );
  }

  const photos = (entry.photos ?? []).map((p) => p.data);

  const confirmDelete = () =>
    Alert.alert('Delete memory', 'Delete this diary entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove(entry._id);
          router.back();
        },
      },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {photos.length > 0 ? (
          <View style={{ height: 320 }}>
            <PhotoGallery uris={photos} height={320} />
            <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg }}>
                <Round icon="chevron-back" onPress={() => router.back()} />
                <Round icon="trash-outline" onPress={confirmDelete} tint={colors.danger} />
              </View>
            </SafeAreaView>
          </View>
        ) : (
          <ScreenHeader
            title="Memory"
            right={
              <Pressable hitSlop={8} onPress={confirmDelete}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            }
          />
        )}

        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            {entry.mood ? <AppText style={{ fontSize: 28 }}>{entry.mood}</AppText> : null}
            <AppText variant="title" style={{ flex: 1 }}>{entry.title}</AppText>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Badge label={formatDate(entry.date)} tone="primary" />
            {entry.placeName ? <Badge label={entry.placeName} tone="neutral" /> : null}
          </View>

          {entry.note ? (
            <AppText style={{ lineHeight: 24, marginTop: spacing.sm }}>{entry.note}</AppText>
          ) : (
            <AppText tone="muted">No note added.</AppText>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Round({ icon, onPress, tint = '#fff' }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; tint?: string }) {
  return (
    <Pressable onPress={onPress} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={20} color={tint} />
    </Pressable>
  );
}
