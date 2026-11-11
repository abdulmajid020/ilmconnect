import { MapPin, Plus, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface TeachingLocationsSectionProps {
  locations: any[];
  isDark: boolean;
  onAddHub: () => void;
  onDeleteLocation: (locId: string) => void;
}

export function TeachingLocationsSection({
  locations,
  isDark,
  onAddHub,
  onDeleteLocation,
}: TeachingLocationsSectionProps) {
  return (
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
          onPress={onAddHub}
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
            onPress={onAddHub}
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
                onPress={() => onDeleteLocation(loc.id)}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
