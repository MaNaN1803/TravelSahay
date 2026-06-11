import { useState, useEffect } from 'react';
import { Modal, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing } from '@/theme';
import { AppText, Button, Chip } from '@/components/ui';
import type { Filters, SortKey } from '@/state/PlacesProvider';
import { DEFAULT_FILTERS } from '@/state/PlacesProvider';

const RATINGS = [4.5, 4, 3.5, 3];
const PRICES = [1, 2, 3, 4];
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'rating', label: 'Top rated' },
  { key: 'reviews', label: 'Most reviewed' },
  { key: 'distance', label: 'Nearest' },
  { key: 'name', label: 'A–Z' },
];

export function FilterSheet({
  visible,
  initial,
  onClose,
  onApply,
}: {
  visible: boolean;
  initial: Filters;
  onClose: () => void;
  onApply: (f: Filters) => void;
}) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState<Filters>(initial);

  useEffect(() => {
    if (visible) setDraft(initial);
  }, [visible, initial]);

  const togglePrice = (p: number) =>
    setDraft((d) => ({
      ...d,
      price: d.price.includes(p) ? d.price.filter((x) => x !== p) : [...d.price, p],
    }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={onClose} />
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingBottom: 34,
          maxHeight: '85%',
        }}
      >
        <View style={{ alignItems: 'center', paddingTop: spacing.md }}>
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border }} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.lg,
          }}
        >
          <AppText variant="heading">Filters & Sort</AppText>
          <Pressable hitSlop={8} onPress={() => setDraft(DEFAULT_FILTERS)}>
            <AppText tone="primary" variant="subtitle">
              Reset
            </AppText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.xl }}>
          <Section title="Minimum rating">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <Chip
                label="Any"
                active={draft.minRating === 0}
                onPress={() => setDraft((d) => ({ ...d, minRating: 0 }))}
              />
              {RATINGS.map((r) => (
                <Chip
                  key={r}
                  icon="star"
                  label={`${r}+`}
                  active={draft.minRating === r}
                  onPress={() => setDraft((d) => ({ ...d, minRating: r }))}
                />
              ))}
            </View>
          </Section>

          <Section title="Price">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {PRICES.map((p) => (
                <Chip
                  key={p}
                  label={'$'.repeat(p)}
                  active={draft.price.includes(p)}
                  onPress={() => togglePrice(p)}
                />
              ))}
            </View>
          </Section>

          <Section title="Availability">
            <Pressable
              onPress={() => setDraft((d) => ({ ...d, openNow: !d.openNow }))}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.surfaceAlt,
                borderRadius: radius.md,
                padding: spacing.md,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <AppText variant="subtitle">Open now</AppText>
              </View>
              <View
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 14,
                  padding: 3,
                  backgroundColor: draft.openNow ? colors.primary : colors.border,
                  alignItems: draft.openNow ? 'flex-end' : 'flex-start',
                }}
              >
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' }} />
              </View>
            </Pressable>
          </Section>

          <Section title="Sort by">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {SORTS.map((s) => (
                <Chip
                  key={s.key}
                  label={s.label}
                  active={draft.sort === s.key}
                  onPress={() => setDraft((d) => ({ ...d, sort: s.key }))}
                />
              ))}
            </View>
          </Section>
        </ScrollView>

        <View style={{ padding: spacing.lg }}>
          <Button
            label="Show results"
            fullWidth
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="subtitle">{title}</AppText>
      {children}
    </View>
  );
}
