import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, fontSize, fontWeight } from '@/theme';
import { AppText } from '@/components/ui';
import { ALL_TYPES, TYPE_META } from '@/lib/place';
import type { PlaceType } from '@/types/place';

export function CategoryTabs({
  value,
  onChange,
}: {
  value: PlaceType;
  onChange: (t: PlaceType) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceAlt,
        borderRadius: radius.pill,
        padding: 4,
        gap: 4,
      }}
    >
      {ALL_TYPES.map((t) => {
        const active = t === value;
        return (
          <Pressable
            key={t}
            onPress={() => onChange(t)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 10,
              borderRadius: radius.pill,
              backgroundColor: active ? colors.primary : 'transparent',
            }}
          >
            <Ionicons
              name={TYPE_META[t].icon}
              size={16}
              color={active ? colors.onPrimary : colors.textMuted}
            />
            <AppText
              style={{
                color: active ? colors.onPrimary : colors.textMuted,
                fontSize: fontSize.sm,
                fontWeight: fontWeight.semibold as any,
              }}
            >
              {TYPE_META[t].label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
