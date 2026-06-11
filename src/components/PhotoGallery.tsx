import { useRef, useState } from 'react';
import { View, FlatList, useWindowDimensions, type ViewToken } from 'react-native';
import { Image } from 'expo-image';

export function PhotoGallery({
  uris,
  height = 300,
  rounded = 0,
}: {
  uris: string[];
  height?: number;
  rounded?: number;
}) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  }).current;

  if (uris.length === 0) return null;
  if (uris.length === 1) {
    return (
      <Image source={{ uri: uris[0] }} style={{ width: '100%', height, borderRadius: rounded }} contentFit="cover" transition={200} />
    );
  }

  return (
    <View>
      <FlatList
        data={uris}
        keyExtractor={(_, i) => `${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={{ width, height }} contentFit="cover" transition={200} />
        )}
      />
      <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        {uris.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === index ? 18 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.6)',
            }}
          />
        ))}
      </View>
    </View>
  );
}
