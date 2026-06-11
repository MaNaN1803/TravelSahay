import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, fontSize, fontWeight } from '@/theme';
import { AppText } from './AppText';

export function Rating({
  value,
  reviews,
  size = 14,
}: {
  value?: string | number;
  reviews?: string | number;
  size?: number;
}) {
  const { colors } = useTheme();
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num == null || Number.isNaN(num)) return null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name="star" size={size} color={colors.star} />
      <AppText style={{ fontSize: fontSize.sm, fontWeight: fontWeight.bold as any }}>
        {num.toFixed(1)}
      </AppText>
      {reviews != null && (
        <AppText tone="muted" style={{ fontSize: fontSize.xs }}>
          ({reviews})
        </AppText>
      )}
    </View>
  );
}
