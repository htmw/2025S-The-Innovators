import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      {/* Your main app content would go here */}
      <StatusBar style="auto" />
    </View>
  );
}