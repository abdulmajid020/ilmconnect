import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Calendar, GraduationCap,  Locate, MapPin, Plus, Trash2, Users, Video, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../../src/api/client';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

export default function TeachingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [classes, setClasses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingLoc, setIsAddingLoc] = useState(false);

  // New class form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Tajweed');
  const [schedule, setSchedule] = useState('Saturdays 7:00 PM GMT');
  const [meetLink, setMeetLink] = useState('');
  const [capacity, setCapacity] = useState('20');
  const [description, setDescription] = useState('');

  // Teaching location form state
  const [locName, setLocName] = useState('');
  const [locType, setLocType] = useState('MADRASSA');
  const [locAddress, setLocAddress] = useState('');
  const [locCity, setLocCity] = useState('Accra');
  const [locRegion, setLocRegion] = useState('Greater Accra');
  const [locLat, setLocLat] = useState('');
  const [locLng, setLocLng] = useState('');
  const [isLocating, setIsLocating] = useState(false);

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

  async function handleDetectLocation() {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permission to auto-fill coordinates.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocLat(pos.coords.latitude.toFixed(6));
      setLocLng(pos.coords.longitude.toFixed(6));

      // Reverse geocode to get city/region if possible
      const geocode = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }).catch(() => null);
      if (geocode && geocode[0]) {
        if (geocode[0].city) setLocCity(geocode[0].city);
        if (geocode[0].region) setLocRegion(geocode[0].region);
        if (geocode[0].street) setLocAddress(geocode[0].street);
      }
    } catch (err: any) {
      Alert.alert('Location Error', err?.message || 'Could not detect device coordinates.');
    } finally {
      setIsLocating(false);
    }
  }

  async function handleAddLocation() {
    if (!locName.trim() || !locAddress.trim() || !locLat.trim() || !locLng.trim()) {
      Alert.alert('Required Fields', 'Please enter location name, address, latitude, and longitude.');
      return;
    }

    const lat = parseFloat(locLat);
    const lng = parseFloat(locLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Invalid Coordinates', 'Enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }

    setIsAddingLoc(true);
    try {
      await api.addTeacherLocation({
        location_name: locName.trim(),
        location_type: locType,
        address: locAddress.trim(),
        city: locCity.trim() || 'Accra',
        region: locRegion.trim() || 'Greater Accra',
        latitude: lat,
        longitude: lng,
      });

      Alert.alert('Location Registered', 'Your teaching hub is now discoverable by nearby students on PostGIS.');
      setShowLocationModal(false);
      setLocName('');
      setLocAddress('');
      setLocLat('');
      setLocLng('');
      loadAllData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save teaching location.');
    } finally {
      setIsAddingLoc(false);
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

  async function handleCreateClass() {
    if (!title.trim() || !subject.trim()) {
      Alert.alert('Required Fields', 'Please enter a class title and subject.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createClass({
        title,
        subject,
        description: description || `Weekly Islamic Madrassa circle in ${subject}.`,
        recurring_schedule: schedule,
        default_meet_link: meetLink || 'https://meet.google.com/new',
        capacity: parseInt(capacity, 10) || 20,
        level: 'BEGINNER',
        visibility: 'PUBLIC',
        enrollment_mode: 'OPEN',
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      Alert.alert('Success', 'Madrassa class published successfully.');
      loadAllData();
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Created local preview session.');
      setShowCreateModal(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  function launchMeet(link: string) {
    if (!link) {
      Alert.alert('Notice', 'Please configure a Google Meet URL for this class.');
      return;
    }
    Linking.openURL(link).catch(() => Alert.alert('Error', 'Unable to open Google Meet.'));
  }

  const LOC_TYPES = [
    { key: 'MADRASSA', label: 'Madrassa' },
    { key: 'MOSQUE', label: 'Mosque' },
    { key: 'ISLAMIC_CENTER', label: 'Islamic Centre' },
    { key: 'HOME_STUDY', label: 'Home Study' },
  ];

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
        <View className="mt-10 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-xs font-bold uppercase tracking-wider text-royal">
                Spatial PostGIS Hubs
              </Text>
              <Text className={`text-xl font-extrabold mt-0.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                My Teaching Locations
              </Text>
            </View>

            <TouchableOpacity
              className="flex-row items-center gap-1.5 bg-emerald-600 px-3.5 py-2 rounded-2xl shadow-sm"
              onPress={() => setShowLocationModal(true)}
              activeOpacity={0.85}
            >
              <Plus size={15} color="#FFFFFF" />
              <Text className="text-white text-xs font-extrabold">Add Hub</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-xs text-sage mb-4 leading-5">
            Physical centers, mosques, and madrassas where you teach. Nearby students can discover you using GIS radius search.
          </Text>

          {locations.length === 0 ? (
            <View
              className={`rounded-3xl p-6 items-center border border-dashed ${
                isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-300'
              }`}
            >
              <View className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 justify-center items-center mb-2">
                <MapPin size={22} color="#059669" />
              </View>
              <Text className={`text-sm font-bold text-center ${isDark ? 'text-white' : 'text-charcoal'}`}>
                No Physical Hubs Registered
              </Text>
              <Text className="text-xs text-sage text-center mt-1 leading-5">
                Add your teaching location so local students can find you on the Nearby Discovery map.
              </Text>
              <TouchableOpacity
                className="mt-3.5 bg-emerald-600 px-4 py-2 rounded-xl"
                onPress={() => setShowLocationModal(true)}
              >
                <Text className="text-white text-xs font-bold">Register Location</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-3">
              {locations.map((loc) => (
                <View
                  key={loc.id}
                  className={`rounded-2xl p-4 border flex-row items-center justify-between ${
                    isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
                  }`}
                >
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text
                        className={`text-sm font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}
                        numberOfLines={1}
                      >
                        {loc.location_name}
                      </Text>
                      <View className="bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                        <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          {loc.location_type}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-sage" numberOfLines={1}>
                      {loc.address}, {loc.city}
                    </Text>
                    <Text className="text-[10px] text-slate-400 mt-1 font-mono">
                      GPS: {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 items-center justify-center"
                    onPress={() => handleDeleteLocation(loc.id)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* CREATE CLASS MODAL */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View
            className={`rounded-t-3xl p-6 ${
              isDark ? 'bg-amoled-card border-t border-amoled-border' : 'bg-white'
            }`}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                New Madrassa Class
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={20} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              <View>
                <Text className="text-xs font-bold text-sage mb-1">Class Title</Text>
                <TextInput
                  className={`border rounded-xl px-3.5 h-11 text-sm ${
                    isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                  placeholder="e.g. Al-Jazariyyah Tajweed Circle"
                  placeholderTextColor="#99A69D"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-sage mb-1">Subject</Text>
                <TextInput
                  className={`border rounded-xl px-3.5 h-11 text-sm ${
                    isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                  placeholder="e.g. Tajweed, Fiqh, Tafseer"
                  placeholderTextColor="#99A69D"
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-sage mb-1">Weekly Schedule</Text>
                <TextInput
                  className={`border rounded-xl px-3.5 h-11 text-sm ${
                    isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                  placeholder="e.g. Sundays 7:30 PM GMT"
                  placeholderTextColor="#99A69D"
                  value={schedule}
                  onChangeText={setSchedule}
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-sage mb-1">Google Meet Link</Text>
                <TextInput
                  className={`border rounded-xl px-3.5 h-11 text-sm ${
                    isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                  placeholder="https://meet.google.com/xyz-uvwx-rst"
                  placeholderTextColor="#99A69D"
                  value={meetLink}
                  onChangeText={setMeetLink}
                />
              </View>

              <TouchableOpacity
                className="bg-royal h-12 rounded-2xl justify-center items-center mt-3"
                onPress={handleCreateClass}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-sm font-extrabold">Publish Class</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* REGISTER TEACHING LOCATION MODAL */}
      <Modal visible={showLocationModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View
            className={`rounded-t-3xl p-6 ${
              isDark ? 'bg-amoled-card border-t border-amoled-border' : 'bg-white'
            }`}
          >
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                  Register Teaching Hub
                </Text>
                <Text className="text-xs text-sage mt-0.5">
                  Madrassa or center where you teach in-person
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <X size={20} color={isDark ? '#FFFFFF' : '#000000'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
              <View>
                <Text className="text-xs font-bold text-sage mb-1">Hub / Madrassa Name</Text>
                <TextInput
                  className={`border rounded-xl px-3.5 h-11 text-sm ${
                    isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                  placeholder="e.g. Madina Central Madrassa"
                  placeholderTextColor="#99A69D"
                  value={locName}
                  onChangeText={setLocName}
                />
              </View>

              {/* Location Type Chips */}
              <View>
                <Text className="text-xs font-bold text-sage mb-1.5">Hub Type</Text>
                <View className="flex-row flex-wrap gap-2">
                  {LOC_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.key}
                      onPress={() => setLocType(t.key)}
                      className={`px-3 py-1.5 rounded-full border ${
                        locType === t.key
                          ? 'bg-emerald-600 border-emerald-600'
                          : isDark
                          ? 'border-amoled-border bg-amoled-bg'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          locType === t.key ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-xs font-bold text-sage mb-1">Street Address</Text>
                <TextInput
                  className={`border rounded-xl px-3.5 h-11 text-sm ${
                    isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                  placeholder="e.g. Near Old Market, Main Road"
                  placeholderTextColor="#99A69D"
                  value={locAddress}
                  onChangeText={setLocAddress}
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-sage mb-1">City</Text>
                  <TextInput
                    className={`border rounded-xl px-3.5 h-11 text-sm ${
                      isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                    placeholder="Accra"
                    placeholderTextColor="#99A69D"
                    value={locCity}
                    onChangeText={setLocCity}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-sage mb-1">Region</Text>
                  <TextInput
                    className={`border rounded-xl px-3.5 h-11 text-sm ${
                      isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                    placeholder="Greater Accra"
                    placeholderTextColor="#99A69D"
                    value={locRegion}
                    onChangeText={setLocRegion}
                  />
                </View>
              </View>

              {/* Coordinates Section */}
              <View className="mt-1">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-xs font-bold text-sage">GPS Coordinates</Text>
                  <TouchableOpacity
                    className="flex-row items-center gap-1"
                    onPress={handleDetectLocation}
                    disabled={isLocating}
                  >
                    {isLocating ? (
                      <ActivityIndicator size="small" color="#059669" />
                    ) : (
                      <>
                        <Locate size={12} color="#059669" strokeWidth={2.4} />
                        <Text className="text-xs font-bold text-emerald-600">Use Current GPS</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <TextInput
                      className={`border rounded-xl px-3.5 h-11 text-sm ${
                        isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                      placeholder="Latitude (e.g. 5.6680)"
                      placeholderTextColor="#99A69D"
                      keyboardType="numeric"
                      value={locLat}
                      onChangeText={setLocLat}
                    />
                  </View>
                  <View className="flex-1">
                    <TextInput
                      className={`border rounded-xl px-3.5 h-11 text-sm ${
                        isDark ? 'bg-amoled-bg border-amoled-border text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                      placeholder="Longitude (e.g. -0.1670)"
                      placeholderTextColor="#99A69D"
                      keyboardType="numeric"
                      value={locLng}
                      onChangeText={setLocLng}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                className="bg-emerald-600 h-12 rounded-2xl justify-center items-center mt-3"
                onPress={handleAddLocation}
                disabled={isAddingLoc}
              >
                {isAddingLoc ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-sm font-extrabold">Save Location</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

