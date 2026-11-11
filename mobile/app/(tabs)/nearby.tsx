import React from 'react';
import { View } from 'react-native';
import { NearbySegmentView } from '../../src/components/explore/NearbySegmentView';
import { useTheme } from '../../src/context/ThemeContext';

export default function NearbyScreen() {
  const { isDark } = useTheme();

  return (
    <View className={`flex-1 ${isDark ? 'bg-amoled-bg' : 'bg-slate-50'}`}>
      <NearbySegmentView isDark={isDark} />
    </View>
  );
}
