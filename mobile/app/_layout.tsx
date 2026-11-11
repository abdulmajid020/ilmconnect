import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';

// Ignore React Native 0.88 internal deprecation warning triggered by third-party navigation packages
LogBox.ignoreLogs(['ImageBackground is deprecated']);

function RootNavigator() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
          headerTintColor: isDark ? '#FFFFFF' : '#000000',
          headerTitleStyle: {
            fontFamily: 'OneUISans-Bold',
            color: isDark ? '#FFFFFF' : '#000000',
          },
          contentStyle: { backgroundColor: isDark ? '#000000' : '#FAF9F5' },
          headerShadowVisible: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'OneUISans': require('../assets/fonts/OneUISans-Regular.ttf'),
    'OneUISans-Bold': require('../assets/fonts/OneUISans-Bold.ttf'),
    'SFProDisplay-Bold': require('../assets/fonts/SFProDisplay-Bold.otf'),
    'SFProDisplay-Medium': require('../assets/fonts/SFProDisplay-Medium.otf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF9F5' }}>
        <ActivityIndicator size="large" color="#1993FA" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
