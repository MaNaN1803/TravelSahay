import { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Pressable, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, Card, Button, Field, Chip, Badge, EmptyState } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { storage } from '@/lib/storage';
import { community, type Listing, type Plan } from '@/api/community';

const PLAN_KEY = 'ts.plan';

const KINDS = [
  { key: '', label: 'All' },
  { key: 'itinerary', label: 'Itineraries' },
  { key: 'guide', label: 'Local Guides' },
  { key: 'experience', label: 'Experiences' },
  { key: 'rental', label: 'Rentals' },
];

export default function MarketplaceScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [tab, setTab] = useState<'browse' | 'premium' | 'sell'>('browse');
  const [kind, setKind] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  // sell form
  const [sKind, setSKind] = useState('itinerary');
  const [sTitle, setSTitle] = useState('');
  const [sDest, setSDest] = useState('');
  const [sPrice, setSPrice] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [currentPlan, setCurrentPlan] = useState('free');
  const [bought, setBought] = useState<Set<string>>(new Set());
  const [affDest, setAffDest] = useState('');
  const [affiliates, setAffiliates] = useState<{ label: string; url: string; type: string }[]>([]);

  useEffect(() => { storage.get<string>(PLAN_KEY).then((p) => p && setCurrentPlan(p)); }, []);

  const upgrade = (id: string) => { setCurrentPlan(id); storage.set(PLAN_KEY, id); };

  const buy = async (id: string) => {
    if (!token) return;
    await community.buyListing(id, token).catch(() => {});
    setBought((b) => new Set(b).add(id));
  };

  const loadAffiliates = async () => {
    if (!token) return;
    const r = await community.affiliates(affDest || 'travel', token);
    setAffiliates(r.affiliates);
  };

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([community.listings(token, kind || undefined), community.plans(token)])
      .then(([l, p]) => { setListings(l.listings); setPlans(p.plans); })
      .finally(() => setLoading(false));
  }, [token, kind]);
  useEffect(load, [load]);

  const create = async () => {
    if (!token || !sTitle.trim()) return;
    await community.createListing({ kind: sKind, title: sTitle.trim(), destination: sDest.trim(), price: Number(sPrice) || 0, description: sDesc.trim() }, token);
    setSTitle(''); setSDest(''); setSPrice(''); setSDesc(''); setTab('browse'); load();
  };

  return (
    <Screen>
      <ScreenHeader title="Marketplace" subtitle="Itineraries · guides · premium" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Chip label="Browse" active={tab === 'browse'} onPress={() => setTab('browse')} />
          <Chip label="Premium" active={tab === 'premium'} onPress={() => setTab('premium')} />
          <Chip label="Sell" active={tab === 'sell'} onPress={() => setTab('sell')} />
        </View>

        {tab === 'browse' && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {KINDS.map((k) => <Chip key={k.key} label={k.label} active={kind === k.key} onPress={() => setKind(k.key)} />)}
            </ScrollView>
            {loading ? <ActivityIndicator color={colors.primary} /> : listings.length === 0 ? (
              <EmptyState icon="storefront-outline" title="Nothing listed yet" message="Be the first to publish an itinerary or service." />
            ) : listings.map((l) => (
              <Card key={l._id} padded style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <AppText variant="subtitle" style={{ flex: 1 }}>{l.title}</AppText>
                  {l.verified && <Badge label="Verified" tone="success" />}
                  <Badge label={l.price > 0 ? `${l.currency} ${l.price}` : 'Free'} tone={l.price > 0 ? 'accent' : 'primary'} />
                </View>
                <AppText tone="muted" variant="caption">{l.kind} · {l.destination || 'anywhere'} · by {l.sellerName}</AppText>
                {l.description ? <AppText tone="muted">{l.description}</AppText> : null}
                {l.ratingCount > 0 && <AppText variant="caption" tone="muted">⭐ {l.rating.toFixed(1)} ({l.ratingCount})</AppText>}
                <Button label={bought.has(l._id) ? 'Added ✓' : l.price > 0 ? 'Buy / Copy' : 'Get it free'} size="sm" icon={bought.has(l._id) ? 'checkmark-circle' : 'download'} variant={bought.has(l._id) ? 'secondary' : 'primary'} disabled={bought.has(l._id)} onPress={() => buy(l._id)} />
              </Card>
            ))}

            <Card padded style={{ gap: spacing.sm }}>
              <AppText variant="subtitle">🔗 Book flights, hotels & insurance</AppText>
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
                <View style={{ flex: 1 }}><Field label="Destination" icon="location-outline" placeholder="e.g. Bali" value={affDest} onChangeText={setAffDest} /></View>
                <Button label="Get links" size="sm" onPress={loadAffiliates} />
              </View>
              {affiliates.map((a) => (
                <Pressable key={a.type} onPress={() => Linking.openURL(a.url).catch(() => {})} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm }}>
                  <Ionicons name={a.type === 'flight' ? 'airplane' : a.type === 'hotel' ? 'bed' : 'shield-checkmark'} size={18} color={colors.primary} />
                  <AppText style={{ flex: 1 }}>{a.label}</AppText>
                  <Ionicons name="open-outline" size={16} color={colors.textMuted} />
                </Pressable>
              ))}
            </Card>
          </>
        )}

        {tab === 'premium' && (
          <>
            {plans.map((p) => (
              <Card key={p.id} padded style={{ gap: spacing.sm, borderWidth: currentPlan === p.id ? 2 : 0, borderColor: colors.primary }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <AppText variant="subtitle" style={{ flex: 1 }}>{p.name}</AppText>
                  {currentPlan === p.id && <Badge label="Current" tone="success" />}
                  <AppText variant="heading" tone="primary">{p.price === 0 ? 'Free' : `${p.currency} ${p.price}/mo`}</AppText>
                </View>
                {p.perks.map((perk, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <AppText tone="muted" variant="caption">{perk}</AppText>
                  </View>
                ))}
                {currentPlan !== p.id && <Button label={p.price > 0 ? `Upgrade to ${p.name}` : 'Switch to Free'} size="sm" onPress={() => upgrade(p.id)} />}
              </Card>
            ))}
            <AppText variant="caption" tone="muted" center>Affiliate flight/hotel & insurance links appear contextually inside trips.</AppText>
          </>
        )}

        {tab === 'sell' && (
          <Card padded style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {['itinerary', 'guide', 'experience', 'rental'].map((k) => <Chip key={k} label={k} active={sKind === k} onPress={() => setSKind(k)} />)}
            </View>
            <Field label="Title" icon="pricetag-outline" placeholder="e.g. 5-day Kerala backwaters plan" value={sTitle} onChangeText={setSTitle} />
            <Field label="Destination" icon="location-outline" placeholder="e.g. Kerala" value={sDest} onChangeText={setSDest} />
            <Field label="Price (INR, 0 = free)" icon="cash-outline" placeholder="0" keyboardType="number-pad" value={sPrice} onChangeText={setSPrice} />
            <Field label="Description" icon="document-text-outline" placeholder="What's included" value={sDesc} onChangeText={setSDesc} />
            <Button label="Publish listing" icon="cloud-upload" onPress={create} disabled={!sTitle.trim()} fullWidth />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
