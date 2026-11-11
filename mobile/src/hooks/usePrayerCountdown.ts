import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AladhanData,
  fetchPrayerTimes,
  getNextPrayer,
  pad2,
  PrayerKey,
  timeUntilPrayer,
  to12Hr,
} from '../api/prayerTimes';

export function usePrayerCountdown() {
  const [prayerData, setPrayerData] = useState<AladhanData | null>(null);
  const [nextPrayer, setNextPrayer] = useState<PrayerKey>('Fajr');
  const [countdown, setCountdown] = useState('--:--:--');
  const [refreshing, setRefreshing] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadPrayerTimes = useCallback(async () => {
    const data = await fetchPrayerTimes();
    if (data) {
      setPrayerData(data);
      const next = getNextPrayer(data.timings);
      setNextPrayer(next ?? 'Fajr');
    }
  }, []);

  useEffect(() => {
    loadPrayerTimes();
  }, [loadPrayerTimes]);

  useEffect(() => {
    if (!prayerData) return;
    const tick = () => {
      const next = getNextPrayer(prayerData.timings);
      const key = next ?? 'Fajr';
      setNextPrayer(key);
      const rawTime = prayerData.timings[key as keyof typeof prayerData.timings];
      const { h, m, s } = timeUntilPrayer(rawTime);
      setCountdown(`${pad2(h)}:${pad2(m)}:${pad2(s)}`);
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [prayerData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPrayerTimes();
    setRefreshing(false);
  }, [loadPrayerTimes]);

  const hijriLabel = prayerData
    ? `${prayerData.date.hijri.day} ${prayerData.date.hijri.month.en} ${prayerData.date.hijri.year} AH`
    : null;

  const nextPrayerTime = prayerData
    ? to12Hr(prayerData.timings[nextPrayer as keyof typeof prayerData.timings])
    : '--:-- --';

  return {
    prayerData,
    nextPrayer,
    countdown,
    nextPrayerTime,
    hijriLabel,
    refreshing,
    loadPrayerTimes,
    onRefresh,
  };
}
