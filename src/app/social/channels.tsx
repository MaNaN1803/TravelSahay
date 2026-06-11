import { useEffect, useState, useCallback, useRef } from 'react';
import { ScrollView, View, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radius, fontSize } from '@/theme';
import { Screen, AppText, Card, Button, Field, Badge, EmptyState } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { community, type Channel } from '@/api/community';

export default function ChannelsScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDest, setNewDest] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [open, setOpen] = useState<Channel | null>(null);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);
  const [pollQ, setPollQ] = useState('');
  const [pollOpts, setPollOpts] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(() => {
    if (!token) return;
    community.listChannels(token).then((r) => { setChannels(r.channels); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);
  useEffect(load, [load]);

  // Poll the open channel for new messages (realtime-ish without socket client).
  useEffect(() => {
    if (!open || !token) return;
    const id = setInterval(() => community.getChannel(open._id, token).then((r) => setOpen(r.channel)).catch(() => {}), 3000);
    return () => clearInterval(id);
  }, [open?._id, token]);

  const create = async () => {
    if (!token || !newName.trim()) return;
    const r = await community.createChannel({ name: newName.trim(), destination: newDest.trim() }, token);
    setNewName(''); setNewDest(''); setCreating(false);
    setChannels((c) => [r.channel, ...c]);
  };
  const join = async () => {
    if (!token || !joinCode.trim()) return;
    try { const r = await community.joinChannel({ inviteCode: joinCode.trim() }, token); setJoinCode(''); setOpen(r.channel); load(); } catch {}
  };
  const openChannel = async (c: Channel) => {
    if (!token) return;
    try { const r = await community.joinChannel({ channelId: c._id }, token); setOpen(r.channel); } catch { setOpen(c); }
  };
  const createPoll = async () => {
    if (!token || !open || !pollQ.trim()) return;
    const options = pollOpts.split(',').map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) return;
    const r = await community.createPoll(open._id, { question: pollQ.trim(), options }, token);
    setOpen(r.channel); setPollQ(''); setPollOpts(''); setPollOpen(false);
  };
  const send = async () => {
    if (!token || !open || !msg.trim()) return;
    setSending(true);
    try {
      await community.sendMessage(open._id, msg.trim(), token);
      setMsg('');
      const r = await community.getChannel(open._id, token); setOpen(r.channel);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } finally { setSending(false); }
  };

  if (open) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ScreenHeader title={open.name} subtitle={`${open.members.length} members · ${open.destination || 'channel'}`} right={
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Pressable onPress={() => setPollOpen((v) => !v)} hitSlop={8}><Ionicons name="bar-chart" size={22} color={pollOpen ? colors.primary : colors.text} /></Pressable>
            <Pressable onPress={() => setOpen(null)} hitSlop={8}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
          </View>
        } />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', default: undefined })} keyboardVerticalOffset={8}>
          <ScrollView ref={scrollRef} contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
            {pollOpen && (
              <Card padded style={{ gap: spacing.sm }}>
                <AppText variant="subtitle">Create a poll</AppText>
                <Field label="Question" icon="help-circle-outline" placeholder="e.g. Which beach first?" value={pollQ} onChangeText={setPollQ} />
                <Field label="Options (comma separated)" icon="list-outline" placeholder="Baga, Anjuna, Palolem" value={pollOpts} onChangeText={setPollOpts} />
                <Button label="Create poll" size="sm" icon="add" onPress={createPoll} disabled={!pollQ.trim() || pollOpts.split(',').filter((o) => o.trim()).length < 2} />
              </Card>
            )}
            {open.polls?.map((p) => (
              <Card key={p._id} padded style={{ gap: 6 }}>
                <AppText variant="subtitle">📊 {p.question}</AppText>
                {p.options.map((o) => (
                  <Pressable key={o._id} onPress={() => token && community.votePoll(open._id, p._id, o._id, token).then((r) => setOpen(r.channel))} style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surfaceAlt, padding: spacing.sm, borderRadius: radius.sm }}>
                    <AppText>{o.text}</AppText><AppText tone="muted">{o.votes.length}</AppText>
                  </Pressable>
                ))}
              </Card>
            ))}
            {open.messages.length === 0 && <AppText tone="muted" center>No messages yet. Say hi! 👋</AppText>}
            {open.messages.map((m) => (
              <View key={m._id} style={{ gap: 2 }}>
                <AppText variant="caption" tone="primary" style={{ fontWeight: '700' }}>{m.author}</AppText>
                <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.border }}>
                  <AppText style={{ opacity: m.flagged ? 0.5 : 1 }}>{m.flagged ? '⚠ message hidden by moderation' : m.text}</AppText>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
            <TextInput value={msg} onChangeText={setMsg} placeholder="Message…" placeholderTextColor={colors.textMuted} style={{ flex: 1, color: colors.text, fontSize: fontSize.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, paddingHorizontal: spacing.md, height: 44, borderWidth: 1, borderColor: colors.border }} />
            <Pressable onPress={send} disabled={!msg.trim() || sending} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: !msg.trim() ? colors.surfaceAlt : colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="arrow-up" size={20} color={!msg.trim() ? colors.textMuted : colors.onPrimary} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Travel Channels" subtitle="Join the conversation" right={<Pressable onPress={() => setCreating((c) => !c)} hitSlop={8}><Ionicons name="add-circle" size={26} color={colors.primary} /></Pressable>} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.x3 }}>
        {creating && (
          <Card padded style={{ gap: spacing.md }}>
            <Field label="Channel name" icon="chatbubbles-outline" placeholder="e.g. Goa July 2027" value={newName} onChangeText={setNewName} />
            <Field label="Destination" icon="location-outline" placeholder="e.g. Goa" value={newDest} onChangeText={setNewDest} />
            <Button label="Create channel" icon="add" onPress={create} disabled={!newName.trim()} fullWidth />
          </Card>
        )}
        <Card padded style={{ gap: spacing.sm, flexDirection: 'row', alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}><Field label="Join private channel" icon="key-outline" placeholder="invite code" autoCapitalize="characters" value={joinCode} onChangeText={setJoinCode} /></View>
          <Button label="Join" size="sm" onPress={join} disabled={!joinCode.trim()} />
        </Card>

        {loading ? <ActivityIndicator color={colors.primary} /> : channels.length === 0 ? (
          <EmptyState icon="chatbubbles-outline" title="No channels yet" message="Create the first destination channel." />
        ) : channels.map((c) => (
          <Pressable key={c._id} onPress={() => openChannel(c)}>
            {({ pressed }) => (
              <Card padded style={{ opacity: pressed ? 0.85 : 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={c.visibility === 'private' ? 'lock-closed' : 'chatbubbles'} size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="subtitle">{c.name}</AppText>
                  <AppText tone="muted" variant="caption">{c.destination || 'Travel'} · {c.members.length} members</AppText>
                </View>
                {c.visibility === 'private' && <Badge label="Private" tone="neutral" />}
              </Card>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
