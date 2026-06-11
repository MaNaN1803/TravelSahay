// Dynamic Expo config. Reads secrets from .env (auto-loaded by Expo CLI) and
// injects them into the native build + `expo-constants` extra for runtime use.
// Keys never live in committed source — see .env.example.

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? '';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY ?? '';
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST ?? 'travel-advisor.p.rapidapi.com';

module.exports = ({ config }) => ({
  ...config,
  name: 'TravelSahay',
  slug: 'travelreactapp',
  version: '2.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'travelsahay',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0B1B3A',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.travelsahay.app',
    config: {
      googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'TravelSahay uses your location to show nearby hotels, attractions and restaurants on the map.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.travelsahay.app',
    adaptiveIcon: {
      backgroundColor: '#0B1B3A',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    config: {
      googleMaps: {
        apiKey: GOOGLE_MAPS_API_KEY,
      },
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0B1B3A',
        image: './assets/images/splash-icon.png',
        imageWidth: 120,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'TravelSahay uses your location to show nearby places on the map.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'TravelSahay needs access to your photos to add them to your travel diary.',
        cameraPermission: 'TravelSahay needs camera access to capture photos for your travel diary.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    rapidApiKey: RAPIDAPI_KEY,
    rapidApiHost: RAPIDAPI_HOST,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    eas: {
      projectId: '6cf9c35c-3dd8-4d6a-947b-e2e3813cd971',
    },
  },
});
