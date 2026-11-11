import { useRouter } from 'expo-router';
import { BookOpen, HelpCircle, UserCheck } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/theme';

interface HomeQuickActionsProps {
  isTeacher: boolean;
  isDark: boolean;
}

export function HomeQuickActions({ isTeacher, isDark }: HomeQuickActionsProps) {
  const router = useRouter();

  return (
    <View className="px-6 mt-7">
      <Text className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-white' : 'text-charcoal'}`}>
        {isTeacher ? 'Teacher Actions' : 'Quick Actions'}
      </Text>

      {isTeacher ? (
        <View className="flex-row gap-3.5">
          <TouchableOpacity
            className={`flex-1 p-5 rounded-3xl border shadow-sm ${
              isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
            }`}
            onPress={() => router.push('/(tabs)/teaching')}
            activeOpacity={0.85}
          >
            <View className="w-11 h-11 rounded-2xl bg-sky-soft justify-center items-center mb-3">
              <BookOpen size={20} color={Colors.royalBlue} />
            </View>
            <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>My Classes</Text>
            <Text className="text-[10px] text-sage mt-0.5">Start Live Circle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 p-5 rounded-3xl border shadow-sm ${
              isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
            }`}
            onPress={() => router.push('/(tabs)/requests')}
            activeOpacity={0.85}
          >
            <View className="w-11 h-11 rounded-2xl bg-emerald-50 justify-center items-center mb-3">
              <UserCheck size={20} color="#059669" />
            </View>
            <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>Inquiries</Text>
            <Text className="text-[10px] text-sage mt-0.5">1-on-1 Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 p-5 rounded-3xl border shadow-sm ${
              isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
            }`}
            onPress={() => router.push('/(tabs)/questions')}
            activeOpacity={0.85}
          >
            <View className="w-11 h-11 rounded-2xl bg-amber-50 justify-center items-center mb-3">
              <HelpCircle size={20} color="#D97706" />
            </View>
            <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>Fatwa Desk</Text>
            <Text className="text-[10px] text-sage mt-0.5">Answer Questions</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-row gap-3.5">
          <TouchableOpacity
            className={`flex-1 p-5 rounded-3xl border shadow-sm ${
              isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
            }`}
            onPress={() => router.push('/(tabs)/explore')}
            activeOpacity={0.85}
          >
            <View className="w-11 h-11 rounded-2xl bg-sky-soft justify-center items-center mb-3">
              <BookOpen size={20} color={Colors.royalBlue} />
            </View>
            <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>Browse Classes</Text>
            <Text className="text-[10px] text-sage mt-0.5">Madrassa & Tajweed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 p-5 rounded-3xl border shadow-sm ${
              isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
            }`}
            onPress={() => router.push('/(tabs)/explore')}
            activeOpacity={0.85}
          >
            <View className="w-11 h-11 rounded-2xl bg-emerald-50 justify-center items-center mb-3">
              <UserCheck size={20} color="#059669" />
            </View>
            <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>1-on-1 Sheikh</Text>
            <Text className="text-[10px] text-sage mt-0.5">Private Guidance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 p-5 rounded-3xl border shadow-sm ${
              isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
            }`}
            onPress={() => router.push('/(tabs)/questions')}
            activeOpacity={0.85}
          >
            <View className="w-11 h-11 rounded-2xl bg-amber-50 justify-center items-center mb-3">
              <HelpCircle size={20} color="#D97706" />
            </View>
            <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>Ask Scholar</Text>
            <Text className="text-[10px] text-sage mt-0.5">Verified Fatwa</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

