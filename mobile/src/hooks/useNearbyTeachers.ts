import { useCallback, useEffect, useState } from 'react';
import { NearbyTeacher } from '../api/client';
import { Coords } from './useLocation';
import { TeachersService } from '../services/teachers.service';

interface UseNearbyTeachersParams {
  coords: Coords | null;
  radius: number;
  subject?: string;
  format?: string;
}

export function useNearbyTeachers({
  coords,
  radius,
  subject = 'All',
  format = 'All',
}: UseNearbyTeachersParams) {
  const [teachers, setTeachers] = useState<NearbyTeacher[]>([]);
  const [count, setCount] = useState(0);
  const [radiusKm, setRadiusKm] = useState(radius);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(
    async (isRefresh = false) => {
      if (!coords) return;
      if (isRefresh) setRefreshing(true);
      else setIsLoading(true);

      try {
        const params: Parameters<typeof TeachersService.getNearbyTeachers>[0] = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius,
        };
        if (subject !== 'All') params.subject = subject;
        if (format !== 'All') params.teaching_format = format;

        const res = await TeachersService.getNearbyTeachers(params);
        setTeachers(Array.isArray(res.data) ? res.data : []);
        setCount(res.count ?? 0);
        setRadiusKm(res.radius_km ?? radius);
      } catch {
        setTeachers([]);
        setCount(0);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
        setHasSearched(true);
      }
    },
    [coords, radius, subject, format]
  );

  useEffect(() => {
    if (coords) {
      search();
    }
  }, [coords, radius, subject, format, search]);

  return {
    teachers,
    count,
    radiusKm,
    isLoading,
    refreshing,
    hasSearched,
    search,
  };
}
