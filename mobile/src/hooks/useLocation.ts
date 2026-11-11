import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export interface Coords {
  latitude: number;
  longitude: number;
}

interface LocationState {
  coords: Coords | null;
  city: string | null;
  permissionDenied: boolean;
  loading: boolean;
  error: string | null;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    coords: null,
    city: null,
    permissionDenied: false,
    loading: true,
    error: null,
  });

  const requestLocation = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setState({ coords: null, city: null, permissionDenied: true, loading: false, error: null });
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: Coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Reverse-geocode for display city label
      const geocode = await Location.reverseGeocodeAsync(coords).catch(() => null);
      const place = geocode?.[0];
      const city = place?.city || place?.district || place?.region || null;

      setState({ coords, city, permissionDenied: false, loading: false, error: null });
    } catch (err: any) {
      setState({
        coords: null,
        city: null,
        permissionDenied: true,
        loading: false,
        error: err?.message || 'Could not get location.',
      });
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  function setManualCoords(coords: Coords, city?: string) {
    setState({ coords, city: city || null, permissionDenied: false, loading: false, error: null });
  }

  return { ...state, requestLocation, setManualCoords };
}

