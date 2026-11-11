import * as Location from 'expo-location';
import { Locate, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/client';

const LOC_TYPES = [
  { key: 'MADRASSA', label: 'Madrassa' },
  { key: 'MOSQUE', label: 'Mosque' },
  { key: 'ISLAMIC_CENTER', label: 'Islamic Centre' },
  { key: 'HOME_STUDY', label: 'Home Study' },
];

interface AddLocationModalProps {
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
  onLocationAdded: () => void;
}

export function AddLocationModal({
  visible,
  isDark,
  onClose,
  onLocationAdded,
}: AddLocationModalProps) {
  const [locName, setLocName] = useState('');
  const [locType, setLocType] = useState('MADRASSA');
  const [locAddress, setLocAddress] = useState('');
  const [locCity, setLocCity] = useState('Accra');
  const [locRegion, setLocRegion] = useState('Greater Accra');
  const [locLat, setLocLat] = useState('');
  const [locLng, setLocLng] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isAddingLoc, setIsAddingLoc] = useState(false);

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
      setLocName('');
      setLocAddress('');
      setLocLat('');
      setLocLng('');
      onLocationAdded();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save teaching location.');
    } finally {
      setIsAddingLoc(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
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
            <TouchableOpacity onPress={onClose}>
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
  );
}
