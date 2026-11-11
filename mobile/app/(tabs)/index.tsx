import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { api } from '../../src/api/client';
import { AladhanData, fetchPrayerTimes, getNextPrayer, pad2, PrayerKey, timeUntilPrayer, to12Hr } from '../../src/api/prayerTimes';
import { FeaturedClassCard } from '../../src/components/home/FeaturedClassCard';
import { HomeBannerCarousel } from '../../src/components/home/HomeBannerCarousel';
import { HomeHeaderPrayer } from '../../src/components/home/HomeHeaderPrayer';
import { HomeQuickActions } from '../../src/components/home/HomeQuickActions';
import { RulingHighlightCard } from '../../src/components/home/RulingHighlightCard';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

export default function HomeScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const isTeacher = Array.isArray(user?.roles) && user.roles.includes('TEACHER');

  // ── App data ─────────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // ── Prayer times from AlAdhan API ─────────────────────────────────────────────
  const [prayerData, setPrayerData] = useState<AladhanData | null>(null);
  const [nextPrayer, setNextPrayer] = useState<PrayerKey>('Fajr');
  const [countdown, setCountdown] = useState('--:--:--');
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load prayer times ─────────────────────────────────────────────────────────
  const loadPrayerTimes = useCallback(async () => {
    const data = await fetchPrayerTimes();
    if (data) {
      setPrayerData(data);
      const next = getNextPrayer(data.timings);
      setNextPrayer(next ?? 'Fajr');
    }
  }, []);

  // ── Countdown ticker ──────────────────────────────────────────────────────────
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

  // ── Load app data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadPrayerTimes();
    loadHomeData();
  }, [loadPrayerTimes]);

  async function loadHomeData() {
    try {
      const [classesRes, questionsRes] = await Promise.all([
        api.listClasses().catch(() => []),
        api.listQuestions().catch(() => []),
      ]);
      setClasses(Array.isArray(classesRes) ? classesRes : []);
      setQuestions(Array.isArray(questionsRes) ? questionsRes : []);
    } catch {
      setClasses([]);
      setQuestions([]);
    } finally {
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadPrayerTimes(), loadHomeData()]);
    setRefreshing(false);
  }

  // ── Derived display values ────────────────────────────────────────────────────
  const hijriLabel = prayerData
    ? `${prayerData.date.hijri.day} ${prayerData.date.hijri.month.en} ${prayerData.date.hijri.year} AH`
    : null;

  const nextPrayerTime = prayerData
    ? to12Hr(prayerData.timings[nextPrayer as keyof typeof prayerData.timings])
    : '--:-- --';

  return (
    <View className={`flex-1 ${isDark ? 'bg-amoled-bg' : 'bg-slate-50'}`}>
      {/* 1. Sticky Header with Prayer Times Countdown */}
      <HomeHeaderPrayer
        isTeacher={isTeacher}
        userName={user?.full_name}
        isDark={isDark}
        nextPrayer={nextPrayer}
        countdown={countdown}
        nextPrayerTime={nextPrayerTime}
      />

      {/* 2. Scrollable Body */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1993FA" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Promo Carousel */}
        <HomeBannerCarousel isDark={isDark} hijriLabel={hijriLabel} />

        {/* Tagline */}
        <View className="px-6 mt-7">
          <Text className={`text-lg font-bold leading-snug ${isDark ? 'text-white' : 'text-charcoal'}`}>
            {isTeacher ? 'Empower Ghanaian Muslims\nwith authentic Ilm.' : 'Islamic learning for\nMuslims in Ghana.'}
          </Text>
          <Text className={`text-sm mt-1.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-sage'}`}>
            {isTeacher
              ? 'Manage your Madrassa group circles, respond to 1-on-1 guidance inquiries, and answer verified Fatwa.'
              : 'Live Madrassa classes, 1-on-1 Sheikh sessions, and verified Fatwa — all in one place.'}
          </Text>
        </View>

        {/* Quick Actions */}
        <HomeQuickActions isTeacher={isTeacher} isDark={isDark} />

        {/* Featured Madrassa Class */}
        <FeaturedClassCard classes={classes} isDark={isDark} />

        {/* Scholar Q&A Ruling Highlight */}
        <RulingHighlightCard questions={questions} isDark={isDark} />
      </ScrollView>
    </View>
  );
}
