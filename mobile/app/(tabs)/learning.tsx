import {
  Calendar,
  ExternalLink,
  UserCheck,
  Users,
  Video,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { api } from '../../src/api/client';
import { Colors } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';

export default function MyLearningScreen() {
  const { isDark } = useTheme();

  const [activeTeachers, setActiveTeachers] = useState<any[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLearningData();
  }, []);

  async function loadLearningData() {
    setIsLoading(true);
    try {
      const [teachersRes, classesRes] = await Promise.all([
        api.getMyTeachers().catch(() => []),
        api.getMyClasses().catch(() => []),
      ]);

      setActiveTeachers(Array.isArray(teachersRes) ? teachersRes : []);
      setEnrolledClasses(Array.isArray(classesRes) ? classesRes : []);
    } catch (err) {
      console.log('Error loading learning data:', err);
      setActiveTeachers([]);
      setEnrolledClasses([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }

  function openMeetLink(link: string | null) {
    if (!link) {
      Alert.alert(
        'Class Session Link',
        'Your Sheikh will publish the Google Meet link 15 minutes before the live session begins.'
      );
      return;
    }
    Linking.openURL(link).catch(() => {
      Alert.alert('Notice', 'Unable to launch Google Meet. Please ensure a browser is installed.');
    });
  }

  return (
    <ScrollView
      className={`flex-1 ${isDark ? 'bg-amoled-bg' : 'bg-slate-50'}`}
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 60 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await loadLearningData();
            setRefreshing(false);
          }}
          tintColor={Colors.skyPrimary}
        />
      }
    >
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.skyPrimary} className="mt-12" />
      ) : (
        <>
          {/* 1. Active 1-on-1 Sheikh Mentorship Section */}
          <Animated.View entering={FadeInUp.duration(350)} className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <UserCheck size={18} color={Colors.royalBlue} />
                <Text className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-charcoal'}`}>
                  1-on-1 Sheikh Mentorship
                </Text>
              </View>
              <Text className="text-xs font-semibold text-sage">
                {activeTeachers.length} Active
              </Text>
            </View>

            {activeTeachers.length === 0 ? (
              <View
                className={`rounded-3xl p-6 items-center border ${
                  isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
                }`}
              >
                <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                  No Active 1-on-1 Sheikh
                </Text>
                <Text className="text-xs text-center text-sage mt-1.5 leading-5">
                  Find a verified Ghanaian scholar on the Explore tab to request private recitation sessions.
                </Text>
              </View>
            ) : (
              activeTeachers.map((item) => (
                <View
                  key={item.relationship_id}
                  className={`rounded-3xl p-5 border mb-4 shadow-sm ${
                    isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
                  }`}
                >
                  <View className="flex-row items-start">
                    <View className="w-12 h-12 rounded-2xl bg-sky-primary justify-center items-center">
                      <Text className="text-white text-base font-bold">
                        {item.teacher_name?.charAt(0) || 'S'}
                      </Text>
                    </View>
                    <View className="flex-1 ml-3.5">
                      <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                        {item.teacher_name}
                      </Text>
                      <Text className="text-xs font-bold text-royal mt-0.5">{item.subject}</Text>
                    </View>
                    <View className="bg-emerald-100 px-2.5 py-1 rounded-md">
                      <Text className="text-[10px] font-bold text-emerald-700">ACTIVE</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2 mt-3">
                    <Calendar size={13} color={Colors.royalBlue} />
                    <Text className="text-xs font-medium text-sage">
                      {item.meeting_schedule || 'Coordinated directly with Sheikh'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    className="flex-row justify-center items-center gap-2 bg-royal rounded-2xl h-12 mt-4 shadow-sm"
                    onPress={() => openMeetLink(item.google_meet_link)}
                    activeOpacity={0.85}
                  >
                    <Video size={16} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold">Join 1-on-1 Google Meet</Text>
                    <ExternalLink size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Animated.View>

          {/* 2. Enrolled Madrassa Classes Section */}
          <Animated.View entering={FadeInUp.delay(100).duration(350)} className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <Users size={18} color={Colors.royalBlue} />
                <Text className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-charcoal'}`}>
                  Enrolled Madrassa Classes
                </Text>
              </View>
              <Text className="text-xs font-semibold text-sage">
                {enrolledClasses.length} Registered
              </Text>
            </View>

            {enrolledClasses.length === 0 ? (
              <View
                className={`rounded-3xl p-6 items-center border ${
                  isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
                }`}
              >
                <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                  No Enrolled Classes
                </Text>
                <Text className="text-xs text-center text-sage mt-1.5 leading-5">
                  Explore open weekend Madrassa classes with verified Ghanaian scholars.
                </Text>
              </View>
            ) : (
              enrolledClasses.map((item) => {
                const isWaitlisted = item.enrollment_status === 'WAITLISTED';

                return (
                  <View
                    key={item.class_id}
                    className={`rounded-3xl p-5 border mb-4 shadow-sm ${
                      isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
                    }`}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-3">
                        <Text className="text-[10px] font-bold text-royal uppercase">{item.subject}</Text>
                        <Text className={`text-base font-bold mt-1 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                          {item.title}
                        </Text>
                        <Text className="text-xs font-medium text-sage mt-0.5">
                          Instructor: {item.teacher_name}
                        </Text>
                      </View>

                      <View
                        className={`px-2.5 py-1 rounded-md ${
                          isWaitlisted ? 'bg-amber-100' : 'bg-emerald-100'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            isWaitlisted ? 'text-amber-800' : 'text-emerald-700'
                          }`}
                        >
                          {isWaitlisted ? 'WAITLISTED' : 'ENROLLED'}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-2 mt-3">
                      <Calendar size={13} color={Colors.royalBlue} />
                      <Text className="text-xs font-medium text-sage">
                        {item.recurring_schedule || 'Weekend interactive session'}
                      </Text>
                    </View>

                    {!isWaitlisted ? (
                      <TouchableOpacity
                        className="flex-row justify-center items-center gap-2 bg-royal rounded-2xl h-12 mt-4 shadow-sm"
                        onPress={() => openMeetLink(item.default_meet_link)}
                        activeOpacity={0.85}
                      >
                        <Video size={16} color="#FFFFFF" />
                        <Text className="text-white text-xs font-bold">Join Live Madrassa Session</Text>
                        <ExternalLink size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    ) : (
                      <View
                        className={`rounded-2xl p-3.5 mt-3.5 border ${
                          isDark ? 'bg-amber-950/30 border-amber-800' : 'bg-amber-50 border-amber-200'
                        }`}
                      >
                        <Text className="text-xs text-amber-700 font-medium leading-5">
                          You are on the reserved waiting list. The 20-seat capacity limit is active. You will be auto-notified once a seat opens.
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </Animated.View>
        </>
      )}
    </ScrollView>
  );
}
