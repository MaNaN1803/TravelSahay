import { unsplash } from './images';

export type Destination = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  imageId: string;
  blurb: string;
};

export const DESTINATIONS: Destination[] = [
  { id: 'paris', name: 'Paris', country: 'France', countryCode: 'FR', latitude: 48.8566, longitude: 2.3522, imageId: '1502602898657-3e91760cbb34', blurb: 'City of light & cafés' },
  { id: 'dubai', name: 'Dubai', country: 'UAE', countryCode: 'AE', latitude: 25.2048, longitude: 55.2708, imageId: '1512453979798-5ea266f8880c', blurb: 'Skylines & luxury' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', countryCode: 'JP', latitude: 35.6762, longitude: 139.6503, imageId: '1540959733332-eab4deabeeaf', blurb: 'Neon & tradition' },
  { id: 'goa', name: 'Goa', country: 'India', countryCode: 'IN', latitude: 15.2993, longitude: 74.124, imageId: '1512343879784-a960bf40e7f2', blurb: 'Beaches & nightlife' },
  { id: 'newyork', name: 'New York', country: 'USA', countryCode: 'US', latitude: 40.7128, longitude: -74.006, imageId: '1496442226666-8d4d0e62e6e9', blurb: 'The city that never sleeps' },
  { id: 'london', name: 'London', country: 'UK', countryCode: 'GB', latitude: 51.5074, longitude: -0.1278, imageId: '1513635269975-59663e0ac1ad', blurb: 'History & culture' },
  { id: 'bali', name: 'Bali', country: 'Indonesia', countryCode: 'ID', latitude: -8.4095, longitude: 115.1889, imageId: '1537953773345-d172ccf13cf1', blurb: 'Island paradise' },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', countryCode: 'SG', latitude: 1.3521, longitude: 103.8198, imageId: '1525625293386-3f8f99389edd', blurb: 'Garden city' },
  { id: 'rome', name: 'Rome', country: 'Italy', countryCode: 'IT', latitude: 41.9028, longitude: 12.4964, imageId: '1552832230-c0197dd311b5', blurb: 'Ancient wonders' },
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', countryCode: 'TH', latitude: 13.7563, longitude: 100.5018, imageId: '1508009603885-50cf7c579365', blurb: 'Temples & street food' },
];

export function destinationImage(d: Destination, width = 600): string {
  return unsplash(d.imageId, width);
}
