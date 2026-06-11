// Minimal dark style for Google Maps (Android). Apple Maps follows the system
// appearance automatically, so this is mainly applied on Android in dark mode.
export const mapDarkStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0f1b2d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1120' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#243049' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1322' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];
