import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { NearbyTeacher } from '../api/client';

interface NearbyMapViewProps {
  center: { latitude: number; longitude: number };
  radiusKm: number;
  teachers: NearbyTeacher[];
  onSelectTeacher: (teacher: NearbyTeacher) => void;
  isDark: boolean;
}

export function NearbyMapView({
  center,
  radiusKm,
  teachers,
  onSelectTeacher,
  isDark,
}: NearbyMapViewProps) {
  const mapHtml = useMemo(() => {
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const teachersJson = JSON.stringify(
      teachers.map((t) => ({
        id: t.location_id,
        profileId: t.teacher_profile_id,
        name: t.teacher_name,
        lat: t.latitude,
        lng: t.longitude,
        locationName: t.location_name,
        type: t.location_type,
        distance: t.distance_km,
        subject: t.expertise_areas?.[0] || 'Islamic Studies',
      }))
    );

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: ${isDark ? '#0A121D' : '#F8FAFC'}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    
    /* Custom User Pin */
    .user-marker {
      width: 22px;
      height: 22px;
      background: #027BFF;
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(2, 123, 255, 0.7);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(2, 123, 255, 0.6); }
      70% { box-shadow: 0 0 0 16px rgba(2, 123, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(2, 123, 255, 0); }
    }

    /* Teacher Marker Pin */
    .teacher-marker {
      background: #059669;
      color: #FFFFFF;
      border: 2px solid #FFFFFF;
      border-radius: 20px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 3px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transform: translate(-50%, -50%);
    }

    /* Leaflet popup styling */
    .leaflet-popup-content-wrapper {
      background: ${isDark ? '#0E1726' : '#FFFFFF'};
      color: ${isDark ? '#FFFFFF' : '#1E293B'};
      border-radius: 16px;
      padding: 10px 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
      border: 1px solid ${isDark ? '#1E293B' : '#E2E8F0'};
    }
    .leaflet-popup-content { margin: 0; line-height: 1.4; }
    .leaflet-popup-tip { background: ${isDark ? '#0E1726' : '#FFFFFF'}; }
    .popup-title { font-weight: 800; font-size: 13px; margin-bottom: 2px; }
    .popup-sub { font-size: 11px; color: ${isDark ? '#94A3B8' : '#64748B'}; margin-bottom: 6px; }
    .popup-btn {
      display: block;
      background: #027BFF;
      color: #FFFFFF;
      text-align: center;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      text-decoration: none;
      margin-top: 6px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const centerLat = ${center.latitude};
    const centerLng = ${center.longitude};
    const radiusMeters = ${radiusKm * 1000};
    const teachers = ${teachersJson};

    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([centerLat, centerLng], ${radiusKm <= 5 ? 14 : radiusKm <= 10 ? 13 : radiusKm <= 20 ? 12 : 11});

    L.tileLayer('${tileUrl}', { maxZoom: 19 }).addTo(map);

    // Search Radius Circle
    L.circle([centerLat, centerLng], {
      color: '#027BFF',
      fillColor: '#027BFF',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '4, 6',
      radius: radiusMeters
    }).addTo(map);

    // User Location Marker
    const userIcon = L.divIcon({
      className: 'user-marker',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
    L.marker([centerLat, centerLng], { icon: userIcon }).addTo(map)
      .bindPopup('<div class="popup-title">📍 Your Location</div><div class="popup-sub">Search radius: ${radiusKm} km</div>');

    // Teacher Markers
    teachers.forEach(function(t) {
      const icon = L.divIcon({
        className: 'teacher-marker',
        html: '<span>🕌</span> <span>' + t.name.split(' ')[0] + ' (' + t.distance.toFixed(1) + 'km)</span>',
        iconAnchor: [0, 0]
      });

      const marker = L.marker([t.lat, t.lng], { icon: icon }).addTo(map);

      const popupContent = 
        '<div class="popup-title">' + t.name + '</div>' +
        '<div class="popup-sub">' + t.locationName + ' • ' + t.distance.toFixed(1) + ' km away</div>' +
        '<a class="popup-btn" href="javascript:void(0)" onclick="selectTeacher(\\'' + t.id + '\\')">View & Request Lessons</a>';

      marker.bindPopup(popupContent);
    });

    function selectTeacher(id) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_TEACHER', id: id }));
      }
    }
  </script>
</body>
</html>
    `;
  }, [center, radiusKm, teachers, isDark]);

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'SELECT_TEACHER') {
              const teacher = teachers.find((t) => t.location_id === data.id);
              if (teacher) {
                onSelectTeacher(teacher);
              }
            }
          } catch {}
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

