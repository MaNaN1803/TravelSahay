// Client for community/social/collab/market/engage backend routes.
import { API_BASE } from './backend';

async function req<T>(path: string, token: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method: opts.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any)?.error ?? `Request failed (${res.status})`);
  return json as T;
}

/* Types (loose — backend is source of truth) */
export type SharedTrip = {
  _id: string; title: string; destination: string; days: number; inviteCode: string;
  members: { user: string; name: string; role: string }[];
  candidates: { _id: string; kind: string; title: string; note?: string; addedBy?: string; votes: string[] }[];
  expenses: { _id: string; label: string; category: string; amount: number; currency: string; paidBy: string; splitWith: string[] }[];
};
export type Settlement = { totalSpent: number; balances: Record<string, number>; transfers: { from: string; to: string; amount: number }[] };
export type Channel = {
  _id: string; name: string; destination: string; description: string; visibility: string; inviteCode?: string;
  members: { user: string; name: string }[];
  messages: { _id: string; author: string; text: string; flagged?: boolean; createdAt: string }[];
  polls: { _id: string; question: string; options: { _id: string; text: string; votes: string[] }[]; createdBy?: string }[];
};
export type Post = {
  _id: string; author: string; authorId: string; kind: string; text: string; image?: string; place?: string; rating?: number;
  likes: string[]; comments: { author: string; text: string }[]; createdAt: string;
};
export type Match = { userId: string; name: string; destination?: string; travelStyle?: string; interests?: string[]; ageGroup?: string; bio?: string; compatibility: number };
export type PoolGroup = { key: string; destination: string; budgetTier: string; size: number; members: { userId: string; name: string }[]; perks: string[]; youIncluded: boolean };
export type OpenTripRequest = { id: string; user: string; name: string; message: string; compatibility: number; status: 'pending' | 'accepted' | 'rejected'; createdAt: string };
export type OpenTrip = {
  _id: string; owner: string; ownerName: string; title: string; destination: string;
  startDate?: string; endDate?: string; days: number; budget: number; travelStyle?: string;
  interests?: string[]; notes?: string; maxBuddies: number; status: 'open' | 'closed';
  buddies: { user: string; name: string }[]; requests?: OpenTripRequest[]; sharedTrip?: string;
  spotsLeft?: number; compatibility?: number; myRequestStatus?: string | null; joined?: boolean; isOwner?: boolean;
};
export type Listing = { _id: string; sellerName: string; kind: string; title: string; destination: string; description: string; price: number; currency: string; verified: boolean; rating: number; ratingCount: number; itinerary?: any };
export type Plan = { id: string; name: string; price: number; currency: string; perks: string[] };
export type Gamification = { xp: number; level: number; explorerScore: number; badges: { id: string; label: string; icon: string }[]; nextLevelXp: number; toNext: number };

export const community = {
  /* collab */
  createShared: (b: object, t: string) => req<{ trip: SharedTrip }>('/collab', t, { method: 'POST', body: b }),
  listShared: (t: string) => req<{ trips: SharedTrip[] }>('/collab', t),
  joinShared: (inviteCode: string, t: string) => req<{ trip: SharedTrip }>('/collab/join', t, { method: 'POST', body: { inviteCode } }),
  getShared: (id: string, t: string) => req<{ trip: SharedTrip }>(`/collab/${id}`, t),
  addCandidate: (id: string, b: object, t: string) => req<{ trip: SharedTrip }>(`/collab/${id}/candidate`, t, { method: 'POST', body: b }),
  vote: (id: string, candidateId: string, t: string) => req<{ trip: SharedTrip }>(`/collab/${id}/vote`, t, { method: 'POST', body: { candidateId } }),
  addExpense: (id: string, b: object, t: string) => req<{ trip: SharedTrip }>(`/collab/${id}/expense`, t, { method: 'POST', body: b }),
  settlement: (id: string, t: string) => req<{ settlement: Settlement }>(`/collab/${id}/settlement`, t),
  decision: (id: string, b: object, t: string) => req<{ decision: any }>(`/collab/${id}/decision`, t, { method: 'POST', body: b }),

  /* channels */
  createChannel: (b: object, t: string) => req<{ channel: Channel }>('/channels', t, { method: 'POST', body: b }),
  listChannels: (t: string) => req<{ channels: Channel[] }>('/channels', t),
  joinChannel: (b: object, t: string) => req<{ channel: Channel }>('/channels/join', t, { method: 'POST', body: b }),
  getChannel: (id: string, t: string) => req<{ channel: Channel }>(`/channels/${id}`, t),
  sendMessage: (id: string, text: string, t: string) => req<{ message: any }>(`/channels/${id}/message`, t, { method: 'POST', body: { text } }),
  createPoll: (id: string, b: object, t: string) => req<{ channel: Channel }>(`/channels/${id}/poll`, t, { method: 'POST', body: b }),
  votePoll: (id: string, pollId: string, optionId: string, t: string) => req<{ channel: Channel }>(`/channels/${id}/poll/${pollId}/vote`, t, { method: 'POST', body: { optionId } }),

  /* social */
  createPost: (b: object, t: string) => req<{ post: Post }>('/social/posts', t, { method: 'POST', body: b }),
  feed: (t: string, following = false) => req<{ posts: Post[] }>(`/social/feed${following ? '?following=1' : ''}`, t),
  likePost: (id: string, t: string) => req<{ post: Post }>(`/social/posts/${id}/like`, t, { method: 'POST' }),
  commentPost: (id: string, text: string, t: string) => req<{ post: Post }>(`/social/posts/${id}/comment`, t, { method: 'POST', body: { text } }),
  follow: (userId: string, t: string) => req<{ following: boolean }>('/social/follow', t, { method: 'POST', body: { userId } }),

  /* match */
  getMatchProfile: (t: string) => req<{ profile: any }>('/match/profile', t),
  saveMatchProfile: (b: object, t: string) => req<{ profile: any }>('/match/profile', t, { method: 'PUT', body: b }),
  findMatches: (t: string, dating = false) => req<{ matches: Match[] }>(`/match/find${dating ? '?dating=1' : ''}`, t),
  nearby: (t: string) => req<{ nearby: any[] }>('/match/nearby', t),
  pooling: (destination: string, t: string) => req<{ destination: string; groups: PoolGroup[] }>(`/match/pooling?destination=${encodeURIComponent(destination)}`, t),

  /* travel buddies — open trips */
  publishOpenTrip: (b: object, t: string) => req<{ trip: OpenTrip }>('/match/open-trips', t, { method: 'POST', body: b }),
  browseOpenTrips: (t: string, destination = '') => req<{ trips: OpenTrip[] }>(`/match/open-trips${destination ? `?destination=${encodeURIComponent(destination)}` : ''}`, t),
  myOpenTrips: (t: string) => req<{ trips: OpenTrip[] }>('/match/open-trips/mine', t),
  getOpenTrip: (id: string, t: string) => req<{ trip: OpenTrip }>(`/match/open-trips/${id}`, t),
  requestOpenTrip: (id: string, message: string, t: string) => req<{ ok: boolean }>(`/match/open-trips/${id}/request`, t, { method: 'POST', body: { message } }),
  acceptBuddy: (id: string, reqId: string, t: string) => req<{ trip: OpenTrip }>(`/match/open-trips/${id}/request/${reqId}/accept`, t, { method: 'POST' }),
  rejectBuddy: (id: string, reqId: string, t: string) => req<{ ok: boolean }>(`/match/open-trips/${id}/request/${reqId}/reject`, t, { method: 'POST' }),
  toggleOpenTrip: (id: string, t: string) => req<{ status: string }>(`/match/open-trips/${id}/close`, t, { method: 'POST' }),

  /* market */
  plans: (t: string) => req<{ plans: Plan[] }>('/market/plans', t),
  affiliates: (destination: string, t: string) => req<{ affiliates: { label: string; url: string; type: string }[] }>(`/market/affiliates?destination=${encodeURIComponent(destination)}`, t),
  createListing: (b: object, t: string) => req<{ listing: Listing }>('/market/listings', t, { method: 'POST', body: b }),
  listings: (t: string, kind?: string) => req<{ listings: Listing[] }>(`/market/listings${kind ? `?kind=${kind}` : ''}`, t),
  buyListing: (id: string, t: string) => req<{ listing: Listing; itinerary: any }>(`/market/listings/${id}/buy`, t, { method: 'POST' }),

  /* engage */
  gamification: (b: object, t: string) => req<{ gamification: Gamification }>('/engage/gamification', t, { method: 'POST', body: b }),
  challenges: (b: object, t: string) => req<{ challenges: { title: string; goal: string; reward?: string; difficulty?: string }[] }>('/engage/challenges', t, { method: 'POST', body: b }),
  fraudCheck: (subject: string, t: string) => req<{ verdict: string }>('/engage/fraud-check', t, { method: 'POST', body: { subject } }),
  referral: (t: string) => req<{ referral: { code: string; shareText: string; reward: string } }>('/engage/referral', t),
  metrics: (t: string) => req<{ metrics: Record<string, number> }>('/engage/metrics', t),
};
