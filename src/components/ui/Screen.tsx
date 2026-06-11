import { View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

type ScreenProps = {
  children: React.ReactNode;
  edges?: readonly Edge[];
  style?: ViewStyle;
  alt?: boolean;
};

export function Screen({ children, edges = ['top'], style, alt }: ScreenProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: alt ? colors.surfaceAlt : colors.bg }, style]}
    >
      <View style={{ flex: 1 }}>{children}</View>
    </SafeAreaView>
  );
}
