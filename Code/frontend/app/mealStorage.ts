// mealStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const MEAL_ENTRIES_KEY = '@meal_entries';

export const saveMealEntry = async (mealEntry) => {
  try {
    // Get existing entries
    const existingEntriesJson = await AsyncStorage.getItem(MEAL_ENTRIES_KEY);
    const existingEntries = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];

    // Add new entry
    const updatedEntries = [...existingEntries, mealEntry];

    // Save back to storage
    await AsyncStorage.setItem(MEAL_ENTRIES_KEY, JSON.stringify(updatedEntries));

    return true;
  } catch (error) {
    console.error('Error saving meal entry:', error);
    return false;
  }
};

export const getMealEntries = async () => {
  try {
    const entriesJson = await AsyncStorage.getItem(MEAL_ENTRIES_KEY);
    return entriesJson ? JSON.parse(entriesJson) : [];
  } catch (error) {
    console.error('Error getting meal entries:', error);
    return [];
  }
};