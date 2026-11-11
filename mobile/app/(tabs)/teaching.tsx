import { useRouter } from 'expo-router';
import { Calendar, GraduationCap, Plus, Users, Video } from 'lucide-react-native';
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../../src/api/client';
import { AddLocationModal } from '../../src/components/teaching/AddLocationModal';
import { CreateClassModal } from '../../src/components/teaching/CreateClassModal';
import { TeachingLocationsSection } from '../../src/components/teaching/TeachingLocationsSection';
import { Colors } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';

export default function TeachingScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [classes, setClasses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setIsLoading(true);
    try {
      const [classesRes, locsRes] = await Promise.all([
        api.getTeacherMyClasses().catch(() => []),
        api.getMyTeacherLocations().catch(() => []),
      ]);
      setClasses(Array.isArray(classesRes) ? classesRes : []);
      setLocations(Array.isArray(locsRes) ? locsRes : []);
    } catch {
      setClasses([]);
      setLocations([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }

  async function handleDeleteLocation(locId: string) {
    Alert.alert('Remove Location', 'Are you sure you want to remove this teaching location?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteTeacherLocation(locId);
            setLocations((prev) => prev.filter((l) => l.id !== locId));
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete location.');
          }
        },
      },
    ]);
  }

  function launchMeet(link: string) {
    if (!link) {
      Alert.alert('Notice', 'Please configure a Google Meet URL for this class.');
      return;
    }
    Linking.openURL(link).catch(() => Alert.alert('Error', 'Unable to open Google Meet.'));
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-amoled-bg' : 'bg-slate-50'}`}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAllData();
            }}
            tintColor="#1993FA"
          />
        }
      >
        {/* Sheikh Header Bar */}
        <Animated.View entering={FadeInDown.duration(350)} className="mb-6">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-xs font-bold uppercase tracking-wider text-royal">
                Teacher Hub
              </Text>
              <Text className={`text-2xl font-extrabold mt-0.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                My Madrassa Classes
              </Text>
            </View>

            <TouchableOpacity
              className="flex-row items-center gap-1.5 bg-royal px-4 py-2.5 rounded-2xl shadow-sm shadow-royal/30"
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.85}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text className="text-white text-xs font-extrabold">New Class</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {isLoading ? (
          <View className="py-16 items-center">
            <ActivityIndicator size="large" color="#027BFF" />
            <Text className="text-xs text-sage font-medium mt-3">Loading your classes & locations...</Text>
          </View>
        ) : classes.length === 0 ? (
          <View
            className={`rounded-3xl p-8 items-center border border-dashed ${
              isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-300'
            }`}
          >
            <View className="w-14 h-14 rounded-full bg-sky-soft justify-center items-center mb-3">
              <GraduationCap size={28} color={Colors.royalBlue} />
            </View>
            <Text className={`text-base font-bold text-center ${isDark ? 'text-white' : 'text-charcoal'}`}>
              No Active Classes Yet
            </Text>
            <Text className="text-xs text-sage text-center mt-1 leading-5">
              Start your first group Madrassa circle and invite learners across Ghana.
            </Text>
            <TouchableOpacity
              className="mt-4 bg-royal px-5 py-2.5 rounded-xl"
              onPress={() => setShowCreateModal(true)}
            >
              <Text className="text-white text-xs font-bold">Create Class</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-4">
            {classes.map((c) => (
              <View
                key={c.id}
                className={`rounded-3xl p-5 border shadow-sm ${
                  isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
                }`}
              >
                <View className="flex-row justify-between items-center mb-2.5">
                  <View className="bg-sky-soft px-3 py-1 rounded-md">
                    <Text className="text-[10px] font-bold text-royal uppercase">{c.subject}</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5 bg-mint px-2.5 py-1 rounded-md border border-emerald-300">
                    <Users size={12} color="#059669" />
                    <Text className="text-[10px] font-bold text-emerald-700">
                      {c.enrolled_count || 14}/{c.capacity || 20} Enrolled
                    </Text>
                  </View>
                </View>

                <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                  {c.title}
                </Text>

                <View className="flex-row items-center gap-2 mt-2">
                  <Calendar size={13} color={Colors.royalBlue} />
                  <Text className="text-xs text-sage font-medium">{c.recurring_schedule}</Text>
                </View>

                {/* Actions */}
                <View className="flex-row gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-amoled-border">
                  <TouchableOpacity
                    className="flex-1 flex-row justify-center items-center gap-1.5 bg-royal rounded-xl h-11"
                    onPress={() => launchMeet(c.default_meet_link)}
                    activeOpacity={0.85}
                  >
                    <Video size={15} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold">Start Live Session</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── PHYSICAL TEACHING HUBS (PostGIS Discovery) ── */}
        <TeachingLocationsSection
          locations={locations}
          isDark={isDark}
          onAddHub={() => setShowLocationModal(true)}
          onDeleteLocation={handleDeleteLocation}
        />
      </ScrollView>

      {/* CREATE CLASS MODAL */}
      <CreateClassModal
        visible={showCreateModal}
        isDark={isDark}
        onClose={() => setShowCreateModal(false)}
        onClassCreated={loadAllData}
      />

      {/* REGISTER TEACHING LOCATION MODAL */}
      <AddLocationModal
        visible={showLocationModal}
        isDark={isDark}
        onClose={() => setShowLocationModal(false)}
        onLocationAdded={loadAllData}
      />
    </View>
  );
}
