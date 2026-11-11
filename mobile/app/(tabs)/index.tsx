import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { ClassesService, QuestionsService } from '../../src/services';
import { FeaturedClassCard } from '../../src/components/home/FeaturedClassCard';
import { HomeBannerCarousel } from '../../src/components/home/HomeBannerCarousel';
import { HomeHeaderPrayer } from '../../src/components/home/HomeHeaderPrayer';
import { HomeQuickActions } from '../../src/components/home/HomeQuickActions';
import { RulingHighlightCard } from '../../src/components/home/RulingHighlightCard';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { usePrayerCountdown } from '../../src/hooks/usePrayerCountdown';

export default function HomeScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const isTeacher = Array.isArray(user?.roles) && user.roles.includes('TEACHER');

  // ── App data ─────────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // ── Prayer times via custom hook ─────────────────────────────────────────────
  const { nextPrayer, countdown, nextPrayerTime, hijriLabel, onRefresh: refreshPrayer } =
    usePrayerCountdown();

  useEffect(() => {
    loadHomeData();
  }, []);

  async function loadHomeData() {
    try {
      const [classesRes, questionsRes] = await Promise.all([
        ClassesService.listClasses().catch(() => []),
        QuestionsService.listQuestions().catch(() => []),
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
    await Promise.all([refreshPrayer(), loadHomeData()]);
    setRefreshing(false);
  }

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
