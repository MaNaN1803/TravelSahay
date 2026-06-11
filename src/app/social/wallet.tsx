import { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, Card, Button, Field, Chip, Badge, EmptyState } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { community, type SharedTrip, type Settlement } from '@/api/community';

export default function WalletScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [trips, setTrips] = useState<SharedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<SharedTrip | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [decision, setDecision] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  // create / join
  const [title, setTitle] = useState('');
  const [dest, setDest] = useState('');
  const [code, setCode] = useState('');
  // expense form
  const [expLabel, setExpLabel] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPaidBy, setExpPaidBy] = useState('');
  // candidate (vote) form
  const [candTitle, setCandTitle] = useState('');
  const [candKind, setCandKind] = useState('attraction');

  const load = useCallback(() => {
    if (!token) return;
    community.listShared(token).then((r) => { setTrips(r.trips); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);
  useEffect(load, [load]);

  const create = async () => {
    if (!token || !title.trim()) return;
    const r = await community.createShared({ title: title.trim(), destination: dest.trim(), days: 3 }, token);
    setTitle(''); setDest(''); setTrips((t) => [r.trip, ...t]); setOpen(r.trip);
  };
  const join = async () => {
    if (!token || !code.trim()) return;
    try { const r = await community.joinShared(code.trim(), token); setCode(''); setOpen(r.trip); load(); } catch {}
  };
  const openTrip = async (t: SharedTrip) => {
    setOpen(t); setSettlement(null); setDecision(null);
    if (token) { const s = await community.settlement(t._id, token); setSettlement(s.settlement); }
  };
  const addExpense = async () => {
    if (!token || !open || !expLabel.trim() || !expAmount || !expPaidBy.trim()) return;
    setBusy(true);
    try {
      const r = await community.addExpense(open._id, { label: expLabel.trim(), amount: Number(expAmount), paidBy: expPaidBy.trim() }, token);
      setOpen(r.trip); setExpLabel(''); setExpAmount(''); setExpPaidBy('');
      const s = await community.settlement(open._id, token); setSettlement(s.settlement);
    } finally { setBusy(false); }
  };
  const addCandidate = async () => {
    if (!token || !open || !candTitle.trim()) return;
    const r = await community.addCandidate(open._id, { kind: candKind, title: candTitle.trim() }, token);
    setOpen(r.trip); setCandTitle('');
  };
  const voteCandidate = async (candidateId: string) => {
    if (!token || !open) return;
    const r = await community.vote(open._id, candidateId, token);
    setOpen(r.trip);
  };
  const runDecision = async () => {
    if (!token || !open) return;
    setBusy(true);
    try { const r = await community.decision(open._id, {}, token); setDecision(r.decision); } finally { setBusy(false); }
  };

  if (open) {
    return (
      <Screen>
        <ScreenHeader title={open.title} subtitle={`Invite code: ${open.inviteCode}`} right={<Pressable onPress={() => setOpen(null)} hitSlop={8}><Ionicons name="close" size={24} color={colors.text} /></Pressable>} />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 }}>
          <Card padded style={{ gap: 4 }}>
            <AppText variant="subtitle">Members</AppText>
            <AppText tone="muted">{open.members.map((m) => m.name).join(', ')}</AppText>
            <AppText variant="caption" tone="primary">Share code {open.inviteCode} to invite friends.</AppText>
          </Card>

          <Card padded style={{ gap: spacing.sm }}>
            <AppText variant="subtitle">🗳 Vote on the plan</AppText>
            <AppText tone="muted" variant="caption">Add hotels, places or activities — everyone votes.</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {['hotel', 'attraction', 'restaurant', 'activity'].map((k) => <Chip key={k} label={k} active={candKind === k} onPress={() => setCandKind(k)} />)}
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}><Field label="Suggestion" icon="add-circle-outline" placeholder="e.g. Taj Resort" value={candTitle} onChangeText={setCandTitle} /></View>
              <Button label="Add" size="sm" onPress={addCandidate} disabled={!candTitle.trim()} />
            </View>
            {open.candidates.map((c) => (
              <Pressable key={c._id} onPress={() => voteCandidate(c._id)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm }}>
                <Ionicons name="thumbs-up" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <AppText>{c.title}</AppText>
                  <AppText variant="caption" tone="muted">{c.kind}{c.addedBy ? ` · by ${c.addedBy}` : ''}</AppText>
                </View>
                <Badge label={`${c.votes.length} ${c.votes.length === 1 ? 'vote' : 'votes'}`} tone="primary" />
              </Pressable>
            ))}
          </Card>

          <Card padded style={{ gap: spacing.md }}>
            <AppText variant="subtitle">Add expense</AppText>
            <Field label="What for" icon="pricetag-outline" placeholder="e.g. Hotel night 1" value={expLabel} onChangeText={setExpLabel} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}><Field label="Amount" icon="cash-outline" placeholder="5000" keyboardType="number-pad" value={expAmount} onChangeText={setExpAmount} /></View>
              <View style={{ flex: 1 }}><Field label="Paid by" icon="person-outline" placeholder="name" value={expPaidBy} onChangeText={setExpPaidBy} /></View>
            </View>
            <Button label={busy ? 'Adding…' : 'Add expense'} icon="add" onPress={addExpense} disabled={!expLabel.trim() || !expAmount || !expPaidBy.trim()} fullWidth />
          </Card>

          {open.expenses.length > 0 && (
            <Card padded style={{ gap: 6 }}>
              <AppText variant="subtitle">Expenses</AppText>
              {open.expenses.map((e) => (
                <View key={e._id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText tone="muted">{e.label} · {e.paidBy}</AppText>
                  <AppText>{e.currency} {e.amount.toLocaleString()}</AppText>
                </View>
              ))}
            </Card>
          )}

          {settlement && (
            <Card padded style={{ gap: 6 }}>
              <AppText variant="subtitle">💸 Settlement</AppText>
              <AppText tone="muted">Total spent: ₹{settlement.totalSpent.toLocaleString()}</AppText>
              {settlement.transfers.length === 0 ? <AppText tone="muted" variant="caption">All settled up.</AppText> :
                settlement.transfers.map((t, i) => <AppText key={i}>{t.from} → {t.to}: <AppText tone="primary">₹{t.amount.toLocaleString()}</AppText></AppText>)}
            </Card>
          )}

          <Button label={busy ? 'Thinking…' : 'AI resolve group conflicts'} icon="sparkles" variant="secondary" loading={busy} onPress={runDecision} fullWidth />
          {decision && (
            <Card padded style={{ gap: 6 }}>
              <AppText variant="subtitle">🤝 Group decision</AppText>
              <AppText>{decision.recommendation}</AppText>
              {decision.compromises?.map((c: string, i: number) => <AppText key={i} tone="muted">• {c}</AppText>)}
            </Card>
          )}
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Group Wallet" subtitle="Shared trips & settlements" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.x3 }}>
        <Card padded style={{ gap: spacing.md }}>
          <AppText variant="subtitle">New shared trip</AppText>
          <Field label="Title" icon="people-outline" placeholder="e.g. Goa Squad" value={title} onChangeText={setTitle} />
          <Field label="Destination" icon="location-outline" placeholder="e.g. Goa" value={dest} onChangeText={setDest} />
          <Button label="Create" icon="add" onPress={create} disabled={!title.trim()} fullWidth />
        </Card>
        <Card padded style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
          <View style={{ flex: 1 }}><Field label="Join with code" icon="key-outline" placeholder="invite code" autoCapitalize="characters" value={code} onChangeText={setCode} /></View>
          <Button label="Join" size="sm" onPress={join} disabled={!code.trim()} />
        </Card>

        {loading ? <ActivityIndicator color={colors.primary} /> : trips.length === 0 ? (
          <EmptyState icon="wallet-outline" title="No shared trips" message="Create one and invite friends to split costs." />
        ) : trips.map((t) => (
          <Pressable key={t._id} onPress={() => openTrip(t)}>
            {({ pressed }) => (
              <Card padded style={{ opacity: pressed ? 0.85 : 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="people" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="subtitle">{t.title}</AppText>
                  <AppText tone="muted" variant="caption">{t.members.length} members · {t.expenses.length} expenses</AppText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Card>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
