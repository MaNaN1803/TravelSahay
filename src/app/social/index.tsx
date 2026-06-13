import { ScrollView, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, Card, Badge } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';

const ITEMS: { title: string; desc: string; icon: any; route: string; badge?: string }[] = [
  { title: 'Travel Feed', desc: 'Posts, reviews, stories — like, comment & follow', icon: 'newspaper', route: '/social/feed' },
  { title: 'Travel Channels', desc: 'Public & private destination groups with chat & polls', icon: 'chatbubbles', route: '/social/channels' },
  { title: 'Travel Pooling', desc: 'Cluster with travellers, split costs, bulk deals', icon: 'people-circle', route: '/social/pooling', badge: 'Differentiator' },
  { title: 'Travel Buddies', desc: 'Publish open trips, AI-match & combine plans with companions', icon: 'people', route: '/social/buddies', badge: 'New' },
  { title: 'Find Travellers', desc: 'Matching, compatibility & nearby travellers', icon: 'sparkles', route: '/social/matching' },
  { title: 'Group Wallet', desc: 'Shared trips, expenses & smart settlements', icon: 'wallet', route: '/social/wallet' },
  { title: 'Marketplace', desc: 'Buy itineraries, local guides & experiences', icon: 'storefront', route: '/social/marketplace' },
  { title: 'Rewards & Challenges', desc: 'Levels, badges, challenges & referrals', icon: 'trophy', route: '/social/rewards' },
];

export default function SocialHub() {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Screen>
      <ScreenHeader title="Community" subtitle="Connect · pool · share" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.x3 }}>
        {ITEMS.map((it) => (
          <Pressable key={it.route} onPress={() => router.push(it.route as any)}>
            {({ pressed }) => (
              <Card padded style={{ opacity: pressed ? 0.85 : 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View style={{ width: 50, height: 50, borderRadius: radius.md, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={it.icon} size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <AppText variant="subtitle">{it.title}</AppText>
                      {it.badge && <Badge label={it.badge} tone="accent" />}
                    </View>
                    <AppText tone="muted" variant="caption">{it.desc}</AppText>
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
