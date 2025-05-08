import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: ThemeColors;
}

export interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  error: string;
  progressBar: string;
  placeholder: string;
}

const lightTheme: ThemeColors = {
  primary: '#2E7D32',
  background: '#FAFAFA',
  card: '#FFFFFF',
  text: '#1a1a1a',
  textSecondary: '#666666',
  border: '#EEEEEE',
  success: '#2E7D32',
  error: '#E53935',
  progressBar: '#F5F5F5',
  placeholder: '#F5F5F5',
};

const darkTheme: ThemeColors = {
  primary: '#4CAF50',
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  border: '#333333',
  success: '#4CAF50',
  error: '#F44336',
  progressBar: '#333333',
  placeholder: '#333333',
};

const DARK_MODE_KEY = '@settings_dark_mode';

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: lightTheme,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const darkModeSetting = await AsyncStorage.getItem(DARK_MODE_KEY);
      if (darkModeSetting !== null) {
        setIsDarkMode(JSON.parse(darkModeSetting));
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify(newMode));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        theme: isDarkMode ? darkTheme : lightTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);