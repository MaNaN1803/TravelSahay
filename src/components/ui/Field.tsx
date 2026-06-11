import { useState } from 'react';
import { View, TextInput, Pressable, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing, fontSize } from '@/theme';
import { AppText } from './AppText';

export type FieldProps = TextInputProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secure?: boolean;
};

export function Field({ label, icon, secure, style, ...rest }: FieldProps) {
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(!!secure);

  return (
    <View style={{ gap: 6 }}>
      <AppText variant="caption" tone="muted" style={{ fontWeight: '600', marginLeft: 2 }}>
        {label}
      </AppText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.surfaceAlt,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          height: 52,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {icon && <Ionicons name={icon} size={18} color={colors.textMuted} />}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[{ flex: 1, color: colors.text, fontSize: fontSize.md }, style]}
          secureTextEntry={hidden}
          {...rest}
        />
        {secure && (
          <Pressable hitSlop={8} onPress={() => setHidden((h) => !h)}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
