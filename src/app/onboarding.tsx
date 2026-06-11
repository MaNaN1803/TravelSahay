import { useRef, useState } from 'react';
import { View, FlatList, useWindowDimensions, Pressable, type ViewToken } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTheme, spacing, radius } from '@/theme';
import { AppText, Button } from '@/components/ui';
import { useOnboarding } from '@/state/OnboardingProvider';
import { unsplash, IMG } from '@/lib/images';

type Slide = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  imageId: string;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    key: 'explore',
    icon: 'compass',
    accent: '#2563EB',
    imageId: IMG.onboardExplore,
    title: 'Explore the world',
    body: 'Search any city and uncover top hotels, attractions and restaurants — powered by real Tripadvisor data.',
  },
  {
    key: 'map',
    icon: 'map',
    accent: '#C9A227',
    imageId: IMG.onboardMap,
    title: 'See it on the map',
    body: 'Browse places around you, filter by rating and price, and find what is open right now.',
  },
  {
    key: 'save',
    icon: 'airplane',
    accent: '#1E40AF',
    imageId: IMG.onboardSave,
    title: 'Plan your trips',
    body: 'Save favorites, build day-by-day itineraries, and travel your way — in light or dark mode.',
  },
];

export default function Onboarding() {
  const { colors } = useTheme();
  const router = useRouter();
  const { complete } = useOnboarding();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  }).current;

  const finish = () => {
    complete();
    router.replace('/(tabs)');
  };

  const next = () => {
    if (index < SLIDES.length - 1) listRef.current?.scrollToIndex({ index: index + 1 });
    else finish();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar style="light" />
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <View style={{ width, height }}>
            <Image
              source={{ uri: unsplash(item.imageId, 1000, 75) }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              contentFit="cover"
              transition={300}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.92)']}
              locations={[0, 0.4, 1]}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <SafeAreaView style={{ flex: 1, padding: spacing.xl, justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Pressable hitSlop={10} onPress={finish} style={{ backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill }}>
                  <AppText style={{ color: '#fff', fontWeight: '600' }}>Skip</AppText>
                </Pressable>
              </View>
              <View style={{ gap: spacing.lg, paddingBottom: 140 }}>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 18,
                    backgroundColor: item.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={item.icon} size={30} color="#fff" />
                </View>
                <AppText variant="display" style={{ color: '#fff' }}>
                  {item.title}
                </AppText>
                <AppText style={{ color: 'rgba(255,255,255,0.92)', fontSize: 16, lineHeight: 24, maxWidth: 360 }}>
                  {item.body}
                </AppText>
              </View>
            </SafeAreaView>
          </View>
        )}
      />

      <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl, gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              style={{
                width: i === index ? 22 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </View>
        <Button label={index === SLIDES.length - 1 ? 'Get started' : 'Next'} fullWidth onPress={next} />
      </SafeAreaView>
    </View>
  );
}
