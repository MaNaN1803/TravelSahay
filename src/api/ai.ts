// Client for the TravelSahay AI backend (/api/ai/*). The Gemini key lives only on
// the server — the app never sees it. Mirrors the style of api/backend.ts.
import { API_BASE } from './backend';

async function aiReq<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api/ai${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any)?.error ?? `AI request failed (${res.status})`);
  return json as T;
}

/* ---------- Types ---------- */

export type PlanActivity = {
  time: string;
  title: string;
  description?: string;
  category?: string;
  estimatedCost?: number;
  durationMins?: number;
  location?: string;
};
export type PlanDay = { day: number; title?: string; summary?: string; activities: PlanActivity[] };
export type BudgetBreakdown = {
  flights?: number; hotels?: number; food?: number; activities?: number;
  transport?: number; shopping?: number; emergency?: number; total?: number;
};
export type TripPlan = {
  destination: string;
  currency: string;
  overview: string;
  days: PlanDay[];
  hiddenGems?: string[];
  foodRecommendations?: string[];
  localEvents?: string[];
  travelWarnings?: string[];
  weatherInsight?: string;
  transportSuggestions?: string[];
  budgetBreakdown?: BudgetBreakdown;
};

export type PlanInput = {
  destination: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  budget?: number;
  currency?: string;
  travelers?: number;
  style?: string;
  preferences?: string[];
  transport?: string;
  food?: string;
  safety?: string;
  language?: string;
  accessibility?: string;
  visa?: string;
};

export type BudgetVariant = {
  tier: string;
  summary?: string;
  perPersonPerDay?: number;
  breakdown: BudgetBreakdown;
};
export type BudgetResult = {
  destination: string;
  currency: string;
  variants: BudgetVariant[];
  forecastNote?: string;
  emergencyReserveSuggestion?: number;
  moneyTips?: string[];
};

export type PackingItem = { name: string; qty?: number; essential?: boolean };
export type PackingCategory = { category: string; items: PackingItem[] };
export type PackingResult = {
  destination: string;
  weatherNote?: string;
  categories: PackingCategory[];
  reminders?: string[];
};

export type MemoryResult = {
  title: string;
  summary: string;
  highlights: string[];
  diary: string;
  photoCaptions?: string[];
  expenseReport?: { total?: number; note?: string };
  socialCaption?: string;
};

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export type BuddyAnalysis = {
  compatibility: number;
  verdict: string;
  sharedStrengths: string[];
  potentialFriction?: string[];
  icebreakers?: string[];
  combinedPlanIdeas?: string[];
  splitSavings?: string;
};

export type VisaResult = {
  fromCountry?: string; toCountry: string; visaRequired: boolean; visaType?: string;
  documentChecklist: string[]; processingTime?: string; estimatedCost?: string;
  formGuidance?: string[]; renewalNotes?: string; disclaimer?: string;
};
export type EmergencyResult = {
  situation: string; immediateSteps: string[];
  contacts: { label: string; number?: string; note?: string }[];
  documentsNeeded?: string[]; phrasesToSay?: string[]; disclaimer?: string;
};
export type SafetyResult = {
  destination: string; overallRisk: string; safetyScore?: number;
  alerts: { type: string; severity?: string; message: string }[];
  unsafeAreas?: string[]; healthRisks?: string[]; tips?: string[];
};
export type PredictResult = {
  predictions: { risk: string; likelihood: string; detail: string; mitigation?: string }[];
  summary?: string;
};
export type EventsResult = {
  destination: string;
  events: { name: string; category: string; when?: string; where?: string; description?: string }[];
};
export type TravelProfile = {
  homeCity?: string; budgetStyle?: string; pace?: string; interests?: string[];
  foodPreferences?: string[]; transportPreference?: string; preferredTripLength?: number;
  accessibility?: string; languages?: string[]; avoid?: string[]; aiSummary?: string;
};

/* ---------- Calls ---------- */

export const ai = {
  health: (token: string) =>
    aiReq<{ ok: boolean; configured: boolean }>('/health', {}, token).catch(() => ({ ok: false, configured: false })),

  plan: (input: PlanInput, token: string) => aiReq<{ plan: TripPlan }>('/plan', input, token),

  buddy: (input: { me: Record<string, unknown>; trip: Record<string, unknown>; owner?: Record<string, unknown> }, token: string) =>
    aiReq<{ analysis: BuddyAnalysis }>('/buddy', input, token),

  specializedPlan: (vertical: string, input: Record<string, unknown>, token: string) =>
    aiReq<{ plan: TripPlan; vertical: string }>(`/planners/${vertical}`, input, token),

  budget: (input: Record<string, unknown>, token: string) =>
    aiReq<{ budget: BudgetResult }>('/budget', input, token),

  packing: (input: Record<string, unknown>, token: string) =>
    aiReq<{ packing: PackingResult }>('/packing', input, token),

  memories: (input: Record<string, unknown>, token: string) =>
    aiReq<{ memory: MemoryResult }>('/memories', input, token),

  chatOnce: (messages: ChatMessage[], token: string, context?: string) =>
    aiReq<{ reply: string }>('/chat', { messages, context, stream: false }, token),

  visa: (input: Record<string, unknown>, token: string) =>
    aiReq<{ visa: VisaResult }>('/assist/visa', input, token),
  emergency: (input: Record<string, unknown>, token: string) =>
    aiReq<{ emergency: EmergencyResult }>('/assist/emergency', input, token),
  safety: (input: Record<string, unknown>, token: string) =>
    aiReq<{ safety: SafetyResult }>('/assist/safety', input, token),
  predictive: (input: Record<string, unknown>, token: string) =>
    aiReq<{ prediction: PredictResult }>('/assist/predictive', input, token),
  events: (input: Record<string, unknown>, token: string) =>
    aiReq<{ events: EventsResult }>('/assist/events', input, token),
  copilot: (input: Record<string, unknown>, token: string) =>
    aiReq<{ answer: string }>('/assist/copilot', input, token),

  getProfile: (token: string) =>
    fetch(`${API_BASE}/api/ai/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => j.profile as TravelProfile),
  saveProfile: (input: Partial<TravelProfile>, token: string) =>
    fetch(`${API_BASE}/api/ai/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    }).then((r) => r.json()).then((j) => j.profile as TravelProfile),
  deriveProfile: (input: Record<string, unknown>, token: string) =>
    aiReq<{ profile: TravelProfile; suggestedNextTrips: string[] }>('/profile/derive', input, token),
};

/* ---------- Streaming chat (RN-friendly via XHR onprogress) ---------- */

export type StreamHandlers = {
  onDelta: (text: string) => void;
  onDone?: () => void;
  onError?: (err: string) => void;
};

// Streams the concierge reply. Returns a cancel() function.
export function streamChat(
  messages: ChatMessage[],
  token: string,
  handlers: StreamHandlers,
  context?: string,
): () => void {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${API_BASE}/api/ai/chat`);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);

  let seen = 0;
  const flush = (raw: string) => {
    // Parse complete SSE "data: ...\n\n" frames.
    const frames = raw.split('\n\n');
    for (const frame of frames) {
      const line = frame.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') {
        handlers.onDone?.();
        continue;
      }
      try {
        const obj = JSON.parse(payload);
        if (obj.delta) handlers.onDelta(obj.delta);
        else if (obj.error) handlers.onError?.(obj.error);
      } catch {
        // partial frame; ignored until complete
      }
    }
  };

  xhr.onprogress = () => {
    const text = xhr.responseText;
    // Only parse the newly arrived, fully-terminated portion.
    const lastBreak = text.lastIndexOf('\n\n');
    if (lastBreak <= seen) return;
    const chunk = text.slice(seen, lastBreak + 2);
    seen = lastBreak + 2;
    flush(chunk);
  };
  xhr.onload = () => {
    if (xhr.responseText.length > seen) flush(xhr.responseText.slice(seen));
    handlers.onDone?.();
  };
  xhr.onerror = () => handlers.onError?.('Network error');
  xhr.send(JSON.stringify({ messages, context, stream: true }));

  return () => xhr.abort();
}
