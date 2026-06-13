import { useState } from 'react';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, spacing, radius } from '@/theme';
import { Screen, AppText, Card, Button, Field, Chip, Badge } from '@/components/ui';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/state/AuthProvider';
import { ai } from '@/api/ai';

type Tool = 'safety' | 'visa' | 'emergency' | 'predictive' | 'events' | 'copilot';
const TOOLS: { key: Tool; label: string; icon: any }[] = [
  { key: 'safety', label: 'Safety', icon: 'shield-checkmark' },
  { key: 'visa', label: 'Visa', icon: 'document-text' },
  { key: 'emergency', label: 'Emergency', icon: 'medkit' },
  { key: 'predictive', label: 'Predict', icon: 'analytics' },
  { key: 'events', label: 'Events', icon: 'musical-notes' },
  { key: 'copilot', label: 'Copilot', icon: 'navigate' },
];

function Bullets({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <Card padded style={{ gap: 6 }}>
      <AppText variant="subtitle">{title}</AppText>
      {items.map((s, i) => <AppText key={i} tone="muted">• {s}</AppText>)}
    </Card>
  );
}

export default function AssistScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ destination?: string }>();
  const [tool, setTool] = useState<Tool>('safety');
  const [a, setA] = useState(params.destination ?? '');
  const [b, setB] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Switching tools keeps the destination (field a) so users can run several
  // checks for the same place without retyping.
  const reset = (t: Tool) => { setTool(t); setResult(null); setError(null); };

  const run = async () => {
    if (!token || !a.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      let r: any;
      if (tool === 'safety') r = (await ai.safety({ destination: a, dates: b }, token)).safety;
      else if (tool === 'visa') r = (await ai.visa({ fromCountry: b || 'India', toCountry: a, purpose: 'tourism' }, token)).visa;
      else if (tool === 'emergency') r = (await ai.emergency({ situation: a, location: b }, token)).emergency;
      else if (tool === 'predictive') r = (await ai.predictive({ destination: a, dates: b }, token)).prediction;
      else if (tool === 'events') r = (await ai.events({ destination: a, dates: b }, token)).events;
      else r = { answer: (await ai.copilot({ query: a, location: b }, token)).answer };
      setResult(r);
    } catch (e: any) {
      setError(e?.message ?? 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const fields: Record<Tool, { aLabel: string; aIcon: any; aPh: string; bLabel: string; bIcon: any; bPh: string; cta: string }> = {
    safety: { aLabel: 'Destination', aIcon: 'location-outline', aPh: 'e.g. Cairo', bLabel: 'Dates (optional)', bIcon: 'calendar-outline', bPh: 'e.g. December', cta: 'Check safety' },
    visa: { aLabel: 'Destination country', aIcon: 'flag-outline', aPh: 'e.g. Japan', bLabel: 'Your passport country', bIcon: 'card-outline', bPh: 'e.g. India', cta: 'Check visa' },
    emergency: { aLabel: 'What happened?', aIcon: 'alert-circle-outline', aPh: 'e.g. lost my passport', bLabel: 'Where are you?', bIcon: 'location-outline', bPh: 'e.g. Bangkok', cta: 'Get action plan' },
    predictive: { aLabel: 'Destination', aIcon: 'location-outline', aPh: 'e.g. Manali', bLabel: 'Dates (optional)', bIcon: 'calendar-outline', bPh: 'e.g. next week', cta: 'Predict disruptions' },
    events: { aLabel: 'Destination', aIcon: 'location-outline', aPh: 'e.g. Berlin', bLabel: 'Dates (optional)', bIcon: 'calendar-outline', bPh: 'e.g. summer', cta: 'Find events' },
    copilot: { aLabel: 'Ask anything', aIcon: 'help-circle-outline', aPh: 'e.g. nearest pharmacy?', bLabel: 'Your location (optional)', bIcon: 'location-outline', bPh: 'e.g. Rome', cta: 'Ask copilot' },
  };
  const f = fields[tool];

  return (
    <Screen>
      <ScreenHeader title="Travel Assistant" subtitle="Safety · Visa · Emergency · more" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.x3 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {TOOLS.map((t) => <Chip key={t.key} label={t.label} icon={t.icon} active={tool === t.key} onPress={() => reset(t.key)} />)}
        </ScrollView>

        <Card padded style={{ gap: spacing.md }}>
          <Field label={f.aLabel} icon={f.aIcon} placeholder={f.aPh} value={a} onChangeText={setA} />
          <Field label={f.bLabel} icon={f.bIcon} placeholder={f.bPh} value={b} onChangeText={setB} />
          {error && <AppText tone="danger">{error}</AppText>}
          <Button label={loading ? 'Working…' : f.cta} icon="sparkles" loading={loading} onPress={run} disabled={!a.trim()} fullWidth />
        </Card>

        {loading && <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}><ActivityIndicator color={colors.primary} /></View>}

        {result && tool === 'safety' && (
          <>
            <Card padded style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <AppText variant="subtitle">Overall risk</AppText>
                <Badge label={String(result.overallRisk).toUpperCase()} tone={result.overallRisk === 'high' ? 'danger' : result.overallRisk === 'low' ? 'success' : 'accent'} />
              </View>
              {typeof result.safetyScore === 'number' && <AppText tone="muted">Safety score: {result.safetyScore}/100</AppText>}
            </Card>
            {result.alerts?.map((al: any, i: number) => (
              <Card key={i} padded style={{ gap: 2 }}>
                <AppText style={{ fontWeight: '700' }}>{al.type}{al.severity ? ` · ${al.severity}` : ''}</AppText>
                <AppText tone="muted">{al.message}</AppText>
              </Card>
            ))}
            <Bullets title="Unsafe areas" items={result.unsafeAreas} />
            <Bullets title="Health risks" items={result.healthRisks} />
            <Bullets title="Safety tips" items={result.tips} />
          </>
        )}

        {result && tool === 'visa' && (
          <>
            <Card padded style={{ gap: 6 }}>
              <Badge label={result.visaRequired ? 'Visa required' : 'No visa needed'} tone={result.visaRequired ? 'accent' : 'success'} />
              {result.visaType ? <AppText>Type: {result.visaType}</AppText> : null}
              {result.processingTime ? <AppText tone="muted">Processing: {result.processingTime}</AppText> : null}
              {result.estimatedCost ? <AppText tone="muted">Cost: {result.estimatedCost}</AppText> : null}
            </Card>
            <Bullets title="Document checklist" items={result.documentChecklist} />
            <Bullets title="Form guidance" items={result.formGuidance} />
            {result.disclaimer ? <AppText variant="caption" tone="muted">⚠ {result.disclaimer}</AppText> : null}
          </>
        )}

        {result && tool === 'emergency' && (
          <>
            <Bullets title="Do this now" items={result.immediateSteps} />
            {result.contacts?.length ? (
              <Card padded style={{ gap: 6 }}>
                <AppText variant="subtitle">Contacts</AppText>
                {result.contacts.map((c: any, i: number) => (
                  <AppText key={i} tone="muted">• {c.label}{c.number ? `: ${c.number}` : ''}{c.note ? ` (${c.note})` : ''}</AppText>
                ))}
              </Card>
            ) : null}
            <Bullets title="Documents needed" items={result.documentsNeeded} />
            <Bullets title="Useful phrases" items={result.phrasesToSay} />
            {result.disclaimer ? <AppText variant="caption" tone="muted">⚠ {result.disclaimer}</AppText> : null}
          </>
        )}

        {result && tool === 'predictive' && (
          <>
            {result.summary ? <AppText tone="muted">{result.summary}</AppText> : null}
            {result.predictions?.map((p: any, i: number) => (
              <Card key={i} padded style={{ gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <AppText style={{ fontWeight: '700' }}>{p.risk}</AppText>
                  <Badge label={String(p.likelihood).toUpperCase()} tone={p.likelihood === 'high' ? 'danger' : p.likelihood === 'low' ? 'success' : 'accent'} />
                </View>
                <AppText tone="muted">{p.detail}</AppText>
                {p.mitigation ? <AppText variant="caption" tone="primary">→ {p.mitigation}</AppText> : null}
              </Card>
            ))}
          </>
        )}

        {result && tool === 'events' && result.events?.map((e: any, i: number) => (
          <Card key={i} padded style={{ gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <AppText style={{ fontWeight: '700', flex: 1 }}>{e.name}</AppText>
              <Badge label={e.category} tone="primary" />
            </View>
            {e.when ? <AppText variant="caption" tone="muted">🗓 {e.when}{e.where ? ` · ${e.where}` : ''}</AppText> : null}
            {e.description ? <AppText tone="muted">{e.description}</AppText> : null}
          </Card>
        ))}

        {result && tool === 'copilot' && (
          <Card padded><AppText style={{ lineHeight: 22 }}>{result.answer}</AppText></Card>
        )}

        {result && a.trim() && ['safety', 'visa', 'predictive', 'events'].includes(tool) && (
          <Card padded style={{ gap: spacing.sm }}>
            <AppText variant="subtitle">✨ Ready to go?</AppText>
            <Button label={`Plan a trip to ${a.trim()}`} icon="map" variant="secondary" onPress={() => router.push({ pathname: '/ai/planner', params: { destination: a.trim() } })} fullWidth />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
