import {
  BookOpen,
  ChevronRight,
  MapPin,
  Navigation,
  Users,
} from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { NearbyTeacher } from '../../api/client';
import { FORMAT_LABELS, LOCATION_TYPE_LABELS } from '../../constants/labels';
import { Colors } from '../../constants/theme';

interface NearbyTeacherCardProps {
  teacher: NearbyTeacher;
  isDark: boolean;
  onRequest: () => void;
}

export function NearbyTeacherCard({
  teacher,
  isDark,
  onRequest,
}: NearbyTeacherCardProps) {
  const card = isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200';
  const locTypeLabel = LOCATION_TYPE_LABELS[teacher.location_type] || teacher.location_type;
  const expertise = teacher.expertise_areas?.slice(0, 3) ?? [];

  return (
    <View className={`rounded-3xl border p-5 mb-3 ${card}`}>
      {/* Top row */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text
            className={`text-sm font-bold leading-5 ${isDark ? 'text-white' : 'text-charcoal'}`}
            style={{ fontFamily: 'OneUISans-Bold' }}
            numberOfLines={1}
          >
            {teacher.teacher_name}
          </Text>
          {teacher.islamic_education && (
            <Text className="text-xs text-sage mt-0.5 leading-4" numberOfLines={2}>
              {teacher.islamic_education}
            </Text>
          )}
        </View>
        <View className="items-end">
          <View className="flex-row items-center gap-1 bg-sky-primary/10 px-2.5 py-1 rounded-full">
            <Navigation size={10} color={Colors.skyPrimary} strokeWidth={2.4} />
            <Text
              className="text-xs font-bold text-sky-primary"
              style={{ fontFamily: 'SFProDisplay-Bold' }}
            >
              {teacher.distance_km.toFixed(1)} km
            </Text>
          </View>
        </View>
      </View>

      {/* Location row */}
      <View className="flex-row items-center gap-1.5 mt-3">
        <MapPin size={12} color={Colors.sage} strokeWidth={2.2} />
        <Text className="text-xs text-sage flex-1" numberOfLines={1}>
          {teacher.location_name}
          {teacher.city ? ` · ${teacher.city}` : ''}
        </Text>
        <View className={`px-2 py-0.5 rounded-full border ${isDark ? 'border-amoled-border' : 'border-slate-200'}`}>
          <Text className="text-[10px] text-sage font-semibold">{locTypeLabel}</Text>
        </View>
      </View>

      {/* Expertise pills */}
      {expertise.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5 mt-3">
          {expertise.map((area) => (
            <View
              key={area}
              className={`px-2.5 py-1 rounded-full border ${
                isDark ? 'bg-amoled-bg border-amoled-border' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <Text className={`text-[10px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {area}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Stats row */}
      <View className="flex-row items-center gap-4 mt-3">
        {teacher.languages_spoken && teacher.languages_spoken.length > 0 && (
          <View className="flex-row items-center gap-1">
            <Users size={11} color={Colors.sage} strokeWidth={2.2} />
            <Text className="text-[10px] text-sage">{teacher.languages_spoken.join(', ')}</Text>
          </View>
        )}
        {teacher.years_experience > 0 && (
          <View className="flex-row items-center gap-1">
            <BookOpen size={11} color={Colors.sage} strokeWidth={2.2} />
            <Text className="text-[10px] text-sage">
              {teacher.years_experience} yr{teacher.years_experience !== 1 ? 's' : ''} exp.
            </Text>
          </View>
        )}
        <View className="flex-1" />
        <Text className="text-[10px] text-sage capitalize">
          {FORMAT_LABELS[teacher.teaching_format || ''] || teacher.teaching_format}
        </Text>
      </View>

      {/* CTA */}
      <TouchableOpacity
        className="flex-row justify-center items-center gap-1.5 bg-sky-primary rounded-2xl h-11 mt-4"
        onPress={onRequest}
        activeOpacity={0.85}
      >
        <Text className="text-white text-xs font-bold">Request 1-on-1 Lessons</Text>
        <ChevronRight size={15} color="#FFFFFF" strokeWidth={2.4} />
      </TouchableOpacity>
    </View>
  );
}

