import { View } from 'react-native';
import { useTheme, radius, fontSize, fontWeight } from '@/theme';
import { AppText } from './AppText';

type Tone = 'neutral' | 'primary' | 'success' | 'danger' | 'accent';

export function Badge({
  label,
  tone = 'neutral',
  solid,
}: {
  label: string;
  tone?: Tone;
  solid?: boolean;
}) {
  const { colors } = useTheme();
  const map = {
    neutral: { bg: colors.surfaceAlt, fg: colors.textMuted },
    primary: { bg: colors.primaryMuted, fg: colors.primary },
    success: { bg: colors.success, fg: colors.textInverse },
    danger: { bg: colors.danger, fg: colors.textInverse },
    accent: { bg: colors.accent, fg: colors.textInverse },
  }[tone];

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.sm,
        backgroundColor: solid ? map.fg : map.bg,
      }}
    >
      <AppText
        style={{
          color: solid ? colors.textInverse : map.fg,
          fontSize: fontSize.xs,
          fontWeight: fontWeight.bold as any,
        }}
      >
        {label}
      </AppText>
    </View>
  );
}
