import { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radius, fontSize } from '@/theme';
import { Screen, AppText, Card, Button, Chip, Badge, EmptyState } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { community, type Post } from '@/api/community';

const KINDS = ['post', 'review', 'story', 'journal', 'reel'];

export default function FeedScreen() {
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [kind, setKind] = useState('post');
  const [text, setText] = useState('');
  const [place, setPlace] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentFor, setCommentFor] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    community.feed(token, following).then((r) => setPosts(r.posts)).finally(() => setLoading(false));
  }, [token, following]);
  useEffect(load, [load]);

  const submit = async () => {
    if (!token || !text.trim()) return;
    setPosting(true);
    try {
      const r = await community.createPost({ kind, text: text.trim(), place: place.trim() }, token);
      setText(''); setPlace('');
      setPosts((p) => [r.post, ...p]);
    } finally { setPosting(false); }
  };

  const like = async (id: string) => {
    if (!token) return;
    const r = await community.likePost(id, token);
    setPosts((p) => p.map((x) => (x._id === id ? r.post : x)));
  };
  const comment = async (id: string) => {
    if (!token || !commentText.trim()) return;
    const r = await community.commentPost(id, commentText.trim(), token);
    setPosts((p) => p.map((x) => (x._id === id ? r.post : x)));
    setCommentText(''); setCommentFor(null);
  };

  const myId = user?.id;

  return (
    <Screen>
      <ScreenHeader title="Travel Feed" subtitle="Posts · reviews · stories" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.x3 }}>
        <Card padded style={{ gap: spacing.sm }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {KINDS.map((k) => <Chip key={k} label={k} active={kind === k} onPress={() => setKind(k)} />)}
          </ScrollView>
          <TextInput value={text} onChangeText={setText} placeholder="Share a travel moment…" placeholderTextColor={colors.textMuted} multiline style={{ minHeight: 60, color: colors.text, fontSize: fontSize.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border }} />
          <TextInput value={place} onChangeText={setPlace} placeholder="📍 Place (optional)" placeholderTextColor={colors.textMuted} style={{ color: colors.text, fontSize: fontSize.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 42, borderWidth: 1, borderColor: colors.border }} />
          <Button label={posting ? 'Posting…' : 'Post'} icon="send" loading={posting} onPress={submit} disabled={!text.trim()} fullWidth />
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Chip label="Everyone" active={!following} onPress={() => setFollowing(false)} />
          <Chip label="Following" active={following} onPress={() => setFollowing(true)} />
        </View>

        {loading ? <ActivityIndicator color={colors.primary} /> : posts.length === 0 ? (
          <EmptyState icon="newspaper-outline" title="No posts yet" message="Be the first to share a travel moment." />
        ) : posts.map((p) => {
          const liked = myId ? p.likes.includes(myId) : false;
          return (
            <Card key={p._id} padded style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <AppText tone="primary" style={{ fontWeight: '800' }}>{(p.author || 'T')[0].toUpperCase()}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontWeight: '700' }}>{p.author}</AppText>
                  {p.place ? <AppText variant="caption" tone="muted">📍 {p.place}</AppText> : null}
                </View>
                <Badge label={p.kind} tone="neutral" />
              </View>
              {p.text ? <AppText>{p.text}</AppText> : null}
              {p.kind === 'review' && p.rating ? <AppText tone="primary">{'⭐'.repeat(Math.round(p.rating))}</AppText> : null}

              <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: 2 }}>
                <Pressable onPress={() => like(p._id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? colors.danger : colors.textMuted} />
                  <AppText variant="caption" tone="muted">{p.likes.length}</AppText>
                </Pressable>
                <Pressable onPress={() => setCommentFor(commentFor === p._id ? null : p._id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="chatbubble-outline" size={18} color={colors.textMuted} />
                  <AppText variant="caption" tone="muted">{p.comments.length}</AppText>
                </Pressable>
              </View>

              {p.comments.map((c, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: spacing.sm, paddingLeft: spacing.sm }}>
                  <AppText variant="caption" style={{ fontWeight: '700' }}>{c.author}</AppText>
                  <AppText variant="caption" tone="muted" style={{ flex: 1 }}>{c.text}</AppText>
                </View>
              ))}

              {commentFor === p._id && (
                <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                  <TextInput value={commentText} onChangeText={setCommentText} placeholder="Add a comment…" placeholderTextColor={colors.textMuted} style={{ flex: 1, color: colors.text, fontSize: fontSize.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 40, borderWidth: 1, borderColor: colors.border }} />
                  <Pressable onPress={() => comment(p._id)} disabled={!commentText.trim()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: commentText.trim() ? colors.primary : colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="arrow-up" size={18} color={commentText.trim() ? colors.onPrimary : colors.textMuted} />
                  </Pressable>
                </View>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
