import AsyncStorage from '@react-native-async-storage/async-storage';

const MEAL_ENTRIES_KEY = '@meal_entries';
const USER_GOALS_KEY = '@user_goals';

export const saveMealEntry = async (mealEntry) => {
  try {
    const existingEntriesJson = await AsyncStorage.getItem(MEAL_ENTRIES_KEY);
    const existingEntries = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];

    const newEntry = {
      ...mealEntry,
      id: mealEntry.id || Date.now().toString(),
    };

    const entryIndex = existingEntries.findIndex(entry => entry.id === newEntry.id);
    
    if (entryIndex !== -1) {
      existingEntries[entryIndex] = newEntry;
    } else {
      existingEntries.push(newEntry);
    }

    await AsyncStorage.setItem(MEAL_ENTRIES_KEY, JSON.stringify(existingEntries));

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

export const deleteMealEntry = async (mealId) => {
  try {
    const existingEntriesJson = await AsyncStorage.getItem(MEAL_ENTRIES_KEY);
    const existingEntries = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];
    
    const updatedEntries = existingEntries.filter(entry => entry.id !== mealId);
    
    await AsyncStorage.setItem(MEAL_ENTRIES_KEY, JSON.stringify(updatedEntries));
    
    return true;
  } catch (error) {
    console.error('Error deleting meal entry:', error);
    return false;
  }
};

export const saveUserGoals = async (goals) => {
  try {
    await AsyncStorage.setItem(USER_GOALS_KEY, JSON.stringify(goals));
    return true;
  } catch (error) {
    console.error('Error saving user goals:', error);
    return false;
  }
};

export const getUserGoals = async () => {
  try {
    const goalsJson = await AsyncStorage.getItem(USER_GOALS_KEY);
    
    const defaultGoals = {
      calorieTarget: 2000,
      proteinTarget: 80,
      carbTarget: 250,
      fatTarget: 70,
    };
    
    return goalsJson ? JSON.parse(goalsJson) : defaultGoals;
  } catch (error) {
    console.error('Error getting user goals:', error);
    return {
      calorieTarget: 2000,
      proteinTarget: 80,
      carbTarget: 250,
      fatTarget: 70,
    };
  }
};

export const calculateDailyNutrition = async (date) => {
  try {
    const dateString = date ? new Date(date).toDateString() : new Date().toDateString();
    const meals = await getMealEntries();
    const todayMeals = meals.filter(meal => new Date(meal.timestamp).toDateString() === dateString);
    
    const nutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };
    
    todayMeals.forEach(meal => {
      nutrition.calories += meal.calories || 0;
      nutrition.protein += meal.protein || 0;
      nutrition.carbs += meal.carbs || 0;
      nutrition.fat += meal.fat || 0;
    });
    
    const goals = await getUserGoals();
    
    return {
      ...nutrition,
      proteinPercentage: Math.round((nutrition.protein / goals.proteinTarget) * 100),
      carbsPercentage: Math.round((nutrition.carbs / goals.carbTarget) * 100),
      fatPercentage: Math.round((nutrition.fat / goals.fatTarget) * 100),
    };
  } catch (error) {
    console.error('Error calculating daily nutrition:', error);
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      proteinPercentage: 0,
      carbsPercentage: 0,
      fatPercentage: 0,
    };
  }
};