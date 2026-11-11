import { Locate } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

interface ManualLocationModalProps {
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
  onApply: (coords: { latitude: number; longitude: number }, city?: string) => void;
  onUseDeviceLocation: () => void;
}

export function ManualLocationModal({
  visible,
  isDark,
  onClose,
  onApply,
  onUseDeviceLocation,
}: ManualLocationModalProps) {
  const insets = useSafeAreaInsets();
  const [city, setCity] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  function handleApply() {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (
      isNaN(parsedLat) ||
      isNaN(parsedLng) ||
      parsedLat < -90 ||
      parsedLat > 90 ||
      parsedLng < -180 ||
      parsedLng > 180
    ) {
      Alert.alert(
        'Invalid Coordinates',
        'Enter valid latitude (-90 to 90) and longitude (-180 to 180).'
      );
      return;
    }

    onApply({ latitude: parsedLat, longitude: parsedLng }, city.trim() || undefined);
    setCity('');
    setLat('');
    setLng('');
    onClose();
  }

  function handleCancel() {
    setCity('');
    setLat('');
    setLng('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
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
              placeholder="e.g. Accra, Kumasi, Tamale"
              placeholderTextColor={Colors.sage}
              value={city}
              onChangeText={setCity}
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
                value={lat}
                onChangeText={setLat}
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
                value={lng}
                onChangeText={setLng}
              />
            </View>
          </View>

          <TouchableOpacity
            className="flex-row items-center gap-1.5 mb-5"
            onPress={() => {
              onClose();
              onUseDeviceLocation();
            }}
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
              onPress={handleCancel}
            >
              <Text className="text-sm font-bold text-sage">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 h-12 bg-sky-primary rounded-2xl justify-center items-center shadow-sm"
              onPress={handleApply}
            >
              <Text className="text-sm font-bold text-white">Search Here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
