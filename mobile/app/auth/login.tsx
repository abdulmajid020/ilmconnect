import { useRouter } from 'expo-router';
import { ArrowRight, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthService } from '../../src/services';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleLogin() {
    if (!email || !password) {
      setErrorMessage('Please enter both your email/phone and password');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await AuthService.login({ email, password });
      await login(res.token, res.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
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
          {/* Top Brand Header */}
          <Animated.View entering={FadeInDown.duration(350)} className="items-center mb-7">
            <View className="w-16 h-16 rounded-2xl bg-sky-primary justify-center items-center mb-4 shadow-lg shadow-sky-primary/40">
              <Text className="text-3xl text-white font-bold">عِلْم</Text>
            </View>
            <Text className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-charcoal'}`}>
              Welcome Back
            </Text>
            <Text className={`text-xs mt-1.5 text-center leading-5 ${isDark ? 'text-slate-400' : 'text-sage'}`}>
              Sign in to resume your structured Islamic studies in Ghana
            </Text>
          </Animated.View>
          
          {/* Form Card */}
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

            <View className="mb-4">
              <Text className={`text-xs font-bold mb-2 ${isDark ? 'text-white' : 'text-charcoal'}`}>
                Email Address or Phone
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

            <View className="mb-4">
              <Text className={`text-xs font-bold mb-2 ${isDark ? 'text-white' : 'text-charcoal'}`}>
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

            {/* Main Sign In Button */}
            <TouchableOpacity
              className="bg-royal rounded-2xl h-12 justify-center items-center mt-2 shadow-sm"
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Text className="text-white text-sm font-extrabold">Sign In</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Footer to Register */}
          <View className="flex-row justify-center items-center mt-6">
            <Text className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-sage'}`}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text className="text-royal font-extrabold text-xs">Register here</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
