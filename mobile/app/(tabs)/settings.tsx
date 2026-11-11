import { useRouter } from 'expo-router';
import { ChevronRight, GraduationCap, Info, LogOut, Moon, Scale, Share2, Shield, Smartphone, Star, Sun } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, RefreshControl, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../../src/api/client';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isDark, mode, setMode } = useTheme();

  const [profile, setProfile] = useState<any | null>(null);
  const [diagnosticsModal, setDiagnosticsModal] = useState(false);
  const [latency, setLatency] = useState<string>('Testing...');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch {
      setProfile(null);
    }
  }

  async function runDiagnostics() {
    setDiagnosticsModal(true);
    setLatency('Pinging backend...');
    const start = Date.now();
    try {
      await api.searchTeachers();
      const elapsed = Date.now() - start;
      setLatency(`${elapsed}ms (Connected ✅)`);
    } catch {
      setLatency('Offline / Server Unreachable');
    }
  }

  async function handleShareApp() {
    try {
      await Share.share({
        title: 'IlmConnect Ghana',
        message:
          'Join IlmConnect – Structured Islamic Education with verified Ghanaian Scholars & 1-on-1 Mentorship 🇬🇭📖\nDownload: https://ilmconnect.app',
      });
    } catch (err) {
      console.log('Error sharing:', err);
    }
  }

  function handleRateApp() {
    Alert.alert(
      '⭐ Rate IlmConnect',
      'Enjoying your learning journey? Your 5-star review helps brothers and sisters in Ghana discover qualified Islamic knowledge.',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Leave Review', onPress: () => Alert.alert('Jazakum Allahu Khairan', 'Thank you for supporting IlmConnect!') },
      ]
    );
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to log out of IlmConnect?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
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
            await loadProfile();
            setRefreshing(false);
          }}
          tintColor={Colors.skyPrimary}
        />
      }
    >
      {/* 1. One UI Top Banner / Profile Header with Generous Padding */}
      <Animated.View
        entering={FadeInDown.duration(350)}
        className={`rounded-3xl p-6 border mb-5 shadow-sm ${
          isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
        }`}
      >
        <View className="flex-row items-center">
          <View className="w-16 h-16 rounded-2xl bg-sky-primary justify-center items-center shadow-sm">
            <Text className="text-white text-2xl font-bold">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View className="flex-1 ml-4">
            <Text className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-charcoal'}`}>
              {user?.full_name || 'Student of Knowledge'}
            </Text>
            <Text className="text-xs text-sage mt-0.5 font-medium">
              {user?.email || user?.phone_number || 'Ghanaian Learner'}
            </Text>
            <View className="self-start bg-sky-soft px-2.5 py-0.5 rounded-md mt-1.5">
              <Text className="text-[9px] font-bold text-royal tracking-wide">
                {user?.roles?.includes('TEACHER') ? 'QUALIFIED SCHOLAR' : 'ACTIVE LEARNER'}
              </Text>
            </View>
          </View>
        </View>

        {/* Learning / Teaching Stats */}
        <View className={`h-px my-5 ${isDark ? 'bg-amoled-border' : 'bg-slate-100'}`} />
        <View className="flex-row items-center justify-around">
          <View className="items-center">
            <Text className="text-xs font-semibold text-sage">{user?.roles?.includes('TEACHER') ? 'Role' : 'Level'}</Text>
            <Text className="text-xs font-bold text-sky-primary mt-0.5">
              {user?.roles?.includes('TEACHER') ? 'Sheikh' : (profile?.knowledge_level || 'Beginner')}
            </Text>
          </View>
          <View className={`w-px h-8 ${isDark ? 'bg-amoled-border' : 'bg-slate-100'}`} />
          <View className="items-center">
            <Text className="text-xs font-semibold text-sage">Region</Text>
            <Text className={`text-xs font-bold mt-0.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>Ghana 🇬🇭</Text>
          </View>
          <View className={`w-px h-8 ${isDark ? 'bg-amoled-border' : 'bg-slate-100'}`} />
          <View className="items-center">
            <Text className="text-xs font-semibold text-sage">Status</Text>
            <Text className={`text-xs font-bold mt-0.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
              {user?.roles?.includes('TEACHER') ? 'Accepting Students' : 'Enrolled'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* 2. AMOLED Dark Mode Switcher */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(350)}
        className={`rounded-3xl p-6 border mb-5 shadow-sm ${
          isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
        }`}
      >
        <View className="flex-row items-center gap-2 mb-1.5">
          <Moon size={18} color={Colors.skyPrimary} />
          <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
            Appearance & Theme
          </Text>
        </View>

        <Text className="text-xs text-sage mb-4 leading-5">
          Toggle pure AMOLED dark mode for deep contrast and battery savings.
        </Text>

        <View className="flex-row gap-2.5">
          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-2xl border-2 ${
              mode === 'light'
                ? 'border-royal bg-sky-soft/40'
                : isDark
                ? 'border-amoled-border bg-transparent'
                : 'border-slate-200 bg-transparent'
            }`}
            onPress={() => setMode('light')}
          >
            <Sun size={18} color={mode === 'light' ? Colors.royalBlue : Colors.sage} />
            <Text
              className={`text-xs font-bold ${
                mode === 'light' ? 'text-royal' : isDark ? 'text-slate-400' : 'text-sage'
              }`}
            >
              Light
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-2xl border-2 ${
              mode === 'dark'
                ? 'border-sky-400 bg-slate-900'
                : isDark
                ? 'border-amoled-border bg-transparent'
                : 'border-slate-200 bg-transparent'
            }`}
            onPress={() => setMode('dark')}
          >
            <Moon size={18} color={mode === 'dark' ? '#38BDF8' : Colors.sage} />
            <Text
              className={`text-xs font-bold ${
                mode === 'dark' ? 'text-sky-400' : isDark ? 'text-slate-400' : 'text-sage'
              }`}
            >
              AMOLED
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-2xl border-2 ${
              mode === 'system'
                ? 'border-royal bg-sky-soft/40'
                : isDark
                ? 'border-amoled-border bg-transparent'
                : 'border-slate-200 bg-transparent'
            }`}
            onPress={() => setMode('system')}
          >
            <Smartphone size={18} color={mode === 'system' ? Colors.royalBlue : Colors.sage} />
            <Text
              className={`text-xs font-bold ${
                mode === 'system' ? 'text-royal' : isDark ? 'text-slate-400' : 'text-sage'
              }`}
            >
              System
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* 3. Qualified Scholar Portal Banner */}
      <Animated.View entering={FadeInDown.delay(150).duration(350)}>
        <TouchableOpacity
          className="flex-row items-center bg-royal rounded-3xl p-5 gap-3.5 mb-5 shadow-sm"
          onPress={() =>
            Alert.alert(
              'Scholar Application',
              'To teach Madrassa classes or provide 1-on-1 mentorship, submit your Islamic degree (Madinah, Azhar, or Ghana Markaz) on the Web Admin portal at http://192.168.100.52:3000.'
            )
          }
          activeOpacity={0.9}
        >
          <View className="w-12 h-12 rounded-2xl bg-white/20 justify-center items-center">
            <GraduationCap size={24} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-sm font-bold">Are you a Ghanaian Scholar?</Text>
            <Text className="text-sky-100 text-xs mt-0.5 leading-5">
              Join our verified teaching faculty & instruct registered classes.
            </Text>
          </View>
          <ChevronRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* 4. About IlmConnect & Legal Settings with Generous Padding */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(350)}
        className={`rounded-3xl p-6 border mb-5 shadow-sm ${
          isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
        }`}
      >
        <View className="flex-row items-center gap-2 mb-3">
          <Info size={18} color={Colors.skyPrimary} />
          <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
            About IlmConnect
          </Text>
        </View>

        {/* About App item */}
        <TouchableOpacity
          className="flex-row items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800"
          onPress={() =>
            Alert.alert(
              'About IlmConnect',
              'IlmConnect (عِلْم) connects Ghanaian Muslim learners with verified Islamic scholars for structured 1-on-1 Qur\'an recitation, Tajweed, and group Madrassa classes.\n\n• Version: 1.0.0 (One UI Edition)\n• Typography: Samsung One UI Sans\n• Region: Ghana 🇬🇭\n• Backend: Chi REST API + PostgreSQL\n• Capacity Lock: 20 seats/class\n\nCrafted with dedication for the Ghanaian Ummah.'
            )
          }
        >
          <View className="flex-row items-center gap-3.5">
            <View className={`w-9 h-9 rounded-xl justify-center items-center ${isDark ? 'bg-slate-800' : 'bg-mint'}`}>
              <Info size={16} color={Colors.skyPrimary} />
            </View>
            <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>About IlmConnect</Text>
          </View>
          <ChevronRight size={16} color={Colors.sage} />
        </TouchableOpacity>

        {/* Privacy Policy */}
        <TouchableOpacity
          className="flex-row items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800"
          onPress={() =>
            Alert.alert(
              'Privacy Policy (Act 843 Compliant)',
              'IlmConnect complies strictly with Ghana Data Protection Act 2012 (Act 843).\n\n• We collect user email, phone number, and learning preferences solely for teacher matching and class notifications.\n• Your passwords are cryptographic bcrypt hashes.\n• We never sell or share student data with third parties.\n• You may request complete account erasure at any time.'
            )
          }
        >
          <View className="flex-row items-center gap-3.5">
            <View className={`w-9 h-9 rounded-xl justify-center items-center ${isDark ? 'bg-slate-800' : 'bg-mint'}`}>
              <Shield size={16} color={Colors.skyPrimary} />
            </View>
            <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>Privacy Policy</Text>
          </View>
          <ChevronRight size={16} color={Colors.sage} />
        </TouchableOpacity>

        {/* Legal Notice */}
        <TouchableOpacity
          className="flex-row items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800"
          onPress={() =>
            Alert.alert(
              'Legal Notice',
              'IlmConnect operates in the Republic of Ghana as a digital Islamic educational platform.\n\nAll scholarly opinions and fatwas expressed on the Q&A board are verified by recognized local scholars adhering to Ahlus Sunnah wal Jama\'ah.\n\nContact: legal@ilmconnect.app'
            )
          }
        >
          <View className="flex-row items-center gap-3.5">
            <View className={`w-9 h-9 rounded-xl justify-center items-center ${isDark ? 'bg-slate-800' : 'bg-mint'}`}>
              <Scale size={16} color={Colors.skyPrimary} />
            </View>
            <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>Legal Notice</Text>
          </View>
          <ChevronRight size={16} color={Colors.sage} />
        </TouchableOpacity>

        {/* Diagnostics */}
        <TouchableOpacity
          className="flex-row items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800"
          onPress={runDiagnostics}
        >
          <View className="flex-row items-center gap-3.5">
            <View className={`w-9 h-9 rounded-xl justify-center items-center ${isDark ? 'bg-slate-800' : 'bg-mint'}`}>
              <Smartphone size={16} color={Colors.skyPrimary} />
            </View>
            <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>Diagnostics & Network</Text>
          </View>
          <ChevronRight size={16} color={Colors.sage} />
        </TouchableOpacity>

        {/* Rate App */}
        <TouchableOpacity
          className="flex-row items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800"
          onPress={handleRateApp}
        >
          <View className="flex-row items-center gap-3.5">
            <View className={`w-9 h-9 rounded-xl justify-center items-center ${isDark ? 'bg-slate-800' : 'bg-mint'}`}>
              <Star size={16} color={Colors.warning} />
            </View>
            <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>Rate App</Text>
          </View>
          <ChevronRight size={16} color={Colors.sage} />
        </TouchableOpacity>

        {/* Share App */}
        <TouchableOpacity
          className="flex-row items-center justify-between py-4"
          onPress={handleShareApp}
        >
          <View className="flex-row items-center gap-3.5">
            <View className={`w-9 h-9 rounded-xl justify-center items-center ${isDark ? 'bg-slate-800' : 'bg-mint'}`}>
              <Share2 size={16} color={Colors.royalBlue} />
            </View>
            <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>Share IlmConnect</Text>
          </View>
          <ChevronRight size={16} color={Colors.sage} />
        </TouchableOpacity>
      </Animated.View>

      {/* 5. Sign Out Button */}
      <Animated.View entering={FadeInDown.delay(250).duration(350)}>
        <TouchableOpacity
          className={`flex-row items-center justify-center gap-2 h-14 rounded-2xl mt-1 ${
            isDark ? 'bg-red-950/30 border border-red-900' : 'bg-red-50 border border-red-100'
          }`}
          onPress={handleSignOut}
          activeOpacity={0.85}
        >
          <LogOut size={18} color={Colors.danger} />
          <Text className="text-red-600 text-sm font-bold">Sign Out of IlmConnect</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Diagnostics Modal */}
      <Modal visible={diagnosticsModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center p-6">
          <View className={`w-full rounded-3xl p-6 border ${isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'}`}>
            <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-charcoal'}`}>
              System Diagnostics
            </Text>

            <View className="flex-row justify-between py-2.5 border-b border-slate-100 dark:border-slate-800">
              <Text className="text-xs font-semibold text-sage">Platform:</Text>
              <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                {Platform.OS} {Platform.Version}
              </Text>
            </View>
            <View className="flex-row justify-between py-2.5 border-b border-slate-100 dark:border-slate-800">
              <Text className="text-xs font-semibold text-sage">Expo SDK:</Text>
              <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>58.0.30</Text>
            </View>
            <View className="flex-row justify-between py-2.5 border-b border-slate-100 dark:border-slate-800">
              <Text className="text-xs font-semibold text-sage">Typography:</Text>
              <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>Samsung One UI Sans</Text>
            </View>
            <View className="flex-row justify-between py-2.5 border-b border-slate-100 dark:border-slate-800">
              <Text className="text-xs font-semibold text-sage">API Latency:</Text>
              <Text className="text-xs font-bold text-sky-primary">{latency}</Text>
            </View>
            <View className="flex-row justify-between py-2.5 border-b border-slate-100 dark:border-slate-800">
              <Text className="text-xs font-semibold text-sage">Styling Engine:</Text>
              <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-charcoal'}`}>Pure NativeWind</Text>
            </View>

            <TouchableOpacity
              className="mt-6 bg-sky-primary h-12 rounded-2xl justify-center items-center shadow-sm"
              onPress={() => setDiagnosticsModal(false)}
            >
              <Text className="text-white font-bold text-sm">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
