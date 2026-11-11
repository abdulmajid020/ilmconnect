import { Compass, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ExploreOfferingsView } from '../../src/components/explore/ExploreOfferingsView';
import { NearbySegmentView } from '../../src/components/explore/NearbySegmentView';
import { Colors } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';

export default function ExploreScreen() {
  const { isDark } = useTheme();
  const [segment, setSegment] = useState<'EXPLORE' | 'NEARBY'>('EXPLORE');

  const bg = isDark ? 'bg-amoled-bg' : 'bg-slate-50';

  return (
    <View className={`flex-1 ${bg}`}>
      {/* ── Segment Control ── */}
      <View
        className={`mx-6 mt-3 mb-2 flex-row p-1 rounded-2xl border ${
          isDark ? 'bg-amoled-card border-amoled-border' : 'bg-slate-100 border-slate-200'
        }`}
      >
        <TouchableOpacity
          onPress={() => setSegment('EXPLORE')}
          activeOpacity={0.8}
          className={`flex-1 h-9 rounded-xl justify-center items-center flex-row gap-1.5 ${
            segment === 'EXPLORE' ? 'bg-royal' : ''
          }`}
        >
          <Compass size={14} color={segment === 'EXPLORE' ? '#fff' : Colors.sage} strokeWidth={2.2} />
          <Text
            className={`text-xs font-bold ${segment === 'EXPLORE' ? 'text-white' : 'text-sage'}`}
            style={{ fontFamily: 'OneUISans-Bold' }}
          >
            Explore
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSegment('NEARBY')}
          activeOpacity={0.8}
          className={`flex-1 h-9 rounded-xl justify-center items-center flex-row gap-1.5 ${
            segment === 'NEARBY' ? 'bg-sky-primary' : ''
          }`}
        >
          <MapPin size={14} color={segment === 'NEARBY' ? '#fff' : Colors.sage} strokeWidth={2.2} />
          <Text
            className={`text-xs font-bold ${segment === 'NEARBY' ? 'text-white' : 'text-sage'}`}
            style={{ fontFamily: 'OneUISans-Bold' }}
          >
            Nearby
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Segment Content ── */}
      {segment === 'EXPLORE' ? (
        <ExploreOfferingsView isDark={isDark} />
      ) : (
        <NearbySegmentView isDark={isDark} />
      )}
    </View>
  );
}
