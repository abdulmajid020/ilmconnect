import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, Video } from 'lucide-react-native';
import React from 'react';
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/theme';

interface FeaturedClassCardProps {
  classes: any[];
  isDark: boolean;
}

export function FeaturedClassCard({ classes, isDark }: FeaturedClassCardProps) {
  const router = useRouter();

  function openMeetLink(link: string | null) {
    if (!link) {
      Alert.alert('Notice', 'Google Meet link will be shared by Sheikh before class starts.');
      return;
    }
    Linking.openURL(link).catch(() => {
      Alert.alert('Error', 'Unable to open Google Meet.');
    });
  }

  return (
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
            className={`rounded-3xl p-6 border shadow-sm ${
              isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
            }`}
          >
            <View className="flex-row justify-between items-center mb-3">
              <View className="bg-sky-soft px-3.5 py-1 rounded-lg">
                <Text className="text-[10px] font-bold text-royal uppercase">{c.subject}</Text>
              </View>
              <View
                className={`px-3 py-1 rounded-lg border ${
                  c.is_free ? 'bg-mint border-emerald-400' : 'bg-amber-50 border-amber-400'
                }`}
              >
                <Text className={`text-[10px] font-bold ${c.is_free ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {c.is_free ? 'FREE' : 'PAID'}
                </Text>
              </View>
            </View>

            <Text className={`text-base font-bold leading-snug ${isDark ? 'text-white' : 'text-charcoal'}`}>
              {c.title}
            </Text>
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
  );
}

