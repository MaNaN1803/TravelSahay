import { useRef, useState, useCallback } from 'react';
import { View, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useTheme, spacing, radius, fontSize } from '@/theme';
import { Screen, AppText } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { useTrips } from '@/state/TripsProvider';
import { streamChat, type ChatMessage } from '@/api/ai';

const QUICK_ASKS = [
  'Suggest a 3-day weekend trip near me',
  'What should I pack for a beach trip?',
  'Find me budget travel tips for Europe',
  'Translate "where is the station?" to French',
];

export default function ConciergeChatScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const { trips } = useTrips();
  const params = useLocalSearchParams<{ destination?: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(params.destination ? `Tell me about traveling to ${params.destination}` : '');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  // Compact trip context the assistant can use silently.
  const context = trips.length
    ? `My saved trips: ${trips.map((t) => `${t.title} (${t.days}d, ${t.stops.length} stops)`).join('; ')}`
    : undefined;

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || streaming || !token) return;
      const next: ChatMessage[] = [...messages, { role: 'user', content }];
      setMessages([...next, { role: 'assistant', content: '' }]);
      setInput('');
      setStreaming(true);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

      cancelRef.current = streamChat(
        next,
        token,
        {
          onDelta: (delta) =>
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, content: last.content + delta };
              return copy;
            }),
          onDone: () => {
            setStreaming(false);
            requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
          },
          onError: (err) =>
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last?.role === 'assistant' && !last.content) copy[copy.length - 1] = { ...last, content: `⚠ ${err}` };
              setStreaming(false);
              return copy;
            }),
        },
        context,
      );
    },
    [messages, streaming, token, context],
  );

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title="AI Concierge" subtitle="Your 24/7 travel assistant" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', default: undefined })} keyboardVerticalOffset={8}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.length === 0 && (
            <View style={{ gap: spacing.md, paddingTop: spacing.lg }}>
              <View style={{ alignItems: 'center', gap: spacing.sm }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="sparkles" size={32} color={colors.primary} />
                </View>
                <AppText variant="subtitle" center>How can I help your travels?</AppText>
                <AppText tone="muted" center variant="caption">Ask anything — planning, packing, budgets, translations, safety.</AppText>
              </View>
              <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
                {QUICK_ASKS.map((q) => (
                  <Pressable key={q} onPress={() => send(q)} style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
                    <AppText variant="caption">{q}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {messages.map((m, i) => {
            const isUser = m.role === 'user';
            return (
              <View key={i} style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '88%', backgroundColor: isUser ? colors.primary : colors.surfaceAlt, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: isUser ? 0 : 1, borderColor: colors.border }}>
                <AppText style={{ color: isUser ? colors.onPrimary : colors.text }}>
                  {m.content || (streaming && i === messages.length - 1 ? '…' : '')}
                </AppText>
              </View>
            );
          })}
        </ScrollView>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Message your concierge…"
            placeholderTextColor={colors.textMuted}
            multiline
            style={{ flex: 1, maxHeight: 120, color: colors.text, fontSize: fontSize.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border }}
          />
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim() || streaming}
            style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: !input.trim() || streaming ? colors.surfaceAlt : colors.primary, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name={streaming ? 'ellipsis-horizontal' : 'arrow-up'} size={22} color={!input.trim() || streaming ? colors.textMuted : colors.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
