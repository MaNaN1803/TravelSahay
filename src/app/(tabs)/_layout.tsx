import { Tabs } from 'expo-router';
import { View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, shadow } from '@/theme';

export default function TabsLayout() {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();

  // Focused tabs get a rounded "pill" behind the icon. The pill is narrower than
  // the tab slot so the first (Home) and last (Profile) items never clip the
  // screen edges, and it stays centered for clean vertical + horizontal alignment.
  const icon =
    (name: keyof typeof Ionicons.glyphMap, outline: keyof typeof Ionicons.glyphMap) =>
    ({ color, focused }: { color: ColorValue; focused: boolean; size: number }) => (
      <View
        style={{
          width: 40,
          height: 30,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? colors.primaryMuted : 'transparent',
        }}
      >
        <Ionicons name={focused ? name : outline} size={focused ? 23 : 22} color={color as string} />
      </View>
    );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: [
          {
            backgroundColor: colors.surface,
            borderTopWidth: 0,
            height: 60 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
            // Pull items inward from rounded corners / side notches.
            paddingHorizontal: Math.max(insets.left, insets.right, 8),
          },
          shadow(scheme, 3),
        ],
        tabBarItemStyle: { paddingTop: 2 },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600', marginTop: 3 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: icon('compass', 'compass-outline') }} />
      <Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: icon('map', 'map-outline') }} />
      <Tabs.Screen name="trips" options={{ title: 'Trips', tabBarIcon: icon('airplane', 'airplane-outline') }} />
      <Tabs.Screen name="ai" options={{ title: 'AI', tabBarIcon: icon('sparkles', 'sparkles-outline') }} />
      <Tabs.Screen name="diary" options={{ title: 'Diary', tabBarIcon: icon('book', 'book-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person', 'person-outline') }} />
    </Tabs>
  );
}
