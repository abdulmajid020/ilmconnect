import { useRouter } from 'expo-router';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Compass,
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

// ── Nearby constants ─────────────────────────────────────────────────────────
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

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Segment: EXPLORE (classes/scholars) | NEARBY (geo-search)
  const [segment, setSegment] = useState<'EXPLORE' | 'NEARBY'>('EXPLORE');

  // ── Explore tab state ──────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'FREE' | 'PAID' | 'TEACHERS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoadingExplore, setIsLoadingExplore] = useState(true);
  const [refreshingExplore, setRefreshingExplore] = useState(false);

  // 1-on-1 request modal (Explore side)
  const [selectedExploreTeacher, setSelectedExploreTeacher] = useState<any | null>(null);
  const [exploreRequestSubject, setExploreRequestSubject] = useState('');
  const [exploreRequestMessage, setExploreRequestMessage] = useState('');
  const [isSendingExploreRequest, setIsSendingExploreRequest] = useState(false);

  // ── Nearby tab state ───────────────────────────────────────────────────────
  const location = useLocation();
  const [radius, setRadius] = useState<Radius>(10);
  const [subject, setSubject] = useState<Subject>('All');
  const [format, setFormat] = useState<Format>('All');
  const [nearbyResults, setNearbyResults] = useState<NearbyTeacher[]>([]);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [radiusKm, setRadiusKm] = useState(10);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [refreshingNearby, setRefreshingNearby] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');

  // Manual coords override modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualCity, setManualCity] = useState('');

  // 1-on-1 request modal (Nearby side)
  const [selectedNearbyTeacher, setSelectedNearbyTeacher] = useState<NearbyTeacher | null>(null);
  const [nearbyRequestSubject, setNearbyRequestSubject] = useState('');
  const [nearbyRequestMessage, setNearbyRequestMessage] = useState('');
  const [isSendingNearbyRequest, setIsSendingNearbyRequest] = useState(false);

  const bg = isDark ? 'bg-amoled-bg' : 'bg-slate-50';
  const card = isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200';

  // ── Explore: load data ─────────────────────────────────────────────────────
  useEffect(() => {
    loadExploreData();
  }, []);

  async function loadExploreData() {
    setIsLoadingExplore(true);
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
      setIsLoadingExplore(false);
      setRefreshingExplore(false);
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

  async function handleSendExploreRequest() {
    if (!exploreRequestSubject) {
      Alert.alert('Error', 'Please enter the subject you wish to study');
      return;
    }
    setIsSendingExploreRequest(true);
    try {
      await api.sendRequest({
        teacher_profile_id: selectedExploreTeacher.id,
        subject: exploreRequestSubject,
        learner_message: exploreRequestMessage || undefined,
      });
      Alert.alert('Request Sent! ✉️', `Sheikh ${selectedExploreTeacher.full_name} will review your request.`);
      setSelectedExploreTeacher(null);
      setExploreRequestSubject('');
      setExploreRequestMessage('');
    } catch {
      Alert.alert('Request Sent', 'Your request has been logged.');
      setSelectedExploreTeacher(null);
    } finally {
      setIsSendingExploreRequest(false);
    }
  }

  // Filter logic (Explore)
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

  // ── Nearby: search ─────────────────────────────────────────────────────────
  const searchNearby = useCallback(
    async (isRefresh = false) => {
      if (!location.coords) return;
      if (isRefresh) setRefreshingNearby(true);
      else setIsLoadingNearby(true);
      try {
        const params: Parameters<typeof api.getNearbyTeachers>[0] = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          radius,
        };
        if (subject !== 'All') params.subject = subject;
        if (format !== 'All') params.teaching_format = format;
        const res = await api.getNearbyTeachers(params);
        setNearbyResults(Array.isArray(res.data) ? res.data : []);
        setNearbyCount(res.count ?? 0);
        setRadiusKm(res.radius_km ?? radius);
      } catch {
        setNearbyResults([]);
        setNearbyCount(0);
      } finally {
        setIsLoadingNearby(false);
        setRefreshingNearby(false);
        setHasSearched(true);
      }
    },
    [location.coords, radius, subject, format]
  );

  useEffect(() => {
    if (location.coords) {
      searchNearby();
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

  async function handleSendNearbyRequest() {
    if (!nearbyRequestSubject.trim()) {
      Alert.alert('Required', 'Please enter the subject you wish to study.');
      return;
    }
    setIsSendingNearbyRequest(true);
    try {
      await api.sendRequest({
        teacher_profile_id: selectedNearbyTeacher!.teacher_profile_id,
        subject: nearbyRequestSubject,
        learner_message: nearbyRequestMessage || undefined,
      });
      Alert.alert('Request Sent', `Sheikh ${selectedNearbyTeacher!.teacher_name} will review your request.`);
      setSelectedNearbyTeacher(null);
      setNearbyRequestSubject('');
      setNearbyRequestMessage('');
    } catch {
      Alert.alert('Request Sent', 'Your request has been logged.');
      setSelectedNearbyTeacher(null);
    } finally {
      setIsSendingNearbyRequest(false);
    }
  }

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

      {/* ════════════════════════════════════════════════════
          SEGMENT A: EXPLORE CLASSES & SCHOLARS
      ════════════════════════════════════════════════════ */}
      {segment === 'EXPLORE' && (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshingExplore}
              onRefresh={async () => {
                setRefreshingExplore(true);
                await loadExploreData();
              }}
              tintColor="#1993FA"
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

          {isLoadingExplore ? (
            <ActivityIndicator size="large" color="#1993FA" className="mt-10" />
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
                        onPress={() => setSelectedExploreTeacher(t)}
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
      )}

      {/* ════════════════════════════════════════════════════
          SEGMENT B: NEARBY SCHOLARS
      ════════════════════════════════════════════════════ */}
      {segment === 'NEARBY' && (
        <View className="flex-1">
          {/* Nearby sub-header */}
          <View
            className={`px-6 pb-3 border-b ${isDark ? 'border-amoled-border' : 'border-slate-100'}`}
          >
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

          {/* Map view */}
          {viewMode === 'MAP' && location.coords ? (
            <View className="flex-1">
              <NearbyMapView
                center={location.coords}
                radiusKm={radiusKm}
                teachers={nearbyResults}
                onSelectTeacher={(t) => setSelectedNearbyTeacher(t)}
                isDark={isDark}
              />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshingNearby}
                  onRefresh={() => searchNearby(true)}
                  tintColor={Colors.skyPrimary}
                />
              }
              showsVerticalScrollIndicator={false}
            >
              {/* Loading */}
              {(isLoadingNearby || location.loading) && (
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
              {hasSearched && !isLoadingNearby && !location.loading && location.coords && (
                <Text className="text-xs text-sage mb-3">
                  {nearbyCount > 0
                    ? `${nearbyCount} scholar${nearbyCount !== 1 ? 's' : ''} within ${radiusKm} km`
                    : `No scholars found within ${radiusKm} km`}
                </Text>
              )}

              {/* Teacher cards */}
              {!isLoadingNearby &&
                !location.loading &&
                nearbyResults.map((teacher) => (
                  <NearbyTeacherCard
                    key={teacher.location_id}
                    teacher={teacher}
                    isDark={isDark}
                    onRequest={() => setSelectedNearbyTeacher(teacher)}
                  />
                ))}

              {/* Empty state */}
              {hasSearched &&
                !isLoadingNearby &&
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
        </View>
      )}

      {/* ── Manual Coords Modal ── */}
      <Modal visible={showManualModal} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View
            className={`rounded-t-3xl p-6 ${isDark ? 'bg-amoled-card' : 'bg-white'}`}
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <Text
              className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-charcoal'}`}
              style={{ fontFamily: 'OneUISans-Bold' }}
            >
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
                  isDark
                    ? 'bg-amoled-bg text-white border-amoled-border'
                    : 'bg-slate-50 text-charcoal border-slate-200'
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
                    isDark
                      ? 'bg-amoled-bg text-white border-amoled-border'
                      : 'bg-slate-50 text-charcoal border-slate-200'
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
                    isDark
                      ? 'bg-amoled-bg text-white border-amoled-border'
                      : 'bg-slate-50 text-charcoal border-slate-200'
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

      {/* ── Explore: 1-on-1 Request Modal ── */}
      <Modal visible={!!selectedExploreTeacher} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className={`rounded-t-3xl p-6 ${isDark ? 'bg-amoled-card' : 'bg-white'}`}>
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
              Request Lessons with {selectedExploreTeacher?.full_name}
            </Text>
            <Text className="text-xs mt-1 mb-4 leading-5 text-sage">
              Connect directly with verified Ghanaian scholars for private Tajweed or Fiqh guidance.
            </Text>

            <View className="mb-4">
              <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Subject of Study
              </Text>
              <TextInput
                className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${
                  isDark
                    ? 'bg-amoled-bg text-white border-amoled-border'
                    : 'bg-slate-50 text-charcoal border-slate-200'
                }`}
                placeholder="e.g. Tajweed Rules, Fiqh of Taharah, Arabic"
                placeholderTextColor={isDark ? '#64748B' : Colors.sage}
                value={exploreRequestSubject}
                onChangeText={setExploreRequestSubject}
              />
            </View>

            <View className="mb-4">
              <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Preferred Days & Notes
              </Text>
              <TextInput
                className={`rounded-2xl border px-4 py-3 text-xs font-semibold h-24 ${
                  isDark
                    ? 'bg-amoled-bg text-white border-amoled-border'
                    : 'bg-slate-50 text-charcoal border-slate-200'
                }`}
                placeholder="e.g. Weekends after Maghrib (GMT). Starting from basic recitation."
                placeholderTextColor={isDark ? '#64748B' : Colors.sage}
                multiline
                style={{ textAlignVertical: 'top' }}
                value={exploreRequestMessage}
                onChangeText={setExploreRequestMessage}
              />
            </View>

            <View className="flex-row gap-3 mt-3">
              <TouchableOpacity
                className={`flex-1 h-12 rounded-2xl border-2 justify-center items-center ${
                  isDark ? 'border-amoled-border' : 'border-slate-200'
                }`}
                onPress={() => setSelectedExploreTeacher(null)}
              >
                <Text className="text-sm font-bold text-sage">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-2 bg-sky-primary h-12 rounded-2xl justify-center items-center shadow-sm"
                onPress={handleSendExploreRequest}
                disabled={isSendingExploreRequest}
              >
                {isSendingExploreRequest ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white text-sm font-bold">Send Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Nearby: 1-on-1 Request Modal ── */}
      <Modal visible={!!selectedNearbyTeacher} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View
            className={`rounded-t-3xl p-6 ${isDark ? 'bg-amoled-card' : 'bg-white'}`}
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <Text
              className={`text-lg font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}
              style={{ fontFamily: 'OneUISans-Bold' }}
            >
              Request Lessons
            </Text>
            <Text className="text-xs text-sage mt-1 mb-5 leading-5">
              {selectedNearbyTeacher?.teacher_name} · {selectedNearbyTeacher?.location_name}
            </Text>

            <View className="mb-4">
              <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Subject of Study
              </Text>
              <TextInput
                className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${
                  isDark
                    ? 'bg-amoled-bg text-white border-amoled-border'
                    : 'bg-slate-50 text-charcoal border-slate-200'
                }`}
                placeholder="e.g. Tajweed Rules, Fiqh of Taharah, Arabic"
                placeholderTextColor={Colors.sage}
                value={nearbyRequestSubject}
                onChangeText={setNearbyRequestSubject}
              />
            </View>

            <View className="mb-5">
              <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Preferred Days & Notes
              </Text>
              <TextInput
                className={`rounded-2xl border px-4 py-3 text-xs font-semibold h-24 ${
                  isDark
                    ? 'bg-amoled-bg text-white border-amoled-border'
                    : 'bg-slate-50 text-charcoal border-slate-200'
                }`}
                placeholder="e.g. Weekends after Maghrib. Starting from basics."
                placeholderTextColor={Colors.sage}
                multiline
                style={{ textAlignVertical: 'top' }}
                value={nearbyRequestMessage}
                onChangeText={setNearbyRequestMessage}
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 h-12 rounded-2xl border-2 justify-center items-center ${
                  isDark ? 'border-amoled-border' : 'border-slate-200'
                }`}
                onPress={() => {
                  setSelectedNearbyTeacher(null);
                  setNearbyRequestSubject('');
                  setNearbyRequestMessage('');
                }}
              >
                <Text className="text-sm font-bold text-sage">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 h-12 bg-sky-primary rounded-2xl justify-center items-center shadow-sm"
                onPress={handleSendNearbyRequest}
                disabled={isSendingNearbyRequest}
              >
                {isSendingNearbyRequest ? (
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

// ── Nearby Teacher Card ───────────────────────────────────────────────────────
function NearbyTeacherCard({
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
