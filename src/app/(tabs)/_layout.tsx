import { Tabs } from 'expo-router';
import { Platform, View, type ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, shadow } from '@/theme';

export default function TabsLayout() {
  const { colors, scheme } = useTheme();

  // Focused tabs get a rounded "pill" behind the icon so the active screen
  // reads clearly and every item stays vertically aligned.
  const icon =
    (name: keyof typeof Ionicons.glyphMap, outline: keyof typeof Ionicons.glyphMap) =>
    ({ color, focused }: { color: ColorValue; focused: boolean; size: number }) => (
      <View
        style={{
          width: 52,
          height: 32,
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
            height: Platform.select({ ios: 88, default: 68 }),
            paddingTop: 8,
            paddingBottom: Platform.select({ ios: 28, default: 10 }),
            paddingHorizontal: 4,
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
