import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, fontSize, fontWeight } from '@/theme';
import { AppText } from './AppText';

export type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function Chip({ label, active, onPress, icon }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.pill,
        backgroundColor: active ? colors.primary : colors.surfaceAlt,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {icon && (
        <Ionicons name={icon} size={15} color={active ? colors.onPrimary : colors.textMuted} />
      )}
      <AppText
        style={{
          color: active ? colors.onPrimary : colors.text,
          fontSize: fontSize.sm,
          fontWeight: fontWeight.semibold as any,
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
