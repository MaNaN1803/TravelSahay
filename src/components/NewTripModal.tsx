import { useState, useEffect } from 'react';
import { Modal, View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing, fontSize } from '@/theme';
import { AppText, Button } from '@/components/ui';

export function NewTripModal({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (title: string, days: number) => void;
}) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [days, setDays] = useState(3);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setDays(3);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg }} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="airplane" size={22} color={colors.primary} />
            <AppText variant="heading">New trip</AppText>
          </View>

          <View style={{ gap: spacing.sm }}>
            <AppText variant="caption" tone="muted">
              TRIP NAME
            </AppText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              autoFocus
              placeholder="e.g. Goa getaway"
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.surfaceAlt,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
                height: 50,
                color: colors.text,
                fontSize: fontSize.md,
              }}
            />
          </View>

          <View style={{ gap: spacing.sm }}>
            <AppText variant="caption" tone="muted">
              DAYS
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
              <Stepper value={days} onChange={(d) => setDays(Math.max(1, Math.min(30, d)))} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Button
              label="Create"
              onPress={() => {
                onCreate(title, days);
                onClose();
              }}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { colors } = useTheme();
  const Btn = ({ icon, delta }: { icon: keyof typeof Ionicons.glyphMap; delta: number }) => (
    <Pressable
      onPress={() => onChange(value + delta)}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
      <Btn icon="remove" delta={-1} />
      <AppText variant="title" style={{ minWidth: 36, textAlign: 'center' }}>
        {value}
      </AppText>
      <Btn icon="add" delta={1} />
    </View>
  );
}
