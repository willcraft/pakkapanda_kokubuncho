// Android(Google Maps)用のダークスタイル。iOSはOSのダークモードに任せる。
export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#151a23' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b93a5' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b0e14' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#232b3a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1420' }] },
];
