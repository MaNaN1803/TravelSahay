import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, spacing, fontSize } from '@/theme';
import { AppText, EmptyState } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { searchLocations } from '@/api/search';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import type { LocationSuggestion } from '@/types/place';

export function SearchModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (s: LocationSuggestion) => void;
}) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<LocationSuggestion[]>([]);
  const debounced = useDebounce(query, 350);

  useEffect(() => {
    if (visible) {
      storage.get<LocationSuggestion[]>(STORAGE_KEYS.recentSearches).then((r) => setRecent(r ?? []));
    }
  }, [visible]);

  useEffect(() => {
    let active = true;
    const q = debounced.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    searchLocations(q).then((r) => {
      if (active) {
        setResults(r);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [debounced]);

  const handleSelect = (s: LocationSuggestion) => {
    const next = [s, ...recent.filter((r) => r.id !== s.id)].slice(0, 6);
    storage.set(STORAGE_KEYS.recentSearches, next);
    setQuery('');
    setResults([]);
    onSelect(s);
    onClose();
  };

  const showRecent = query.trim().length < 2;
  const list = showRecent ? recent : results;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: colors.surfaceAlt,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
              height: 48,
            }}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search city or destination"
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, color: colors.text, fontSize: fontSize.md }}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable hitSlop={8} onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <AppText tone="primary" variant="subtitle">
              Cancel
            </AppText>
          </Pressable>
        </View>

        {showRecent && recent.length > 0 && (
          <AppText variant="label" tone="muted" style={{ paddingHorizontal: spacing.lg, marginBottom: 4 }}>
            RECENT
          </AppText>
        )}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : list.length === 0 ? (
          <EmptyState
            icon="navigate"
            title={showRecent ? 'Search anywhere' : 'No matches'}
            message={
              showRecent
                ? 'Find hotels, attractions and restaurants in any city.'
                : 'Try a different city or spelling.'
            }
          />
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelect(item)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={showRecent ? 'time-outline' : 'location-outline'} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="subtitle" numberOfLines={1}>
                    {item.title}
                  </AppText>
                  {item.subtitle && (
                    <AppText tone="muted" variant="caption" numberOfLines={1}>
                      {item.subtitle}
                    </AppText>
                  )}
                </View>
                <Ionicons name="arrow-up-outline" size={16} color={colors.textMuted} style={{ transform: [{ rotate: '45deg' }] }} />
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
