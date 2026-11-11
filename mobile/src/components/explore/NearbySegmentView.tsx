import {
  List,
  Map,
  MapPin,
  Navigation,
  Search,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FORMAT_LABELS } from '../../constants/labels';
import { Colors } from '../../constants/theme';
import { useLocation } from '../../hooks/useLocation';
import { useNearbyTeachers } from '../../hooks/useNearbyTeachers';
import { ManualLocationModal } from '../common/ManualLocationModal';
import { NearbyMapView } from '../common/NearbyMapView';
import { RequestLessonModal } from '../common/RequestLessonModal';
import { NearbyTeacherCard } from './NearbyTeacherCard';

const RADIUS_OPTIONS = [5, 10, 20, 50] as const;
type Radius = (typeof RADIUS_OPTIONS)[number];

const SUBJECT_FILTERS = ['All', 'Quran', 'Tajweed', 'Fiqh', 'Arabic', 'Aqeedah'] as const;
type Subject = (typeof SUBJECT_FILTERS)[number];

const FORMAT_FILTERS = ['All', 'in_person', 'online', 'hybrid'] as const;
type Format = (typeof FORMAT_FILTERS)[number];

interface NearbySegmentViewProps {
  isDark: boolean;
}

export function NearbySegmentView({ isDark }: NearbySegmentViewProps) {
  const location = useLocation();

  const [radius, setRadius] = useState<Radius>(10);
  const [subject, setSubject] = useState<Subject>('All');
  const [format, setFormat] = useState<Format>('All');
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');

  // Modals state
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);

  const {
    teachers: nearbyResults,
    count: nearbyCount,
    radiusKm,
    isLoading,
    refreshing,
    hasSearched,
    search: searchNearby,
  } = useNearbyTeachers({
    coords: location.coords,
    radius,
    subject,
    format,
  });

  const card = isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200';

  return (
    <View className="flex-1">
      {/* ── Filter Bar & Controls ── */}
      <View className={`px-6 pb-3 border-b ${isDark ? 'border-amoled-border' : 'border-slate-100'}`}>
        {/* Location row */}
        <TouchableOpacity
          className="flex-row items-center gap-1.5"
          onPress={() => setShowManualModal(true)}
          activeOpacity={0.7}
        >
          <MapPin size={14} color={Colors.skyPrimary} strokeWidth={2.4} />
          <Text className="text-sm text-sky-primary font-semibold" style={{ fontFamily: 'OneUISans' }}>
            {location.loading
              ? 'Detecting location…'
              : location.permissionDenied
              ? 'Location denied — tap to set manually'
              : location.city
              ? location.city
              : location.coords
              ? `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
              : 'Set location'}
          </Text>
          {!location.loading && <Text className="text-xs text-sage ml-0.5">· change</Text>}
        </TouchableOpacity>

        {/* Radius pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 -mx-1"
          contentContainerStyle={{ paddingHorizontal: 4, gap: 8 }}
        >
          {RADIUS_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRadius(r)}
              activeOpacity={0.75}
              className={`px-4 py-1.5 rounded-full border ${
                radius === r
                  ? 'bg-sky-primary border-sky-primary'
                  : isDark
                  ? 'border-amoled-border bg-amoled-card'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  radius === r ? 'text-white' : isDark ? 'text-slate-300' : 'text-charcoal'
                }`}
              >
                {r} km
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Subject filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2 -mx-1"
          contentContainerStyle={{ paddingHorizontal: 4, gap: 8 }}
        >
          {SUBJECT_FILTERS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSubject(s)}
              activeOpacity={0.75}
              className={`px-3.5 py-1 rounded-full border ${
                subject === s
                  ? 'bg-emerald-600 border-emerald-600'
                  : isDark
                  ? 'border-amoled-border bg-amoled-card'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  subject === s ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Format filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2 -mx-1"
          contentContainerStyle={{ paddingHorizontal: 4, gap: 8 }}
        >
          {FORMAT_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFormat(f)}
              activeOpacity={0.75}
              className={`px-3.5 py-1 rounded-full border ${
                format === f
                  ? 'bg-violet-600 border-violet-600'
                  : isDark
                  ? 'border-amoled-border bg-amoled-card'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  format === f ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {FORMAT_LABELS[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* View mode + count row */}
        <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-amoled-border">
          <Text className="text-xs font-semibold text-sage">
            {nearbyResults.length} scholar{nearbyResults.length !== 1 ? 's' : ''} in {radiusKm} km
          </Text>
          <View
            className={`flex-row p-0.5 rounded-xl border ${
              isDark ? 'bg-amoled-bg border-amoled-border' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <TouchableOpacity
              onPress={() => setViewMode('LIST')}
              className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                viewMode === 'LIST' ? (isDark ? 'bg-amoled-card' : 'bg-white') : ''
              }`}
            >
              <List size={13} color={viewMode === 'LIST' ? Colors.skyPrimary : Colors.sage} />
              <Text
                className={`text-xs font-bold ${
                  viewMode === 'LIST' ? (isDark ? 'text-white' : 'text-charcoal') : 'text-sage'
                }`}
              >
                List
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('MAP')}
              className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                viewMode === 'MAP' ? (isDark ? 'bg-amoled-card' : 'bg-white') : ''
              }`}
            >
              <Map size={13} color={viewMode === 'MAP' ? Colors.skyPrimary : Colors.sage} />
              <Text
                className={`text-xs font-bold ${
                  viewMode === 'MAP' ? (isDark ? 'text-white' : 'text-charcoal') : 'text-sage'
                }`}
              >
                Map
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Content View: Map vs List ── */}
      {viewMode === 'MAP' && location.coords ? (
        <View className="flex-1">
          <NearbyMapView
            center={location.coords}
            radiusKm={radiusKm}
            teachers={nearbyResults}
            onSelectTeacher={(t) => setSelectedTeacher(t)}
            isDark={isDark}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => searchNearby(true)}
              tintColor={Colors.skyPrimary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Loading */}
          {(isLoading || location.loading) && (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color={Colors.skyPrimary} />
              <Text className="text-xs text-sage mt-3">
                {location.loading ? 'Detecting your location…' : 'Searching nearby scholars…'}
              </Text>
            </View>
          )}

          {/* Permission denied */}
          {!location.loading && location.permissionDenied && (
            <View className={`rounded-3xl p-8 items-center border mt-4 ${card}`}>
              <Navigation size={32} color={Colors.sage} />
              <Text className={`text-sm font-bold mt-3 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Location Access Needed
              </Text>
              <Text className="text-xs text-center text-sage mt-1.5 leading-5">
                IlmConnect needs your location to find nearby verified scholars.
              </Text>
              <View className="flex-row gap-3 mt-5 w-full">
                <TouchableOpacity
                  className="flex-1 h-11 bg-sky-primary rounded-2xl justify-center items-center"
                  onPress={location.requestLocation}
                >
                  <Text className="text-white text-xs font-bold">Allow Location</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 h-11 rounded-2xl border-2 justify-center items-center ${
                    isDark ? 'border-amoled-border' : 'border-slate-200'
                  }`}
                  onPress={() => setShowManualModal(true)}
                >
                  <Text className="text-xs font-bold text-sage">Set Manually</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Result count */}
          {hasSearched && !isLoading && !location.loading && location.coords && (
            <Text className="text-xs text-sage mb-3">
              {nearbyCount > 0
                ? `${nearbyCount} scholar${nearbyCount !== 1 ? 's' : ''} within ${radiusKm} km`
                : `No scholars found within ${radiusKm} km`}
            </Text>
          )}

          {/* Teacher cards */}
          {!isLoading &&
            !location.loading &&
            nearbyResults.map((teacher) => (
              <NearbyTeacherCard
                key={teacher.location_id}
                teacher={teacher}
                isDark={isDark}
                onRequest={() => setSelectedTeacher(teacher)}
              />
            ))}

          {/* Empty state */}
          {hasSearched &&
            !isLoading &&
            !location.loading &&
            location.coords &&
            nearbyResults.length === 0 && (
              <View className={`rounded-3xl p-8 items-center border mt-4 ${card}`}>
                <Search size={32} color={Colors.sage} />
                <Text className={`text-sm font-bold mt-3 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                  No Scholars Found
                </Text>
                <Text className="text-xs text-center text-sage mt-1.5 leading-5">
                  No verified scholars found within {radiusKm} km with the selected filters.{'\n'}
                  Try expanding the radius or adjusting filters.
                </Text>
                {radius < 50 && (
                  <TouchableOpacity
                    className="mt-4 h-11 px-6 bg-sky-primary rounded-2xl justify-center items-center"
                    onPress={() => setRadius(RADIUS_OPTIONS[RADIUS_OPTIONS.indexOf(radius) + 1] ?? 50)}
                  >
                    <Text className="text-white text-xs font-bold">
                      Expand to {RADIUS_OPTIONS[RADIUS_OPTIONS.indexOf(radius) + 1] ?? 50} km
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
        </ScrollView>
      )}

      {/* Manual Location Modal */}
      <ManualLocationModal
        visible={showManualModal}
        isDark={isDark}
        onClose={() => setShowManualModal(false)}
        onApply={(coords, city) => location.setManualCoords(coords, city)}
        onUseDeviceLocation={location.requestLocation}
      />

      {/* 1-on-1 Request Modal */}
      <RequestLessonModal
        visible={!!selectedTeacher}
        teacherId={selectedTeacher?.teacher_profile_id || null}
        teacherName={selectedTeacher?.teacher_name}
        subtitle={
          selectedTeacher
            ? `${selectedTeacher.teacher_name} · ${selectedTeacher.location_name}`
            : undefined
        }
        isDark={isDark}
        onClose={() => setSelectedTeacher(null)}
      />
    </View>
  );
}

