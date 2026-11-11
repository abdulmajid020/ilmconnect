import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, BookOpen, Calendar, CheckCircle2, ChevronRight, HelpCircle, MapPin, Moon, Sun, Sunrise, Sunset, UserCheck, Video } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, ImageBackground, Linking, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../src/api/client';
import { AladhanData, fetchPrayerTimes, getNextPrayer, pad2, PRAYER_META, PrayerKey, timeUntilPrayer, to12Hr } from '../../src/api/prayerTimes';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_CARD_WIDTH = SCREEN_WIDTH - 48; // 24px margin each side

// ─── Streamlined, High-Signal Banners (Clean, decluttered communication) ────────
const BANNERS = [
  {
    id: 'b1',
    image: require('../../assets/images/banner-mosque.jpg'),
    badge: 'Madrassa Classes',
    title: 'Learn Quran & Tajweed',
    subtitle: 'Interactive live circles led by certified Ghanaian Sheikhs',
    route: '/(tabs)/explore' as const,
  },
  {
    id: 'b2',
    image: require('../../assets/images/banner-quran.jpg'),
    badge: 'Private Guidance',
    title: '1-on-1 Scholar Sessions',
    subtitle: 'Confidential spiritual and Islamic life mentorship',
    route: '/(tabs)/explore' as const,
  },
  {
    id: 'b3',
    image: require('../../assets/images/banner-madrassa.jpg'),
    badge: 'Verified Fatwa',
    title: 'Ask a Verified Sheikh',
    subtitle: 'Authentic answers to everyday faith and worship questions',
    route: '/(tabs)/questions' as const,
  },
];

// ─── Prayer times icon & theme metadata ─────────────────────────────────────────
const PRAYER_ICON_MAP: Record<
  PrayerKey,
  { icon: any; iconColor: string; iconBg: string }
> = {
  Fajr:    { icon: Sunrise, iconColor: '#F59E0B', iconBg: '#FEF3C7' },
  Dhuhr:   { icon: Sun,     iconColor: '#EAB308', iconBg: '#FEF9C3' },
  Asr:     { icon: Sun,     iconColor: '#F97316', iconBg: '#FFEDD5' },
  Maghrib: { icon: Sunset,  iconColor: '#E11D48', iconBg: '#FFE4E6' },
  Isha:    { icon: Moon,    iconColor: '#818CF8', iconBg: '#E0E7FF' },
};

export default function HomeScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const isTeacher = Array.isArray(user?.roles) && user.roles.includes('TEACHER');

  // ── App data ─────────────────────────────────────────────────────────────────
  const [classes,   setClasses]   = useState<any[]>([]);
  const [teachers,  setTeachers]  = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Prayer times from AlAdhan API ─────────────────────────────────────────────
  const [prayerData,  setPrayerData]  = useState<AladhanData | null>(null);
  const [prayerError, setPrayerError] = useState(false);
  const [nextPrayer,  setNextPrayer]  = useState<PrayerKey>('Fajr');
  const [countdown,   setCountdown]   = useState('--:--:--');
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Banner swiper state (Generous 6.5s dwell time) ─────────────────────────────
  const [activeBanner, setActiveBanner] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bannerScrollRef = useRef<any>(null);
  const autoAdvanceRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load prayer times ─────────────────────────────────────────────────────────
  const loadPrayerTimes = useCallback(async () => {
    setPrayerError(false);
    const data = await fetchPrayerTimes();
    if (data) {
      setPrayerData(data);
      const next = getNextPrayer(data.timings);
      setNextPrayer(next ?? 'Fajr');
    } else {
      setPrayerError(true);
    }
  }, []);

  // ── Countdown ticker ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!prayerData) return;
    const tick = () => {
      const next = getNextPrayer(prayerData.timings);
      const key  = next ?? 'Fajr';
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

  // ── Calm, Senior-engineered Auto Advance (6.5s interval with gesture pause) ───
  const startAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    autoAdvanceRef.current = setInterval(() => {
      setActiveBanner(prev => {
        const next = (prev + 1) % BANNERS.length;
        bannerScrollRef.current?.scrollTo({ x: next * (BANNER_CARD_WIDTH + 12), animated: true });
        return next;
      });
    }, 6500); // Relaxed pace: 6.5s gives the user ample time to read
  }, []);

  const stopAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoAdvance();
    return () => stopAutoAdvance();
  }, [startAutoAdvance, stopAutoAdvance]);

  // ── Load app data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadPrayerTimes();
    loadHomeData();
  }, []);

  async function loadHomeData() {
    setIsLoading(true);
    try {
      const [classesRes, teachersRes, questionsRes] = await Promise.all([
        api.listClasses().catch(() => []),
        api.searchTeachers().catch(() => []),
        api.listQuestions().catch(() => []),
      ]);
      setClasses(Array.isArray(classesRes) ? classesRes : []);
      setTeachers(Array.isArray(teachersRes) ? teachersRes : []);
      setQuestions(Array.isArray(questionsRes) ? questionsRes : []);
    } catch {
      setClasses([]);
      setTeachers([]);
      setQuestions([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadPrayerTimes(), loadHomeData()]);
    setRefreshing(false);
  }

  function openMeetLink(link: string | null) {
    if (!link) {
      Alert.alert('Notice', 'Google Meet link will be shared by Sheikh before class starts.');
      return;
    }
    Linking.openURL(link).catch(() => {
      Alert.alert('Error', 'Unable to open Google Meet.');
    });
  }

  // ── Derived display values ────────────────────────────────────────────────────
  const hijriLabel = prayerData
    ? `${prayerData.date.hijri.day} ${prayerData.date.hijri.month.en} ${prayerData.date.hijri.year} AH`
    : null;

  const nextPrayerTime = prayerData
    ? to12Hr(prayerData.timings[nextPrayer as keyof typeof prayerData.timings])
    : '--:-- --';

  const nextIconMeta = PRAYER_ICON_MAP[nextPrayer];
  const NextIcon     = nextIconMeta.icon;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View className={`flex-1 ${isDark ? 'bg-amoled-bg' : 'bg-slate-50'}`}>

      {/* ======================================================================= */}
      {/* 1. STICKY HEADER (Fixed outside ScrollView — never scrolls away)        */}
      {/* ======================================================================= */}
      <LinearGradient
        colors={isDark ? ['#0B1B2B', '#071320'] : ['#1993FA', '#6FBAFC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: Math.max(insets.top + 14, 48) }}
      >
        {/* ── Greeting + Location ── */}
        <View className="flex-row justify-between items-center px-6 mb-4">
          <View>
            <Text className="text-white/80 text-xs font-semibold tracking-wider uppercase">
              {isTeacher ? 'Verified Scholar Portal' : 'Assalamu Alaykum'}
            </Text>
            <Text className="text-white text-2xl font-bold tracking-tight mt-0.5">
              {user?.full_name
                ? (isTeacher ? user.full_name : user.full_name.split(' ')[0])
                : (isTeacher ? 'Sheikh' : 'Learner')} 🇬🇭
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5 bg-white/20 px-3.5 py-1.5 rounded-full">
            <MapPin size={13} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold">Accra, Ghana</Text>
          </View>
        </View>

        {/* ── Next Prayer Countdown Block ── */}
        <Animated.View entering={FadeInDown.duration(350)} className="items-center px-6 pb-5">
          <Text className="text-white/85 text-xs font-bold uppercase tracking-widest">
            Next Prayer: {nextPrayer}
          </Text>
          <Text
            style={{ fontFamily: 'SFProDisplay-Bold' }}
            className="text-white text-5xl font-extrabold tracking-tight mt-1.5"
          >
            {countdown}
          </Text>
          <View className="flex-row items-center gap-2 mt-2.5 bg-white/20 px-3.5 py-1.5 rounded-full">
            <NextIcon size={14} color={nextIconMeta.iconColor} />
            <Text style={{ fontFamily: 'SFProDisplay-Bold' }} className="text-white text-xs font-bold">
              {nextPrayer} Begins at {nextPrayerTime}
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* ======================================================================= */}
      {/* 2. SCROLLABLE SCREEN BODY                                               */}
      {/* ======================================================================= */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1993FA" />
        }
        showsVerticalScrollIndicator={false}
      >

        {/* ===================================================================== */}
        {/* PROMO CAROUSEL (Decluttered cards, calm pace, gesture pause)          */}
        {/* ===================================================================== */}
        <Animated.View entering={FadeInUp.delay(60).duration(380)} className="mt-5">
          <View className="flex-row justify-between items-center px-6 mb-3">
            <Text className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-sage'}`}>
              Featured
            </Text>
            {hijriLabel && (
              <Text className={`text-[11px] font-semibold ${isDark ? 'text-slate-500' : 'text-sage/80'}`}>
                {hijriLabel}
              </Text>
            )}
          </View>

          {/* Carousel */}
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={BANNER_CARD_WIDTH + 12}
            snapToAlignment="start"
            contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
            scrollEventThrottle={16}
            onScrollBeginDrag={stopAutoAdvance}
            onScrollEndDrag={startAutoAdvance}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (BANNER_CARD_WIDTH + 12));
              setActiveBanner(Math.min(idx, BANNERS.length - 1));
              startAutoAdvance();
            }}
          >
            {BANNERS.map((banner) => (
              <TouchableOpacity
                key={banner.id}
                activeOpacity={0.92}
                onPress={() => router.push(banner.route)}
                style={{ width: BANNER_CARD_WIDTH }}
              >
                <ImageBackground
                  source={banner.image}
                  style={{
                    width: BANNER_CARD_WIDTH,
                    height: 156,
                    borderRadius: 22,
                    overflow: 'hidden',
                  }}
                  imageStyle={{ borderRadius: 22 }}
                  resizeMode="cover"
                >
                  {/* Subtle dark gradient overlay allowing the photo to breathe */}
                  <LinearGradient
                    colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.80)']}
                    locations={[0.2, 0.95]}
                    style={{ position: 'absolute', inset: 0, borderRadius: 22 }}
                  />

                  {/* Clean, minimalist card content */}
                  <View style={{ flex: 1, padding: 18, justifyContent: 'space-between' }}>
                    {/* Top: subtle category badge */}
                    <View style={{
                      alignSelf: 'flex-start',
                      backgroundColor: 'rgba(255,255,255,0.22)',
                      paddingHorizontal: 9,
                      paddingVertical: 3.5,
                      borderRadius: 14,
                    }}>
                      <Text style={{
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontFamily: 'OneUISans-Bold',
                        letterSpacing: 0.5,
                      }}>
                        {banner.badge.toUpperCase()}
                      </Text>
                    </View>

                    {/* Bottom: crisp headline + subtitle + minimal arrow */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            color: '#FFFFFF',
                            fontSize: 18,
                            fontFamily: 'OneUISans-Bold',
                            letterSpacing: -0.2,
                          }}
                        >
                          {banner.title}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={{
                            color: 'rgba(255,255,255,0.80)',
                            fontSize: 12,
                            fontFamily: 'OneUISans',
                            marginTop: 2,
                          }}
                        >
                          {banner.subtitle}
                        </Text>
                      </View>

                      {/* Small circular chevron affordance */}
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.4} />
                      </View>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Calming progress indicators */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
            {BANNERS.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setActiveBanner(i);
                  bannerScrollRef.current?.scrollTo({ x: i * (BANNER_CARD_WIDTH + 12), animated: true });
                  startAutoAdvance();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <View
                  style={{
                    width: activeBanner === i ? 22 : 6,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: activeBanner === i
                      ? Colors.skyPrimary
                      : (isDark ? '#334155' : '#CBD5E1'),
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ===================================================================== */}
        {/* APP TAGLINE                                                           */}
        {/* ===================================================================== */}
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

        {/* ===================================================================== */}
        {/* QUICK ACTIONS                                                         */}
        {/* ===================================================================== */}
        <View className="px-6 mt-7">
          <Text className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-white' : 'text-charcoal'}`}>
            {isTeacher ? 'Teacher Actions' : 'Quick Actions'}
          </Text>

          {isTeacher ? (
            <View className="flex-row gap-3.5">
              <TouchableOpacity
                className={`flex-1 p-5 rounded-3xl border shadow-sm ${isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'}`}
                onPress={() => router.push('/(tabs)/teaching')}
                activeOpacity={0.85}
              >
                <View className="w-11 h-11 rounded-2xl bg-sky-soft justify-center items-center mb-3">
                  <BookOpen size={20} color={Colors.royalBlue} />
                </View>
                <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>My Classes</Text>
                <Text className="text-[10px] text-sage mt-0.5">Start Live Circle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 p-5 rounded-3xl border shadow-sm ${isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'}`}
                onPress={() => router.push('/(tabs)/requests')}
                activeOpacity={0.85}
              >
                <View className="w-11 h-11 rounded-2xl bg-emerald-50 justify-center items-center mb-3">
                  <UserCheck size={20} color="#059669" />
                </View>
                <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>Inquiries</Text>
                <Text className="text-[10px] text-sage mt-0.5">1-on-1 Requests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 p-5 rounded-3xl border shadow-sm ${isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'}`}
                onPress={() => router.push('/(tabs)/questions')}
                activeOpacity={0.85}
              >
                <View className="w-11 h-11 rounded-2xl bg-amber-50 justify-center items-center mb-3">
                  <HelpCircle size={20} color="#D97706" />
                </View>
                <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>Fatwa Desk</Text>
                <Text className="text-[10px] text-sage mt-0.5">Answer Questions</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row gap-3.5">
              <TouchableOpacity
                className={`flex-1 p-5 rounded-3xl border shadow-sm ${isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'}`}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.85}
              >
                <View className="w-11 h-11 rounded-2xl bg-sky-soft justify-center items-center mb-3">
                  <BookOpen size={20} color={Colors.royalBlue} />
                </View>
                <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>Browse Classes</Text>
                <Text className="text-[10px] text-sage mt-0.5">Madrassa & Tajweed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 p-5 rounded-3xl border shadow-sm ${isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'}`}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.85}
              >
                <View className="w-11 h-11 rounded-2xl bg-emerald-50 justify-center items-center mb-3">
                  <UserCheck size={20} color="#059669" />
                </View>
                <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>1-on-1 Sheikh</Text>
                <Text className="text-[10px] text-sage mt-0.5">Private Guidance</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 p-5 rounded-3xl border shadow-sm ${isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'}`}
                onPress={() => router.push('/(tabs)/questions')}
                activeOpacity={0.85}
              >
                <View className="w-11 h-11 rounded-2xl bg-amber-50 justify-center items-center mb-3">
                  <HelpCircle size={20} color="#D97706" />
                </View>
                <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>Ask Scholar</Text>
                <Text className="text-[10px] text-sage mt-0.5">Verified Fatwa</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ===================================================================== */}
        {/* FEATURED MADRASSA CLASS                                               */}
        {/* ===================================================================== */}
        <View className="px-6 mt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-charcoal'}`}>
              Featured Madrassa Class
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text className="text-xs font-bold text-royal">View All</Text>
            </TouchableOpacity>
          </View>

          {classes.length > 0 ? (
            classes.slice(0, 1).map((c) => (
              <View
                key={c.id}
                className={`rounded-3xl p-6 border shadow-sm ${isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'}`}
              >
                <View className="flex-row justify-between items-center mb-3">
                  <View className="bg-sky-soft px-3.5 py-1 rounded-lg">
                    <Text className="text-[10px] font-bold text-royal uppercase">{c.subject}</Text>
                  </View>
                  <View className={`px-3 py-1 rounded-lg border ${c.is_free ? 'bg-mint border-emerald-400' : 'bg-amber-50 border-amber-400'}`}>
                    <Text className={`text-[10px] font-bold ${c.is_free ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {c.is_free ? 'FREE' : 'PAID'}
                    </Text>
                  </View>
                </View>

                <Text className={`text-base font-bold leading-snug ${isDark ? 'text-white' : 'text-charcoal'}`}>{c.title}</Text>
                <Text className="text-xs font-medium text-sage mt-1">Instructor: {c.teacher_name}</Text>

                <View className="flex-row items-center gap-2 mt-3">
                  <Calendar size={13} color={Colors.royalBlue} />
                  <Text className="text-xs font-medium text-sage">{c.recurring_schedule}</Text>
                </View>

                <TouchableOpacity
                  className="flex-row justify-center items-center gap-2 bg-royal rounded-2xl h-12 mt-5 shadow-sm"
                  onPress={() => openMeetLink(c.default_meet_link)}
                  activeOpacity={0.85}
                >
                  <Video size={16} color="#FFFFFF" />
                  <Text className="text-white text-xs font-bold">Join Live Class Session</Text>
                  <ChevronRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View
              className={`rounded-3xl p-6 border shadow-sm items-center ${
                isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
              }`}
            >
              <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                No Classes Scheduled Today
              </Text>
              <Text className="text-xs text-sage text-center mt-1 leading-5">
                Explore available weekend Madrassa circles or request 1-on-1 recitation with a Sheikh.
              </Text>
              <TouchableOpacity
                className="bg-royal px-5 py-2.5 rounded-2xl mt-4"
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.85}
              >
                <Text className="text-white text-xs font-bold">Browse Classes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ===================================================================== */}
        {/* SCHOLAR Q&A HIGHLIGHT                                                 */}
        {/* ===================================================================== */}
        <View className="px-6 mt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-charcoal'}`}>
              Scholar Ruling Highlight
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/questions')}>
              <Text className="text-xs font-bold text-royal">Q&A Board</Text>
            </TouchableOpacity>
          </View>

          {questions.length > 0 ? (
            questions.slice(0, 1).map((q) => (
              <TouchableOpacity
                key={q.id}
                className={`rounded-3xl p-6 border shadow-sm ${isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'}`}
                onPress={() => router.push('/(tabs)/questions')}
                activeOpacity={0.85}
              >
                <View className="flex-row justify-between items-center mb-2.5">
                  <View className="bg-sky-soft px-3 py-1 rounded-md">
                    <Text className="text-[10px] font-bold text-royal uppercase">{q.subject}</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <CheckCircle2 size={13} color={Colors.royalBlue} />
                    <Text className="text-xs font-bold text-royal">Verified Scholar</Text>
                  </View>
                </View>

                <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>{q.title}</Text>
                <Text className="text-xs leading-5 text-sage mt-2" numberOfLines={2}>
                  {q.answer || q.content}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View
              className={`rounded-3xl p-6 border shadow-sm items-center ${
                isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
              }`}
            >
              <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                No Community Questions Yet
              </Text>
              <Text className="text-xs text-sage text-center mt-1 leading-5">
                Have a question regarding prayer, fasting, or worship? Ask a verified scholar today.
              </Text>
              <TouchableOpacity
                className="bg-royal px-5 py-2.5 rounded-2xl mt-4"
                onPress={() => router.push('/(tabs)/questions')}
                activeOpacity={0.85}
              >
                <Text className="text-white text-xs font-bold">Ask Scholar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
