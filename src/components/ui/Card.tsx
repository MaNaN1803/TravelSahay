import { View, type ViewProps } from 'react-native';
import { useTheme, radius, shadow } from '@/theme';

export type CardProps = ViewProps & {
  elevated?: boolean;
  padded?: boolean;
};

export function Card({ elevated = true, padded = false, style, ...rest }: CardProps) {
  const { colors, scheme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          borderWidth: scheme === 'dark' ? 1 : 0,
          borderColor: colors.border,
        },
        padded && { padding: 16 },
        elevated && shadow(scheme, 1),
        style,
      ]}
      {...rest}
    />
  );
}
