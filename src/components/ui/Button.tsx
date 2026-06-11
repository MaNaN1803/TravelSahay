import { ActivityIndicator, Pressable, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, radius, fontWeight, fontSize } from '@/theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

const SIZE: Record<Size, { h: number; px: number; fs: number; icon: number }> = {
  sm: { h: 38, px: 14, fs: fontSize.sm, icon: 16 },
  md: { h: 48, px: 18, fs: fontSize.md, icon: 18 },
  lg: { h: 56, px: 22, fs: fontSize.lg, icon: 20 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  fullWidth,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const s = SIZE[size];

  const bg = {
    primary: colors.primary,
    secondary: colors.surfaceAlt,
    ghost: 'transparent',
    danger: colors.danger,
  }[variant];

  const fg = {
    primary: colors.onPrimary,
    secondary: colors.text,
    ghost: colors.primary,
    danger: colors.textInverse,
  }[variant];

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.selectionAsync().catch(() => {});
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height: s.h,
          paddingHorizontal: s.px,
          borderRadius: radius.pill,
          backgroundColor: bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: variant === 'ghost' ? 1.5 : 0,
          borderColor: colors.primary,
        },
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon && <Ionicons name={icon} size={s.icon} color={fg} />}
          <AppText style={{ color: fg, fontSize: s.fs, fontWeight: fontWeight.bold as any }}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
