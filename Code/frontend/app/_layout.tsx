import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './ThemeContext';

function RootLayoutNavigator() {
  const { isDarkMode } = useTheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="MealHistory" />
        <Stack.Screen name="WeeklyProgressReport" />
        <Stack.Screen name="SettingsScreen" />
      </Stack>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNavigator />
    </ThemeProvider>
  );
}