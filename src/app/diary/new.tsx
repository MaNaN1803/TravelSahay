import { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, spacing, radius, fontSize } from '@/theme';
import { Screen, AppText, Button, Chip } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useDiary } from '@/state/DiaryProvider';
import type { DiaryPhoto } from '@/api/backend';

const MOODS = ['😍', '😎', '🤩', '😌', '🥹', '🏖️', '🏔️', '🍜', '✨'];

export default function NewDiaryEntry() {
  const { colors } = useTheme();
  const router = useRouter();
  const { add } = useDiary();

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [mood, setMood] = useState('');
  const [photos, setPhotos] = useState<DiaryPhoto[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toPhotos = (assets: ImagePicker.ImagePickerAsset[]): DiaryPhoto[] =>
    assets
      .map((a) => {
        const data = a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri;
        return data ? { data, width: a.width, height: a.height } : null;
      })
      .filter(Boolean) as DiaryPhoto[];

  const addAssets = (assets: ImagePicker.ImagePickerAsset[]) =>
    setPhotos((prev) => [...prev, ...toPhotos(assets)].slice(0, 8));

  const pickFromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 8,
      quality: 0.4,
      base64: true,
    });
    if (!res.canceled) addAssets(res.assets);
  };

  const capture = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera permission', 'Allow camera access to take photos.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.4, base64: true });
    if (!res.canceled) addAssets(res.assets);
  };

  const useCurrentLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return;
    const pos = await Location.getCurrentPositionAsync({});
    const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    setLocation(c);
    try {
      const geo = await Location.reverseGeocodeAsync(c);
      const g = geo[0];
      if (g && !placeName) setPlaceName([g.city, g.country].filter(Boolean).join(', '));
    } catch {
      // ignore
    }
  };

  const save = async () => {
    if (!title.trim()) {
      setError('Give your memory a title');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await add({
        title: title.trim(),
        note: note.trim(),
        placeName: placeName.trim(),
        mood,
        date: new Date().toISOString(),
        location,
        photos,
      });
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="New memory" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 }} keyboardShouldPersistTaps="handled">
          {/* Photos */}
          <View style={{ gap: spacing.sm }}>
            <AppText variant="subtitle">Photos</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              <Pressable onPress={capture} style={{ width: 96, height: 96, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Ionicons name="camera" size={24} color={colors.primary} />
                <AppText variant="label" tone="muted">Camera</AppText>
              </Pressable>
              <Pressable onPress={pickFromLibrary} style={{ width: 96, height: 96, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Ionicons name="images" size={24} color={colors.primary} />
                <AppText variant="label" tone="muted">Gallery</AppText>
              </Pressable>
              {photos.map((p, i) => (
                <View key={i} style={{ width: 96, height: 96 }}>
                  <Image source={{ uri: p.data }} style={{ width: 96, height: 96, borderRadius: radius.md }} contentFit="cover" />
                  <Pressable
                    onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Title */}
          <Input label="Title" value={title} onChangeText={setTitle} placeholder="Sunset at Baga Beach" />

          {/* Mood */}
          <View style={{ gap: spacing.sm }}>
            <AppText variant="subtitle">Mood</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {MOODS.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setMood((cur) => (cur === m ? '' : m))}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: mood === m ? colors.primaryMuted : colors.surfaceAlt,
                    borderWidth: 2,
                    borderColor: mood === m ? colors.primary : 'transparent',
                  }}
                >
                  <AppText style={{ fontSize: 22 }}>{m}</AppText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Place */}
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText variant="subtitle">Place</AppText>
              <Pressable onPress={useCurrentLocation} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="locate" size={14} color={colors.primary} />
                <AppText variant="caption" tone="primary" style={{ fontWeight: '700' }}>Use current</AppText>
              </Pressable>
            </View>
            <Input value={placeName} onChangeText={setPlaceName} placeholder="Goa, India" />
          </View>

          {/* Note */}
          <View style={{ gap: spacing.sm }}>
            <AppText variant="subtitle">Note</AppText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What made this moment special?"
              placeholderTextColor={colors.textMuted}
              multiline
              style={{ minHeight: 110, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.md, textAlignVertical: 'top' }}
            />
          </View>

          {error && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <AppText style={{ color: colors.danger }} variant="caption">{error}</AppText>
            </View>
          )}

          <Button label="Save memory" icon="checkmark-circle" loading={saving} fullWidth onPress={save} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Input({ label, ...rest }: { label?: string } & React.ComponentProps<typeof TextInput>) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label && <AppText variant="subtitle">{label}</AppText>}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={{ height: 50, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.text, fontSize: fontSize.md }}
        {...rest}
      />
    </View>
  );
}
