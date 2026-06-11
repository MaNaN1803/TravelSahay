import { ScrollView, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, Card, Badge } from '@/components/ui';

type Feature = {
  key: string;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: string;
};

const FEATURES: Feature[] = [
  {
    key: 'planner',
    title: 'AI Trip Planner',
    desc: 'Day-by-day itinerary tailored to your budget & style',
    icon: 'map',
    route: '/ai/planner',
    badge: 'Flagship',
  },
  {
    key: 'concierge',
    title: 'AI Concierge',
    desc: 'Chat 24/7 with your personal travel assistant',
    icon: 'chatbubbles',
    route: '/ai/chat',
  },
  {
    key: 'budget',
    title: 'Smart Budget',
    desc: 'Luxury, moderate & budget cost breakdowns',
    icon: 'wallet',
    route: '/ai/budget',
  },
  {
    key: 'packing',
    title: 'Packing Assistant',
    desc: 'Smart packing lists from weather & activities',
    icon: 'briefcase',
    route: '/ai/packing',
  },
  {
    key: 'memories',
    title: 'AI Memories',
    desc: 'Turn a finished trip into a diary & highlights',
    icon: 'sparkles',
    route: '/ai/memories',
  },
  {
    key: 'assist',
    title: 'Travel Assistant',
    desc: 'Safety, visa, emergency, predictions & copilot',
    icon: 'shield-checkmark',
    route: '/ai/assist',
  },
  {
    key: 'twin',
    title: 'Travel Twin',
    desc: 'Your personal AI agent that learns your style',
    icon: 'person-circle',
    route: '/ai/twin',
  },
  {
    key: 'planners',
    title: 'Specialized Planners',
    desc: 'Family, couple, corporate, pilgrimage & more',
    icon: 'people',
    route: '/ai/planners',
  },
  {
    key: 'community',
    title: 'Community & Pooling',
    desc: 'Channels, traveller matching, pooling & wallet',
    icon: 'globe',
    route: '/social',
    badge: 'Social',
  },
];

export default function AIHubScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.x3 }}>
        <View style={{ gap: 4, marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="sparkles" size={26} color={colors.primary} />
            <AppText variant="title">AI Travel Hub</AppText>
          </View>
          <AppText tone="muted">Your AI travel concierge — plan, budget, pack & remember.</AppText>
        </View>

        {FEATURES.map((f) => (
          <Pressable key={f.key} onPress={() => router.push(f.route as any)}>
            {({ pressed }) => (
              <Card padded style={{ opacity: pressed ? 0.85 : 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: radius.md,
                      backgroundColor: colors.primaryMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={f.icon} size={26} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <AppText variant="subtitle">{f.title}</AppText>
                      {f.badge && <Badge label={f.badge} tone="primary" />}
                    </View>
                    <AppText tone="muted" variant="caption">
                      {f.desc}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </View>
              </Card>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
