import { Tabs } from 'expo-router';
import { BookOpen, Compass, GraduationCap, HelpCircle, Home, Settings, Users } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';

export default function TabsLayout() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const isTeacher = Array.isArray(user?.roles) && user.roles.includes('TEACHER');

  // Senior Mobile Engineering standard:
  // Docked native tab bar with hardware/gesture insets, crisp border, and no floating clipping hacks.
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 20 : 10);
  const tabHeight = 58 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
        },
        headerTintColor: isDark ? '#FFFFFF' : '#000000',
        headerTitleStyle: {
          fontFamily: 'OneUISans-Bold',
          fontSize: 18,
          color: isDark ? '#FFFFFF' : '#000000',
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#0A121D' : '#FFFFFF',
          borderTopColor: isDark ? '#1E293B' : '#E2E8F0',
          borderTopWidth: 1,
          height: tabHeight,
          paddingTop: 8,
          paddingBottom: bottomInset,
          elevation: 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDark ? 0.35 : 0.06,
          shadowRadius: 6,
        },
        tabBarActiveTintColor: Colors.skyPrimary,
        tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
        tabBarLabelStyle: {
          fontFamily: 'OneUISans',
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {/* 1. HOME TAB (Adapts for Student vs Teacher Portal) */}
      <Tabs.Screen
        name="index"
        options={{
          title: isTeacher ? 'Portal' : 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Home size={22} color={color} strokeWidth={2.2} />,
        }}
      />

      {/* 2. STUDENT: EXPLORE CLASSES & SCHOLARS + NEARBY (Hidden for Teachers) */}
      <Tabs.Screen
        name="explore"
        options={{
          href: isTeacher ? null : undefined,
          title: 'Explore',
          headerTitle: 'Explore',
          headerShown: true,
          tabBarIcon: ({ color, size }) => <Compass size={22} color={color} strokeWidth={2.2} />,
        }}
      />

      {/* Nearby is embedded inside Explore — hidden from navbar */}
      <Tabs.Screen
        name="nearby"
        options={{ href: null }}
      />

      {/* 3. TEACHER: MY CLASSES & LIVE TEACHING (Hidden for Students) */}
      <Tabs.Screen
        name="teaching"
        options={{
          href: isTeacher ? undefined : null,
          title: 'Teaching',
          headerTitle: 'My Teaching Circle',
          tabBarIcon: ({ color, size }) => <GraduationCap size={22} color={color} strokeWidth={2.2} />,
        }}
      />

      {/* 4. STUDENT: MY LEARNING HUB (Hidden for Teachers) */}
      <Tabs.Screen
        name="learning"
        options={{
          href: isTeacher ? null : undefined,
          title: 'My Learning',
          headerTitle: 'My Learning Hub',
          tabBarIcon: ({ color, size }) => <BookOpen size={22} color={color} strokeWidth={2.2} />,
        }}
      />

      {/* 5. TEACHER: 1-ON-1 GUIDANCE REQUESTS (Hidden for Students) */}
      <Tabs.Screen
        name="requests"
        options={{
          href: isTeacher ? undefined : null,
          title: 'Requests',
          headerTitle: 'Student Inquiries',
          tabBarIcon: ({ color, size }) => <Users size={22} color={color} strokeWidth={2.2} />,
        }}
      />

      {/* 6. FATWA & Q&A BOARD (Adapts title for Teacher vs Student) */}
      <Tabs.Screen
        name="questions"
        options={{
          title: isTeacher ? 'Fatwa Desk' : 'Fatwa & Q&A',
          headerTitle: isTeacher ? 'Scholarly Fatwa Desk' : 'Verified Q&A Board',
          tabBarIcon: ({ color, size }) => <HelpCircle size={22} color={color} strokeWidth={2.2} />,
        }}
      />

      {/* 7. SETTINGS */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: isTeacher ? 'Sheikh Settings' : 'Settings & About',
          tabBarIcon: ({ color, size }) => <Settings size={22} color={color} strokeWidth={2.2} />,
        }}
      />

      {/* Deprecated profile route redirect */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
