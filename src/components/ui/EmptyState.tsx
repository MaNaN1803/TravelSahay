import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';

export function EmptyState({
  icon = 'search',
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          backgroundColor: colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={38} color={colors.textMuted} />
      </View>
      <AppText variant="subtitle" center>
        {title}
      </AppText>
      {message && (
        <AppText tone="muted" center style={{ maxWidth: 280 }}>
          {message}
        </AppText>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} variant="secondary" size="sm" onPress={onAction} />
      )}
    </View>
  );
}
