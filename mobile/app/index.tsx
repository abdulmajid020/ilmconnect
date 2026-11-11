import { Redirect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Colors } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';

export default function IndexScreen() {
  const { user, isLoading } = useAuth();
  const { isDark } = useTheme();

  if (isLoading) {
    return (
      <View className={`flex-1 justify-center items-center p-6 ${isDark ? 'bg-amoled-bg' : 'bg-slate-50'}`}>
        <Animated.View
          entering={ZoomIn.duration(400)}
          className="w-22 h-22 rounded-3xl bg-sky-primary justify-center items-center mb-5 shadow-lg"
        >
          <Text className="text-4xl text-white font-bold">عِلْم</Text>
        </Animated.View>
        <Animated.Text
          entering={FadeIn.delay(150).duration(300)}
          className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-charcoal'}`}
        >
          IlmConnect
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(250).duration(300)}
          className={`text-xs font-semibold mt-1.5 ${isDark ? 'text-slate-400' : 'text-sage'}`}
        >
          Structured Islamic Education for Ghana 🇬🇭
        </Animated.Text>
        <ActivityIndicator size="large" color={Colors.skyPrimary} className="mt-7" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth/login" />;
}
