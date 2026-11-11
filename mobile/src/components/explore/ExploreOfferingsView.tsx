import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Search,
  Users,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/client';
import { Colors } from '../../constants/theme';
import { RequestLessonModal } from '../common/RequestLessonModal';

interface ExploreOfferingsViewProps {
  isDark: boolean;
}

export function ExploreOfferingsView({ isDark }: ExploreOfferingsViewProps) {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'FREE' | 'PAID' | 'TEACHERS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1-on-1 Request modal state
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);

  useEffect(() => {
    loadExploreData();
  }, []);

  async function loadExploreData() {
    setIsLoading(true);
    try {
      const [teachersRes, classesRes] = await Promise.all([
        api.searchTeachers().catch(() => []),
        api.listClasses().catch(() => []),
      ]);
      setTeachers(Array.isArray(teachersRes) ? teachersRes : []);
      setClasses(Array.isArray(classesRes) ? classesRes : []);
    } catch {
      setTeachers([]);
      setClasses([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }

  async function handleEnroll(classItem: any) {
    try {
      const res = await api.enrollClass(classItem.id);
      Alert.alert(
        res.status === 'ENROLLED' ? '✅ Enrolled Successfully!' : '📋 Waitlisted',
        res.message || `You have been registered for "${classItem.title}".`
      );
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Enrollment processed. Check My Learning tab.');
    }
  }

  // Filter logic
  const filteredClasses = classes.filter((c) => {
    const matchesSearch =
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'FREE') return c.is_free !== false;
    if (activeFilter === 'PAID') return c.is_free === false;
    if (activeFilter === 'TEACHERS') return false;
    return true;
  });

  const filteredTeachers = teachers.filter((t) => {
    if (activeFilter === 'FREE' || activeFilter === 'PAID') return false;
    const matchesSearch =
      t.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.expertise_areas?.some((e: string) => e.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.languages_spoken?.some((l: string) => l.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <View className="flex-1">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadExploreData();
            }}
            tintColor={Colors.skyPrimary}
          />
        }
      >
        {/* Search */}
        <View
          className={`flex-row items-center rounded-2xl px-4 h-13 border shadow-sm ${
            isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
          }`}
        >
          <Search size={18} color={Colors.sage} />
          <TextInput
            className={`flex-1 ml-3 text-xs font-semibold ${isDark ? 'text-white' : 'text-charcoal'}`}
            placeholder="Search classes, Tajweed, Fiqh, Sheikhs..."
            placeholderTextColor={Colors.sage}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Pills */}
        <View className="py-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {(['ALL', 'FREE', 'PAID', 'TEACHERS'] as const).map((f) => {
              const labels: Record<string, string> = {
                ALL: 'All Offerings',
                FREE: 'Free (Sadaqah)',
                PAID: 'Paid / Intensive',
                TEACHERS: '1-on-1 Sheikhs',
              };
              const isActive = activeFilter === f;
              return (
                <TouchableOpacity
                  key={f}
                  className={`flex-row items-center px-4 py-2 rounded-full border-2 ${
                    isActive
                      ? 'bg-royal border-royal'
                      : isDark
                      ? 'bg-transparent border-amoled-border'
                      : 'bg-transparent border-slate-200'
                  }`}
                  onPress={() => setActiveFilter(f)}
                >
                  {f === 'FREE' && <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />}
                  <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-sage'}`}>
                    {labels[f]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.skyPrimary} className="mt-10" />
        ) : (
          <>
            {/* Madrassa Group Classes */}
            {filteredClasses.length > 0 && (
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-3.5">
                  <Text className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-charcoal'}`}>
                    Madrassa Group Classes
                  </Text>
                  <Text className="text-xs font-semibold text-sage">{filteredClasses.length} Available</Text>
                </View>

                {filteredClasses.map((c) => {
                  const seatsRemaining = c.capacity - (c.enrolled_count || 0);
                  const isFull = seatsRemaining <= 0;
                  const isFree = c.is_free !== false;
                  return (
                    <View
                      key={c.id}
                      className={`rounded-3xl p-5 border mb-4 shadow-sm ${
                        isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
                      }`}
                    >
                      <View className="flex-row justify-between items-center mb-2.5">
                        <View className="bg-sky-soft px-3 py-1 rounded-lg">
                          <Text className="text-[10px] font-bold text-royal uppercase">{c.subject}</Text>
                        </View>
                        <View className="flex-row gap-1.5 items-center">
                          <View
                            className={`px-2.5 py-1 rounded-lg border ${
                              isFree
                                ? isDark
                                  ? 'bg-emerald-950/40 border-emerald-500'
                                  : 'bg-mint border-emerald-400'
                                : 'bg-amber-50 border-amber-400'
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-bold tracking-wider ${
                                isFree ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : 'text-amber-800'
                              }`}
                            >
                              {isFree ? 'FREE' : c.fee_label || 'PAID'}
                            </Text>
                          </View>
                          <View
                            className={`flex-row items-center gap-1 border px-2 py-1 rounded-lg ${
                              isFull
                                ? 'bg-red-50 border-red-200'
                                : isDark
                                ? 'bg-amoled-bg border-amoled-border'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <Users size={12} color={isFull ? Colors.danger : Colors.royalBlue} />
                            <Text className={`text-[11px] font-bold ${isFull ? 'text-red-600' : 'text-royal'}`}>
                              {isFull ? 'Waitlist' : `${c.enrolled_count || 0}/${c.capacity}`}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text className={`text-base font-bold leading-snug ${isDark ? 'text-white' : 'text-charcoal'}`}>
                        {c.title}
                      </Text>
                      <Text className="text-xs font-medium text-sage mt-1">Instructor: {c.teacher_name}</Text>

                      <View className="flex-row items-center gap-2 mt-2.5">
                        <Calendar size={13} color={Colors.royalBlue} />
                        <Text className="text-xs font-medium text-sage">
                          {c.recurring_schedule || 'Weekend live schedule'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        className={`flex-row justify-center items-center gap-1.5 rounded-2xl h-12 mt-4 ${
                          isFull
                            ? isDark
                              ? 'bg-slate-800 border border-slate-700'
                              : 'bg-slate-100 border border-slate-300'
                            : 'bg-royal shadow-sm'
                        }`}
                        onPress={() => handleEnroll(c)}
                        activeOpacity={0.85}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            isFull ? (isDark ? 'text-slate-400' : 'text-charcoal') : 'text-white'
                          }`}
                        >
                          {isFull ? 'Join Class Waitlist' : 'Enroll in Class (Free)'}
                        </Text>
                        {!isFull && <ChevronRight size={16} color="#FFFFFF" />}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Verified Scholars */}
            {filteredTeachers.length > 0 && (
              <View className="mb-4 mt-2">
                <View className="flex-row justify-between items-center mb-3.5">
                  <Text className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-charcoal'}`}>
                    Verified Ghanaian Scholars
                  </Text>
                  <Text className="text-xs font-semibold text-sage">1-on-1 Mentorship</Text>
                </View>

                {filteredTeachers.map((t) => (
                  <View
                    key={t.id}
                    className={`rounded-3xl p-5 border mb-4 shadow-sm ${
                      isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
                    }`}
                  >
                    <View className="flex-row items-center">
                      <View className="w-13 h-13 rounded-2xl bg-sky-primary justify-center items-center">
                        <Text className="text-white text-lg font-bold">{t.full_name?.charAt(0) || 'S'}</Text>
                      </View>
                      <View className="flex-1 ml-3.5">
                        <View className="flex-row items-center gap-1.5">
                          <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                            {t.full_name}
                          </Text>
                          <CheckCircle2 size={15} color={Colors.royalBlue} />
                        </View>
                        <Text className="text-xs text-sage mt-0.5">{t.islamic_education}</Text>
                        <Text className="text-[11px] font-bold text-royal mt-0.5">
                          {t.years_experience} Years Teaching Experience
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row flex-wrap gap-1.5 mt-3.5">
                      {t.expertise_areas?.map((area: string, idx: number) => (
                        <View
                          key={idx}
                          className={`px-3 py-1 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-mint'}`}
                        >
                          <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                            {area}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View className="flex-row items-center gap-2 mt-3">
                      <Text className="text-xs font-semibold text-sage">Languages:</Text>
                      <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                        {t.languages_spoken?.join(', ')}
                      </Text>
                    </View>

                    <TouchableOpacity
                      className="flex-row justify-center items-center gap-1.5 bg-sky-primary rounded-2xl h-12 mt-4 shadow-sm"
                      onPress={() => setSelectedTeacher(t)}
                      activeOpacity={0.85}
                    >
                      <Text className="text-white text-xs font-bold">Request 1-on-1 Lessons</Text>
                      <ChevronRight size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Empty State */}
            {filteredClasses.length === 0 && filteredTeachers.length === 0 && (
              <View
                className={`rounded-3xl p-8 items-center border mt-4 ${
                  isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
                }`}
              >
                <Search size={32} color={Colors.sage} />
                <Text className={`text-sm font-bold mt-3 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                  No Results Found
                </Text>
                <Text className="text-xs text-center text-sage mt-1.5 leading-5">
                  {searchQuery
                    ? `No classes or scholars found matching "${searchQuery}".`
                    : 'No classes or verified scholars available for this filter right now.'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* 1-on-1 Request Modal */}
      <RequestLessonModal
        visible={!!selectedTeacher}
        teacherId={selectedTeacher?.id || null}
        teacherName={selectedTeacher?.full_name}
        subtitle="Connect directly with verified Ghanaian scholars for private Tajweed or Fiqh guidance."
        isDark={isDark}
        onClose={() => setSelectedTeacher(null)}
      />
    </View>
  );
}
