import { Redirect } from 'expo-router';
import React from 'react';

export default function ProfileRedirect() {
  return <Redirect href="/(tabs)/settings" />;
}
