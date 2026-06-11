import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme, fontSize, fontWeight } from '@/theme';

type Variant = 'display' | 'title' | 'heading' | 'subtitle' | 'body' | 'caption' | 'label';

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontSize: fontSize.x3, fontWeight: fontWeight.heavy as any, letterSpacing: -0.5 },
  title: { fontSize: fontSize.x2, fontWeight: fontWeight.bold as any, letterSpacing: -0.3 },
  heading: { fontSize: fontSize.xl, fontWeight: fontWeight.bold as any },
  subtitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold as any },
  body: { fontSize: fontSize.md, fontWeight: fontWeight.regular as any },
  caption: { fontSize: fontSize.sm, fontWeight: fontWeight.medium as any },
  label: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold as any, letterSpacing: 0.4 },
};

type Tone = 'default' | 'muted' | 'primary' | 'inverse' | 'danger';

export type AppTextProps = TextProps & {
  variant?: Variant;
  tone?: Tone;
  color?: string;
  center?: boolean;
};

export function AppText({
  variant = 'body',
  tone = 'default',
  color,
  center,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const toneColor =
    color ??
    {
      default: colors.text,
      muted: colors.textMuted,
      primary: colors.primary,
      inverse: colors.textInverse,
      danger: colors.danger,
    }[tone];

  return (
    <Text
      style={[VARIANTS[variant], { color: toneColor }, center && { textAlign: 'center' }, style]}
      {...rest}
    />
  );
}
