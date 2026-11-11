import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_CARD_WIDTH = SCREEN_WIDTH - 48;

const BANNERS = [
  {
    id: 'b1',
    image: require('../../../assets/images/banner-mosque.jpg'),
    badge: 'Madrassa Classes',
    title: 'Learn Quran & Tajweed',
    subtitle: 'Interactive live circles led by certified Ghanaian Sheikhs',
  },
  {
    id: 'b2',
    image: require('../../../assets/images/banner-quran.jpg'),
    badge: 'Private Guidance',
    title: '1-on-1 Scholar Sessions',
    subtitle: 'Confidential spiritual and Islamic life mentorship',
  },
  {
    id: 'b3',
    image: require('../../../assets/images/banner-madrassa.jpg'),
    badge: 'Verified Fatwa',
    title: 'Ask a Verified Sheikh',
    subtitle: 'Authentic answers to everyday faith and worship questions',
  },
];

interface HomeBannerCarouselProps {
  isDark: boolean;
  hijriLabel?: string | null;
}

export function HomeBannerCarousel({ isDark, hijriLabel }: HomeBannerCarouselProps) {
  const [activeBanner, setActiveBanner] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bannerScrollRef = useRef<any>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    autoAdvanceRef.current = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % BANNERS.length;
        bannerScrollRef.current?.scrollTo({ x: next * (BANNER_CARD_WIDTH + 12), animated: true });
        return next;
      });
    }, 6500);
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

  return (
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
              <LinearGradient
                colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.80)']}
                locations={[0.2, 0.95]}
                style={{ position: 'absolute', inset: 0, borderRadius: 22 }}
              />

              <View style={{ flex: 1, padding: 18, justifyContent: 'space-between' }}>
                {/* Badge */}
                <View
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: 'rgba(255,255,255,0.22)',
                    paddingHorizontal: 9,
                    paddingVertical: 3.5,
                    borderRadius: 14,
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontFamily: 'OneUISans-Bold',
                      letterSpacing: 0.5,
                    }}
                  >
                    {banner.badge.toUpperCase()}
                  </Text>
                </View>

                {/* Bottom text */}
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
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Progress indicators */}
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
                backgroundColor:
                  activeBanner === i
                    ? Colors.skyPrimary
                    : isDark
                    ? '#334155'
                    : '#CBD5E1',
              }}
            />
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}

