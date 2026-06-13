# TravelSahay

A complete AI-powered travel companion app built on Expo SDK 56, React Native
0.85, React 19 and TypeScript with file-based routing. Plan trips with AI,
explore real places, track a travel diary, and connect with other travellers to
combine plans through the Travel Buddies pairing system.

Backend API: https://travelsahay-api.onrender.com (source in the `travelsahay-api` repo).

## Features

### Explore and plan
- Search any city (Google Places); browse live Tripadvisor hotels, attractions
  and restaurants as image cards with filters, sort, and an interactive map.
- Place details: gallery, ratings, call / directions / website, add to a trip.
- Trips: build day-by-day itineraries, move and remove stops, share a trip.

### AI suite (Gemini, via the backend)
- AI Trip Planner: day-by-day, hour-wise itineraries tailored to budget and style.
- Smart Budget: luxury / moderate / budget breakdowns.
- Packing Assistant: weather-aware checklists.
- AI Concierge: streaming chat assistant.
- AI Memories: turn a finished trip into a diary, highlights and captions.
- Travel Assistant: safety, visa, emergency, predictions, events, copilot.
- Travel Twin: a persona the AI learns from your trips and diary.
- Specialized Planners: family, couple, corporate, pilgrimage and more.

### Social and community
- Travel Feed: posts, reviews and stories with likes, comments and follow.
- Channels: destination groups with chat and polls.
- Group Wallet: shared trips with expenses and smart settlements.
- Find Travellers: compatibility matching and a nearby network.
- Travel Pooling: cluster with travellers and split costs.
- Rewards: levels, badges, challenges and referrals.

### Travel Buddies (matching and pairing)
- Publish an open trip (destination, dates, budget, style, interests).
- Browse others' open trips ranked by compatibility.
- Run AI compatibility analysis: shared strengths, friction, icebreakers,
  combined-plan ideas and cost savings.
- Request to join; the owner accepts or declines.
- On accept, both become buddies and a shared collaborative trip (group wallet
  and voting) is created automatically so plans merge into one.

### Account
- Edit profile: username, password, and a full travel persona that feeds matching
  and Travel Buddies.
- Gamification stats on the profile; cross-links to AI and social.
- System / Light / Dark themes; first-launch onboarding.

## Cross-feature navigation

Screens guide the user to the next logical step instead of dead-ending. Planner,
Budget, Packing, Assist, Trip detail and Travel Twin all deep-link into each
other (and into Travel Buddies) carrying the destination forward.

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Expo SDK 56, React Native 0.85, React 19 |
| Language | TypeScript (strict) |
| Navigation | Expo Router (file-based, bottom tabs + stacks) |
| State | React context providers (Auth, Trips, Diary, Favorites, Theme, and more) |
| Data | TravelSahay API; Tripadvisor via RapidAPI; Google Places |
| Maps | `react-native-maps` (Google on Android, Apple on iOS) |
| Storage | `@react-native-async-storage/async-storage` |
| Builds | EAS Build (APK / app bundle) |

## Project structure

```
src/
  app/                      # Expo Router routes
    _layout.tsx             # providers + onboarding/auth gate
    (tabs)/                 # Home, Explore, Map, Trips, AI, Diary, Profile
    ai/                     # planner, budget, packing, chat, memories, assist, twin, planners
    social/                 # feed, channels, pooling, matching, buddies, wallet, marketplace, rewards
    trips/[id].tsx          # trip detail
    profile/edit.tsx        # edit username, password, travel persona
    diary/                  # diary list and editor
    place/[type]/[id].tsx   # place details
  api/                      # backend, ai, community, search, travelAdvisor clients
  components/               # PlaceCard, AddToTripModal, SearchModal, ui/ kit
  state/                    # context providers
  theme/                    # design tokens + provider
```

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` (gitignored). It is injected through `app.config.js`:
   ```
   EXPO_PUBLIC_API_URL=https://travelsahay-api.onrender.com
   RAPIDAPI_KEY=...
   RAPIDAPI_HOST=travel-advisor.p.rapidapi.com
   GOOGLE_MAPS_API_KEY=...
   ```
   For local backend development use `EXPO_PUBLIC_API_URL=http://localhost:4000`.
3. Run:
   ```bash
   npm run android      # or: npm run ios / npm run web
   npm run typecheck    # tsc --noEmit
   ```
   Maps and location need a Dev Client or native build, not Expo Go on SDK 56
   (`npx expo run:android` / `npx expo run:ios`).

## Build an APK with EAS

```bash
npx eas login
npx eas build --platform android --profile preview
```

The `preview` profile in `eas.json` produces an installable APK. Set the
`EXPO_PUBLIC_API_URL` value for the `preview` environment on EAS so the build
points at the live API:

```bash
npx eas env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://travelsahay-api.onrender.com
```

The build runs in the cloud; the APK download link appears on the build page when
it finishes.

## Notes

- Secrets live in `.env` (gitignored) and reach the build through `app.config.js`
  and `expo-constants`. EAS builds read environment variables stored on the EAS
  server per environment, not the local `.env`.
- Restrict the Google Maps key (bundle IDs and API allowlist) before shipping.
