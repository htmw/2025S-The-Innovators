import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMealEntries, calculateDailyNutrition, getUserGoals } from './mealStorage';
import { useTheme } from './ThemeContext';

interface WeeklyProgressProps {
  onBack: () => void;
}

interface DayData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorieGoalPercentage: number;
  hasEntries: boolean; // Added to track if there are entries for this day
}

export default function WeeklyProgressReport({ onBack }: WeeklyProgressProps) {
  const { theme, isDarkMode } = useTheme();
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userGoals, setUserGoals] = useState({
    calorieTarget: 2000,
    proteinTarget: 80,
    carbTarget: 250,
    fatTarget: 70
  });

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    try {
      setLoading(true);
      
      // Load user goals
      const goals = await getUserGoals();
      setUserGoals(goals);
      
      // Generate past 7 days dates
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date);
      }
      
      // Get all meal entries
      const allMeals = await getMealEntries();
      
      // Get nutrition data for each day
      const weeklyData = [];
      for (const date of dates) {
        const dayNutrition = await calculateDailyNutrition(date);
        const dateString = date.toDateString();
        
        // Check if there are any entries for this day
        const hasMealsForDay = allMeals.some(meal => 
          new Date(meal.timestamp).toDateString() === dateString
        );
        
        weeklyData.push({
          date: dateString,
          calories: dayNutrition.calories,
          protein: dayNutrition.protein,
          carbs: dayNutrition.carbs,
          fat: dayNutrition.fat,
          calorieGoalPercentage: Math.round((dayNutrition.calories / goals.calorieTarget) * 100),
          hasEntries: hasMealsForDay // Track if the day has entries
        });
      }
      
      setWeekData(weeklyData);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const calculateWeeklyAverages = () => {
    if (weekData.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    // Filter days that have entries
    const daysWithEntries = weekData.filter(day => day.hasEntries);
    
    // If no days have entries, return zeros
    if (daysWithEntries.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    
    const totals = daysWithEntries.reduce((acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fat: acc.fat + day.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    // Divide by the number of days that actually have entries
    return {
      calories: Math.round(totals.calories / daysWithEntries.length),
      protein: Math.round(totals.protein / daysWithEntries.length),
      carbs: Math.round(totals.carbs / daysWithEntries.length),
      fat: Math.round(totals.fat / daysWithEntries.length)
    };
  };

  const averages = calculateWeeklyAverages();
  
  // Count days with entries for better reporting
  const daysWithEntries = weekData.filter(day => day.hasEntries).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Weekly Progress</Text>
        <TouchableOpacity onPress={loadWeeklyData}>
          <Ionicons name="refresh" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading weekly data...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Weekly Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>
              Weekly Average 
              <Text style={[styles.daysCount, { color: theme.textSecondary }]}>
                {daysWithEntries > 0 ? ` (${daysWithEntries} day${daysWithEntries > 1 ? 's' : ''})` : ''}
              </Text>
            </Text>
            <View style={styles.averagesRow}>
              <View style={styles.averageItem}>
                <Text style={[styles.averageValue, { color: theme.primary }]}>{averages.calories}</Text>
                <Text style={[styles.averageLabel, { color: theme.textSecondary }]}>Calories</Text>
              </View>
              <View style={styles.averageItem}>
                <Text style={[styles.averageValue, { color: theme.primary }]}>{averages.protein}g</Text>
                <Text style={[styles.averageLabel, { color: theme.textSecondary }]}>Protein</Text>
              </View>
              <View style={styles.averageItem}>
                <Text style={[styles.averageValue, { color: theme.primary }]}>{averages.carbs}g</Text>
                <Text style={[styles.averageLabel, { color: theme.textSecondary }]}>Carbs</Text>
              </View>
              <View style={styles.averageItem}>
                <Text style={[styles.averageValue, { color: theme.primary }]}>{averages.fat}g</Text>
                <Text style={[styles.averageLabel, { color: theme.textSecondary }]}>Fat</Text>
              </View>
            </View>
            {daysWithEntries > 0 ? (
              <Text style={[styles.comparisonText, { color: theme.textSecondary }]}>
                {averages.calories > userGoals.calorieTarget 
                  ? `${averages.calories - userGoals.calorieTarget} calories over your daily goal`
                  : `${userGoals.calorieTarget - averages.calories} calories under your daily goal`}
              </Text>
            ) : (
              <Text style={[styles.noDataText, { color: theme.textSecondary }]}>No meals logged this week</Text>
            )}
          </View>

          {/* Daily Progress Cards */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Breakdown</Text>
          
          {weekData.map((day, index) => (
            <View key={index} style={[styles.dayCard, { backgroundColor: theme.card }]}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayTitle, { color: theme.text }]}>{formatDate(day.date)}</Text>
                {day.hasEntries ? (
                  <Text style={[
                    styles.dayPercentage,
                    day.calorieGoalPercentage > 100 ? { color: theme.error } : { color: theme.primary }
                  ]}>
                    {day.calorieGoalPercentage}%
                  </Text>
                ) : (
                  <Text style={[styles.noEntriesText, { color: theme.textSecondary }]}>No entries</Text>
                )}
              </View>
              
              {day.hasEntries && (
                <View style={[styles.progressBarContainer, { backgroundColor: theme.placeholder }]}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${Math.min(day.calorieGoalPercentage, 100)}%` },
                      day.calorieGoalPercentage > 100 ? { backgroundColor: theme.error } : { backgroundColor: theme.primary }
                    ]} 
                  />
                </View>
              )}
              
              <View style={styles.dayMacros}>
                {day.hasEntries ? (
                  <>
                    <Text style={[styles.dayCalories, { color: theme.text }]}>{day.calories} kcal</Text>
                    <View style={styles.macrosRow}>
                      <Text style={[styles.macroText, { color: theme.textSecondary }]}>P: {day.protein}g</Text>
                      <Text style={[styles.macroText, { color: theme.textSecondary }]}>C: {day.carbs}g</Text>
                      <Text style={[styles.macroText, { color: theme.textSecondary }]}>F: {day.fat}g</Text>
                    </View>
                  </>
                ) : (
                  <Text style={[styles.noEntriesDetails, { color: theme.textSecondary }]}>Add meals to see nutrition data</Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  daysCount: {
    fontSize: 14,
    fontWeight: '400',
  },
  averagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  averageItem: {
    alignItems: 'center',
  },
  averageValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  averageLabel: {
    fontSize: 14,
  },
  comparisonText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  dayCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayPercentage: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  dayMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCalories: {
    fontSize: 16,
    fontWeight: '500',
  },
  macrosRow: {
    flexDirection: 'row',
  },
  macroText: {
    fontSize: 14,
    marginLeft: 12,
  },
  noEntriesText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  noEntriesDetails: {
    fontSize: 14,
    fontStyle: 'italic',
    flex: 1,
  }
});