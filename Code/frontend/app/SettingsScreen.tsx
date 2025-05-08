import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from './ThemeContext';

// Setting keys
const NOTIFICATIONS_KEY = '@settings_notifications';
const MEASUREMENT_UNIT_KEY = '@settings_measurement_unit';

interface SettingsScreenProps {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [measurementUnit, setMeasurementUnit] = useState('metric'); // 'metric' or 'imperial'

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load notifications setting
      const notificationsSetting = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      if (notificationsSetting !== null) {
        setNotifications(JSON.parse(notificationsSetting));
      }
      
      // Load measurement unit setting
      const unitSetting = await AsyncStorage.getItem(MEASUREMENT_UNIT_KEY);
      if (unitSetting !== null) {
        setMeasurementUnit(unitSetting);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
      await AsyncStorage.setItem(MEASUREMENT_UNIT_KEY, measurementUnit);
      
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const toggleNotifications = (value: boolean) => {
    setNotifications(value);
  };

  const handleMeasurementUnitChange = (unit: string) => {
    setMeasurementUnit(unit);
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your meal entries and reset your goals. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Data', 
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All data has been cleared. The app will now restart.');
              onBack();
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          },
          style: 'destructive' 
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Appearance Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon-outline" size={24} color={theme.textSecondary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#ccc', true: '#A5D6A7' }}
              thumbColor={isDarkMode ? theme.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={24} color={theme.textSecondary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>Enable Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#ccc', true: '#A5D6A7' }}
              thumbColor={notifications ? theme.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Units Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Measurement Units</Text>
          
          <View style={styles.unitOptions}>
            <TouchableOpacity
              style={[
                styles.unitOption,
                { backgroundColor: theme.placeholder },
                measurementUnit === 'metric' && [styles.selectedUnitOption, { borderColor: theme.primary, backgroundColor: isDarkMode ? '#2D3B2D' : '#E8F5E9' }]
              ]}
              onPress={() => handleMeasurementUnitChange('metric')}
            >
              <Text style={[
                styles.unitText,
                { color: theme.textSecondary },
                measurementUnit === 'metric' && [styles.selectedUnitText, { color: theme.primary }]
              ]}>
                Metric (g, kg)
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.unitOption,
                { backgroundColor: theme.placeholder },
                measurementUnit === 'imperial' && [styles.selectedUnitOption, { borderColor: theme.primary, backgroundColor: isDarkMode ? '#2D3B2D' : '#E8F5E9' }]
              ]}
              onPress={() => handleMeasurementUnitChange('imperial')}
            >
              <Text style={[
                styles.unitText,
                { color: theme.textSecondary },
                measurementUnit === 'imperial' && [styles.selectedUnitText, { color: theme.primary }]
              ]}>
                Imperial (oz, lb)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Management Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Management</Text>
          
          <TouchableOpacity style={styles.dangerButton} onPress={clearAllData}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.dangerButtonText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  unitOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unitOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedUnitOption: {
    borderWidth: 1,
  },
  unitText: {
    fontWeight: '500',
  },
  selectedUnitText: {
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#E53935',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
  }
});