import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, shadow } from '@/theme';
import { AppText } from '@/components/ui';
import { destinationImage, type Destination } from '@/lib/destinations';

export function DestinationCard({
  destination,
  onPress,
  variant = 'compact',
}: {
  destination: Destination;
  onPress: () => void;
  variant?: 'compact' | 'tile';
}) {
  const { scheme } = useTheme();
  const compact = variant === 'compact';
  const w = compact ? 150 : '100%';
  const h = compact ? 190 : 150;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { width: w as any, height: h, borderRadius: radius.lg, overflow: 'hidden', opacity: pressed ? 0.92 : 1 },
        shadow(scheme, 1),
      ]}
    >
      <Image
        source={{ uri: destinationImage(destination, compact ? 400 : 600) }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
        transition={250}
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' }} />
      <View style={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}>
        <AppText variant="subtitle" style={{ color: '#fff' }} numberOfLines={1}>
          {destination.name}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="location" size={12} color="rgba(255,255,255,0.85)" />
          <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }} numberOfLines={1}>
            {destination.country}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}
