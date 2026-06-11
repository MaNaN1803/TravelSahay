# TravelSahay 2.0 🌍✈️

A complete, modern travel companion app — rebuilt from the ground up on **Expo SDK 56 / React Native 0.85 / React 19** with TypeScript and file-based routing. Search any city and explore real **Tripadvisor** hotels, attractions and restaurants on a polished UI that runs natively on **iOS and Android** (and degrades gracefully on web).

## Features

- **Explore** — search any city (Google Places), switch between Hotels / Attractions / Restaurants, see live results as image cards.
- **Filters & Sort** — minimum rating, price level, open-now, and sort by rating / reviews / name.
- **Interactive Map** — results as rating markers on a native map, tap for a preview card, jump to your location. (List fallback on web.)
- **Place Details** — hero gallery, rating / price / ranking stats, description, cuisine chips, tap-to-call / directions / website, and a context-aware booking CTA.
- **Favorites** — save places locally (AsyncStorage), filter by category, persists across launches.
- **Dark mode** — System / Light / Dark, remembered between sessions.
- **Onboarding** — first-launch carousel, shown once.

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Expo SDK 56, React Native 0.85, React 19 |
| Language | TypeScript (strict) |
| Navigation | Expo Router (file-based, bottom tabs + stacks) |
| Data | Tripadvisor via RapidAPI (`travel-advisor`) |
| Search | Google Places Autocomplete (Travel Advisor fallback) |
| Maps | `react-native-maps` (Google on Android, Apple on iOS) |
| Styling | StyleSheet design-token system with full theming |
| Storage | `@react-native-async-storage/async-storage` |

## Project structure

```
src/
  app/                      # Expo Router routes
    _layout.tsx             # providers + onboarding gate
    onboarding.tsx
    (tabs)/                 # Explore · Map · Favorites · Profile
    place/[type]/[id].tsx   # place details
  api/                      # travelAdvisor, search, axios client
  components/               # PlaceCard, CategoryTabs, SearchModal, FilterSheet, PlacesMap, ui/
  state/                    # ThemeProvider, FavoritesProvider, PlacesProvider
  lib/                      # env, storage, place helpers, nav, placeCache
  theme/                    # design tokens + provider
  types/                    # Place / domain types
```

## Getting started

1. Install deps:
   ```bash
   npm install
   ```
2. Copy env and add your keys (see `.env.example`):
   ```bash
   cp .env.example .env
   ```
   - `RAPIDAPI_KEY` — subscribe to **Travel Advisor** on RapidAPI.
   - `GOOGLE_MAPS_API_KEY` — enable **Places API** + **Maps SDK (Android/iOS)** in Google Cloud.
3. Run:
   ```bash
   npm run ios       # or: npm run android / npm run web
   ```
   > Maps and location require a Dev Client or native build (not Expo Go on SDK 56). `npx expo run:ios` / `npx expo run:android`.

## Notes

- Secrets live in `.env` (gitignored) and are injected via `app.config.js` → `expo-constants`. Nothing is hardcoded in source.
- **Restrict your Google key** (bundle IDs + API allowlist) before shipping.
