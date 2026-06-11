import { Tabs } from 'expo-router';
import { Platform, type ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const { colors } = useTheme();

  const icon =
    (name: keyof typeof Ionicons.glyphMap, outline: keyof typeof Ionicons.glyphMap) =>
    ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
      <Ionicons name={focused ? name : outline} size={size} color={color as string} />
    );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.select({ ios: 86, default: 64 }),
          paddingTop: 6,
          paddingBottom: Platform.select({ ios: 28, default: 8 }),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
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
