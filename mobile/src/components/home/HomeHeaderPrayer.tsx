import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Moon, Sun, Sunrise, Sunset } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrayerKey } from '../../api/prayerTimes';

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

interface HomeHeaderPrayerProps {
  isTeacher: boolean;
  userName?: string;
  isDark: boolean;
  nextPrayer: PrayerKey;
  countdown: string;
  nextPrayerTime: string;
}

export function HomeHeaderPrayer({
  isTeacher,
  userName,
  isDark,
  nextPrayer,
  countdown,
  nextPrayerTime,
}: HomeHeaderPrayerProps) {
  const insets = useSafeAreaInsets();
  const nextIconMeta = PRAYER_ICON_MAP[nextPrayer] || PRAYER_ICON_MAP.Fajr;
  const NextIcon = nextIconMeta.icon;

  const displayName = userName
    ? (isTeacher ? userName : userName.split(' ')[0])
    : (isTeacher ? 'Sheikh' : 'Learner');

  return (
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
            {displayName} 🇬🇭
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
  );
}
