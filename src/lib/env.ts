import Constants from 'expo-constants';

type Extra = {
  rapidApiKey?: string;
  rapidApiHost?: string;
  googleMapsApiKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const ENV = {
  rapidApiKey: extra.rapidApiKey ?? '',
  rapidApiHost: extra.rapidApiHost ?? 'travel-advisor.p.rapidapi.com',
  googleMapsApiKey: extra.googleMapsApiKey ?? '',
};

export const hasRapidApi = ENV.rapidApiKey.length > 0;
export const hasGoogleMaps = ENV.googleMapsApiKey.length > 0;
