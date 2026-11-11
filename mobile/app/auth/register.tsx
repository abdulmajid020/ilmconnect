import { useRouter } from 'expo-router';
import { ArrowRight, Lock, Mail, Phone, User as UserIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthService } from '../../src/services';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { isDark } = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleRegister() {
    if (!fullName || !password) {
      setErrorMessage('Please enter your full name and password');
      return;
    }
    if (!email && !phoneNumber) {
      setErrorMessage('Please provide either an email or phone number in Ghana');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await AuthService.register({
        full_name: fullName,
        email: email || undefined,
        phone_number: phoneNumber || undefined,
        password,
        gender,
        country: 'Ghana',
        preferred_language: 'English',
      });

      await login(res.token, res.user);
      router.replace('/onboarding');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-amoled-bg' : 'bg-slate-50'}`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(350)} className="items-center mb-6">
            <View className="bg-sky-soft px-3 py-1 rounded-lg mb-2.5">
              <Text className="text-[10px] font-extrabold text-royal tracking-wider">
                GHANA LEARNER REGISTRATION
              </Text>
            </View>
            <Text className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-charcoal'}`}>
              Join IlmConnect
            </Text>
            <Text className={`text-xs mt-1 text-center leading-5 ${isDark ? 'text-slate-400' : 'text-sage'}`}>
              Begin your structured Islamic learning journey under verified scholars
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(100).duration(350)}
            className={`rounded-3xl p-6 border shadow-sm ${
              isDark ? 'bg-amoled-card border-amoled-border' : 'bg-white border-slate-200'
            }`}
          >
            {errorMessage ? (
              <View className="bg-red-50 p-3 rounded-xl mb-4 border border-red-200">
                <Text className="text-red-600 text-xs font-bold">{errorMessage}</Text>
              </View>
            ) : null}

            {/* Full Name */}
            <View className="mb-3.5">
              <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Full Name
              </Text>
              <View
                className={`flex-row items-center border rounded-2xl px-4 h-12 ${
                  isDark ? 'bg-amoled-bg border-amoled-border' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <UserIcon size={18} color={isDark ? '#94A3B8' : Colors.sage} className="mr-2.5" />
                <TextInput
                  className={`flex-1 text-sm font-semibold ${isDark ? 'text-white' : 'text-charcoal'}`}
                  placeholder="e.g. Ibrahim Danlad"
                  placeholderTextColor={isDark ? '#64748B' : Colors.sage}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Email */}
            <View className="mb-3.5">
              <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Email Address
              </Text>
              <View
                className={`flex-row items-center border rounded-2xl px-4 h-12 ${
                  isDark ? 'bg-amoled-bg border-amoled-border' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Mail size={18} color={isDark ? '#94A3B8' : Colors.sage} className="mr-2.5" />
                <TextInput
                  className={`flex-1 text-sm font-semibold ${isDark ? 'text-white' : 'text-charcoal'}`}
                  placeholder="name@example.com"
                  placeholderTextColor={isDark ? '#64748B' : Colors.sage}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Phone Number */}
            <View className="mb-3.5">
              <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Ghana Phone (Optional)
              </Text>
              <View
                className={`flex-row items-center border rounded-2xl px-4 h-12 ${
                  isDark ? 'bg-amoled-bg border-amoled-border' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Phone size={18} color={isDark ? '#94A3B8' : Colors.sage} className="mr-2.5" />
                <TextInput
                  className={`flex-1 text-sm font-semibold ${isDark ? 'text-white' : 'text-charcoal'}`}
                  placeholder="024 XXX XXXX"
                  placeholderTextColor={isDark ? '#64748B' : Colors.sage}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>
            </View>

            {/* Gender Selection */}
            <View className="mb-3.5">
              <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Gender (For Teacher Preference)
              </Text>
              <View className="flex-row gap-2.5">
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-2xl border-2 items-center ${
                    gender === 'MALE'
                      ? 'border-royal bg-sky-soft/40'
                      : isDark
                      ? 'border-amoled-border bg-amoled-bg'
                      : 'border-slate-200 bg-transparent'
                  }`}
                  onPress={() => setGender('MALE')}
                  activeOpacity={0.8}
                >
                  <Text className={`text-xs font-bold ${gender === 'MALE' ? 'text-royal' : isDark ? 'text-slate-400' : 'text-sage'}`}>
                    Brother (Male)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 py-3 rounded-2xl border-2 items-center ${
                    gender === 'FEMALE'
                      ? 'border-royal bg-sky-soft/40'
                      : isDark
                      ? 'border-amoled-border bg-amoled-bg'
                      : 'border-slate-200 bg-transparent'
                  }`}
                  onPress={() => setGender('FEMALE')}
                  activeOpacity={0.8}
                >
                  <Text className={`text-xs font-bold ${gender === 'FEMALE' ? 'text-royal' : isDark ? 'text-slate-400' : 'text-sage'}`}>
                    Sister (Female)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Password */}
            <View className="mb-3.5">
              <Text className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Password
              </Text>
              <View
                className={`flex-row items-center border rounded-2xl px-4 h-12 ${
                  isDark ? 'bg-amoled-bg border-amoled-border' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Lock size={18} color={isDark ? '#94A3B8' : Colors.sage} className="mr-2.5" />
                <TextInput
                  className={`flex-1 text-sm font-semibold ${isDark ? 'text-white' : 'text-charcoal'}`}
                  placeholder="••••••••"
                  placeholderTextColor={isDark ? '#64748B' : Colors.sage}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              className="bg-royal rounded-2xl h-12 justify-center items-center mt-2.5 shadow-sm"
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Text className="text-white text-sm font-extrabold">Create Account & Continue</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          <View className="flex-row justify-center items-center mt-5">
            <Text className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-sage'}`}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text className="text-royal font-extrabold text-xs">Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
