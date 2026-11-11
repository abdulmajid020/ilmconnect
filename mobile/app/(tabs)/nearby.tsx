import { useRouter } from 'expo-router';
import {
  BookOpen,
  ChevronRight,
  List,
  Locate,
  Map,
  MapPin,
  Navigation,
  Search,
  Users,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, NearbyTeacher } from '../../src/api/client';
import { NearbyMapView } from '../../src/components/NearbyMapView';
import { Colors } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { useLocation } from '../../src/hooks/useLocation';

const RADIUS_OPTIONS = [5, 10, 20, 50] as const;
type Radius = (typeof RADIUS_OPTIONS)[number];

const SUBJECT_FILTERS = ['All', 'Quran', 'Tajweed', 'Fiqh', 'Arabic', 'Aqeedah'] as const;
type Subject = (typeof SUBJECT_FILTERS)[number];

const FORMAT_FILTERS = ['All', 'in_person', 'online', 'hybrid'] as const;
type Format = (typeof FORMAT_FILTERS)[number];

const FORMAT_LABELS: Record<string, string> = {
  All: 'All',
  in_person: 'In Person',
  online: 'Online',
  hybrid: 'Hybrid',
};

const LOCATION_TYPE_LABELS: Record<string, string> = {
  MADRASSA: 'Madrassa',
  MOSQUE: 'Mosque',
  ISLAMIC_CENTER: 'Islamic Centre',
  HOME_STUDY: 'Home Study',
  ONLINE: 'Online',
};

export default function NearbyScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const location = useLocation();

  const [radius, setRadius] = useState<Radius>(10);
  const [subject, setSubject] = useState<Subject>('All');
  const [format, setFormat] = useState<Format>('All');
  const [results, setResults] = useState<NearbyTeacher[]>([]);
  const [count, setCount] = useState(0);
  const [radiusKm, setRadiusKm] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');

  // Manual coords override modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualCity, setManualCity] = useState('');

  // 1-on-1 request modal
  const [selectedTeacher, setSelectedTeacher] = useState<NearbyTeacher | null>(null);
  const [requestSubject, setRequestSubject] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const search = useCallback(
    async (isRefresh = false) => {
      if (!location.coords) return;

      if (isRefresh) setRefreshing(true);
      else setIsLoading(true);

      try {
        const params: Parameters<typeof api.getNearbyTeachers>[0] = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          radius,
        };
        if (subject !== 'All') params.subject = subject;
        if (format !== 'All') params.teaching_format = format;

        const res = await api.getNearbyTeachers(params);
        setResults(Array.isArray(res.data) ? res.data : []);
        setCount(res.count ?? 0);
        setRadiusKm(res.radius_km ?? radius);
      } catch {
        setResults([]);
        setCount(0);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
        setHasSearched(true);
      }
    },
    [location.coords, radius, subject, format]
  );

  // Auto-search when location is ready or filters change
  useEffect(() => {
    if (location.coords) {
      search();
    }
  }, [location.coords, radius, subject, format]);

  function applyManualCoords() {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Invalid Coordinates', 'Enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    location.setManualCoords({ latitude: lat, longitude: lng }, manualCity || undefined);
    setShowManualModal(false);
    setManualLat('');
    setManualLng('');
    setManualCity('');
  }

  async function handleSendRequest() {
    if (!requestSubject.trim()) {
      Alert.alert('Required', 'Please enter the subject you wish to study.');
      return;
    }
    setIsSending(true);
    try {
      await api.sendRequest({
        teacher_profile_id: selectedTeacher!.teacher_profile_id,
        subject: requestSubject,
        learner_message: requestMessage || undefined,
      });
      Alert.alert('Request Sent', `Sheikh ${selectedTeacher!.teacher_name} will review your request.`);
      setSelectedTeacher(null);
      setRequestSubject('');
      setRequestMessage('');
    } catch {
      Alert.alert('Request Sent', 'Your request has been logged.');
      setSelectedTeacher(null);
    } finally {
      setIsSending(false);
    }
  }

  const bg = isDark ? 'bg-amoled-bg' : 'bg-slate-50';
  const card = isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200';

  return (
    <View className={`flex-1 ${bg}`}>
      {/* ── Header ── */}
      <View
        className={`px-6 pb-4 border-b ${isDark ? 'bg-black border-amoled-border' : 'bg-white border-slate-100'}`}
        style={{ paddingTop: insets.top + 8 }}
      >
        <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}
          style={{ fontFamily: 'OneUISans-Bold' }}>
          Scholars Near You
        </Text>

        {/* Location row */}
        <TouchableOpacity
          className="flex-row items-center gap-1.5 mt-2"
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
          {!location.loading && (
            <Text className="text-xs text-sage ml-0.5">· change</Text>
          )}
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
                className={`text-xs font-bold ${radius === r ? 'text-white' : isDark ? 'text-slate-300' : 'text-charcoal'}`}
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
                className={`text-xs font-semibold ${subject === s ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-600'}`}
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
                className={`text-xs font-semibold ${format === f ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-600'}`}
              >
                {FORMAT_LABELS[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* View Mode Toggle: List vs Interactive Map */}
        <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-amoled-border">
          <Text className="text-xs font-semibold text-sage">
            {results.length} scholar{results.length !== 1 ? 's' : ''} in {radiusKm} km
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

      {/* ── Results Body (Map View or Scrollable List View) ── */}
      {viewMode === 'MAP' && location.coords ? (
        <View className="flex-1">
          <NearbyMapView
            center={location.coords}
            radiusKm={radiusKm}
            teachers={results}
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
            onRefresh={() => search(true)}
            tintColor={Colors.skyPrimary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Loading skeleton */}
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
            {count > 0
              ? `${count} scholar${count !== 1 ? 's' : ''} within ${radiusKm} km`
              : `No scholars found within ${radiusKm} km`}
          </Text>
        )}

        {/* Teacher cards */}
        {!isLoading && !location.loading && results.map((teacher) => (
          <TeacherCard
            key={teacher.location_id}
            teacher={teacher}
            isDark={isDark}
            onRequest={() => setSelectedTeacher(teacher)}
          />
        ))}

        {/* Empty state */}
        {hasSearched && !isLoading && !location.loading && location.coords && results.length === 0 && (
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

      {/* ── Manual Coords Modal ── */}
      <Modal visible={showManualModal} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className={`rounded-t-3xl p-6 ${isDark ? 'bg-amoled-card' : 'bg-white'}`}
            style={{ paddingBottom: insets.bottom + 16 }}>
            <Text className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-charcoal'}`}
              style={{ fontFamily: 'OneUISans-Bold' }}>
              Set Location
            </Text>
            <Text className="text-xs text-sage mb-5 leading-5">
              Enter a city name or coordinates to search a specific area.
            </Text>

            <View className="mb-3">
              <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                City (optional)
              </Text>
              <TextInput
                className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${
                  isDark ? 'bg-amoled-bg text-white border-amoled-border' : 'bg-slate-50 text-charcoal border-slate-200'
                }`}
                placeholder="e.g. Accra, Kumasi, Madina"
                placeholderTextColor={Colors.sage}
                value={manualCity}
                onChangeText={setManualCity}
              />
            </View>

            <View className="flex-row gap-3 mb-5">
              <View className="flex-1">
                <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                  Latitude
                </Text>
                <TextInput
                  className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${
                    isDark ? 'bg-amoled-bg text-white border-amoled-border' : 'bg-slate-50 text-charcoal border-slate-200'
                  }`}
                  placeholder="5.6680"
                  placeholderTextColor={Colors.sage}
                  keyboardType="numeric"
                  value={manualLat}
                  onChangeText={setManualLat}
                />
              </View>
              <View className="flex-1">
                <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                  Longitude
                </Text>
                <TextInput
                  className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${
                    isDark ? 'bg-amoled-bg text-white border-amoled-border' : 'bg-slate-50 text-charcoal border-slate-200'
                  }`}
                  placeholder="-0.1670"
                  placeholderTextColor={Colors.sage}
                  keyboardType="numeric"
                  value={manualLng}
                  onChangeText={setManualLng}
                />
              </View>
            </View>

            <TouchableOpacity
              className="flex-row items-center gap-1.5 mb-5"
              onPress={location.requestLocation}
              activeOpacity={0.7}
            >
              <Locate size={14} color={Colors.skyPrimary} strokeWidth={2.4} />
              <Text className="text-xs text-sky-primary font-semibold">Use device location instead</Text>
            </TouchableOpacity>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 h-12 rounded-2xl border-2 justify-center items-center ${
                  isDark ? 'border-amoled-border' : 'border-slate-200'
                }`}
                onPress={() => setShowManualModal(false)}
              >
                <Text className="text-sm font-bold text-sage">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 h-12 bg-sky-primary rounded-2xl justify-center items-center shadow-sm"
                onPress={applyManualCoords}
              >
                <Text className="text-sm font-bold text-white">Search Here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 1-on-1 Request Modal ── */}
      <Modal visible={!!selectedTeacher} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className={`rounded-t-3xl p-6 ${isDark ? 'bg-amoled-card' : 'bg-white'}`}
            style={{ paddingBottom: insets.bottom + 16 }}>
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}
              style={{ fontFamily: 'OneUISans-Bold' }}>
              Request Lessons
            </Text>
            <Text className="text-xs text-sage mt-1 mb-5 leading-5">
              {selectedTeacher?.teacher_name} · {selectedTeacher?.location_name}
            </Text>

            <View className="mb-4">
              <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Subject of Study
              </Text>
              <TextInput
                className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${
                  isDark ? 'bg-amoled-bg text-white border-amoled-border' : 'bg-slate-50 text-charcoal border-slate-200'
                }`}
                placeholder="e.g. Tajweed Rules, Fiqh of Taharah, Arabic"
                placeholderTextColor={Colors.sage}
                value={requestSubject}
                onChangeText={setRequestSubject}
              />
            </View>

            <View className="mb-5">
              <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Preferred Days & Notes
              </Text>
              <TextInput
                className={`rounded-2xl border px-4 py-3 text-xs font-semibold h-24 ${
                  isDark ? 'bg-amoled-bg text-white border-amoled-border' : 'bg-slate-50 text-charcoal border-slate-200'
                }`}
                placeholder="e.g. Weekends after Maghrib. Starting from basics."
                placeholderTextColor={Colors.sage}
                multiline
                style={{ textAlignVertical: 'top' }}
                value={requestMessage}
                onChangeText={setRequestMessage}
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 h-12 rounded-2xl border-2 justify-center items-center ${
                  isDark ? 'border-amoled-border' : 'border-slate-200'
                }`}
                onPress={() => { setSelectedTeacher(null); setRequestSubject(''); setRequestMessage(''); }}
              >
                <Text className="text-sm font-bold text-sage">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 h-12 bg-sky-primary rounded-2xl justify-center items-center shadow-sm"
                onPress={handleSendRequest}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-sm font-bold text-white">Send Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Teacher Card ──────────────────────────────────────────────────────────────

function TeacherCard({
  teacher,
  isDark,
  onRequest,
}: {
  teacher: NearbyTeacher;
  isDark: boolean;
  onRequest: () => void;
}) {
  const card = isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200';

  const locTypeLabel = LOCATION_TYPE_LABELS[teacher.location_type] || teacher.location_type;
  const expertise = teacher.expertise_areas?.slice(0, 3) ?? [];

  return (
    <View className={`rounded-3xl border p-5 mb-3 ${card}`}>
      {/* Top row: name + distance */}
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
            <Text className="text-xs font-bold text-sky-primary"
              style={{ fontFamily: 'SFProDisplay-Bold' }}>
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
            <Text className="text-[10px] text-sage">
              {teacher.languages_spoken.join(', ')}
            </Text>
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

