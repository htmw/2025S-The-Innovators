import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
// Import with default exports
import ImageDetectionModal from '../ImageDetectionModal';
import { saveMealEntry, getMealEntries, calculateDailyNutrition, getUserGoals } from '../mealStorage';
import EditMealModal, { MealData } from '../EditMealModal'; // Changed to default importimport GoalSettingsModal, { UserGoals } from '../GoalSettingsModal';
import BarcodeScanner from '../BarcodeScanner';
import MealHistory from '../MealHistory';
import GoalSettingsModal from '../GoalSettingsModal'; // Fixed import for GoalSettingsModal
import { UserGoals } from '../GoalSettingsModal';

// Define TypeScript interfaces
interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
}

export default function HomeScreen() {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [isBarcodeModalVisible, setIsBarcodeModalVisible] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealData | null>(null);
  const [meals, setMeals] = useState<MealData[]>([]);
  const [todayMeals, setTodayMeals] = useState<MealData[]>([]);
  const [loading, setLoading] = useState(true);
  const [nutrition, setNutrition] = useState<NutritionData>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    proteinPercentage: 0,
    carbsPercentage: 0,
    fatPercentage: 0
  });
  const [userGoals, setUserGoals] = useState<UserGoals>({
    calorieTarget: 2000,
    proteinTarget: 80,
    carbTarget: 250,
    fatTarget: 70,
    goalType: 'maintain',
    activityLevel: 'moderate'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await loadMeals();
      await loadNutrition();
      await loadGoals();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMeals = async () => {
    const savedMeals = await getMealEntries();
    setMeals(savedMeals);
    
    // Filter for today's meals
    const today = new Date().toDateString();
    const todaysMeals = savedMeals
      .filter(meal => new Date(meal.timestamp).toDateString() === today)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setTodayMeals(todaysMeals);
  };

  const loadNutrition = async () => {
    const dailyNutrition = await calculateDailyNutrition();
    setNutrition(dailyNutrition);
  };

  const loadGoals = async () => {
    const goals = await getUserGoals();
    setUserGoals(goals);
  };

  // Camera permission and handling
  const handleCameraAccess = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to use this feature.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setCapturedImage(result.assets[0].uri);
        setIsAddModalVisible(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const handleSaveMeal = async (mealEntry: MealData) => {
    try {
      await saveMealEntry(mealEntry);
      await loadData(); // Refresh data
      Alert.alert('Success', 'Meal saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save meal');
    }
  };

  const handleEditMeal = (meal: MealData) => {
    setSelectedMeal(meal);
    setIsEditModalVisible(true);
  };

  const handleUpdateMeal = async (updatedMeal: MealData) => {
    try {
      await saveMealEntry(updatedMeal);
      await loadData(); // Refresh data
      Alert.alert('Success', 'Meal updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update meal');
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      const { deleteMealEntry } = await import('../mealStorage');
      await deleteMealEntry(mealId);
      await loadData(); // Refresh data
      Alert.alert('Success', 'Meal deleted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete meal');
    }
  };

  const handleSaveGoals = async (goals: UserGoals) => {
    setUserGoals(goals);
    await loadData(); // Refresh all data
  };

  const calculateProgress = () => {
    const progress = (nutrition.calories / userGoals.calorieTarget) * 100;
    return {
      percentage: Math.min(progress, 100),
      remaining: Math.max(userGoals.calorieTarget - nutrition.calories, 0)
    };
  };

  const { percentage, remaining } = calculateProgress();

  if (isHistoryVisible) {
    return <MealHistory onBack={() => setIsHistoryVisible(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Modern Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </Text>
            <Text style={styles.greeting}>Hello, Ranjitha 👋</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={() => setIsHistoryVisible(true)}
            >
              <Ionicons name="time-outline" size={22} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton}>
              <Text style={styles.profileInitial}>R</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Summary Card */}
        <TouchableOpacity 
          style={styles.summaryCard}
          onPress={() => setIsGoalModalVisible(true)}
        >
          <View style={styles.calorieCircle}>
            <Text style={styles.calorieCount}>{nutrition.calories}</Text>
            <Text style={styles.calorieLabel}>calories</Text>
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalText}>Daily Goal: {userGoals.calorieTarget.toLocaleString()} kcal</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${percentage}%` }]} />
            </View>
            <Text style={styles.remainingText}>{remaining.toLocaleString()} kcal remaining</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.addMealButton}
            onPress={() => setIsAddModalVisible(true)}>
            <View style={styles.buttonIcon}>
              <Text style={styles.buttonIconText}>📝</Text>
            </View>
            <Text style={styles.buttonText}>Log Meal</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cameraButton}
            onPress={handleCameraAccess}>
            <View style={styles.buttonIcon}>
              <Text style={styles.buttonIconText}>📸</Text>
            </View>
            <Text style={styles.buttonText}>Snap Meal</Text>
          </TouchableOpacity>
        </View>

        {/* Barcode Scanner Button */}
        <TouchableOpacity 
          style={styles.barcodeButton}
          onPress={() => setIsBarcodeModalVisible(true)}
        >
          <Ionicons name="barcode-outline" size={24} color="#1a1a1a" />
          <Text style={styles.barcodeButtonText}>Scan Food Barcode</Text>
        </TouchableOpacity>

        {/* Nutrition Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nutrition Overview</Text>
          <TouchableOpacity onPress={() => setIsGoalModalVisible(true)}>
            <Text style={styles.sectionAction}>Set Goals</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.macrosScrollView}
        >
          <View style={styles.macroCard}>
            <View style={[styles.macroIcon, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.macroIconText}>🥩</Text>
            </View>
            <Text style={styles.macroValue}>{nutrition.protein}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroProgress}>{nutrition.proteinPercentage}%</Text>
            <View style={styles.microProgressBar}>
              <View 
                style={[
                  styles.microProgress, 
                  { width: `${Math.min(nutrition.proteinPercentage, 100)}%` }
                ]} 
              />
            </View>
          </View>

          <View style={styles.macroCard}>
            <View style={[styles.macroIcon, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.macroIconText}>🍚</Text>
            </View>
            <Text style={styles.macroValue}>{nutrition.carbs}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroProgress}>{nutrition.carbsPercentage}%</Text>
            <View style={styles.microProgressBar}>
              <View 
                style={[
                  styles.microProgress, 
                  { width: `${Math.min(nutrition.carbsPercentage, 100)}%` }
                ]} 
              />
            </View>
          </View>

          <View style={styles.macroCard}>
            <View style={[styles.macroIcon, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.macroIconText}>🥑</Text>
            </View>
            <Text style={styles.macroValue}>{nutrition.fat}g</Text>
            <Text style={styles.macroLabel}>Fats</Text>
            <Text style={styles.macroProgress}>{nutrition.fatPercentage}%</Text>
            <View style={styles.microProgressBar}>
              <View 
                style={[
                  styles.microProgress, 
                  { width: `${Math.min(nutrition.fatPercentage, 100)}%` }
                ]} 
              />
            </View>
          </View>
        </ScrollView>

        {/* Today's Meals */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <TouchableOpacity onPress={() => setIsHistoryVisible(true)}>
            <Text style={styles.sectionAction}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.mealsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E7D32" />
            </View>
          ) : todayMeals.length === 0 ? (
            <View style={styles.emptyMealsContainer}>
              <Text style={styles.emptyMealsText}>No meals logged today</Text>
              <Text style={styles.emptyMealsSubtext}>Tap "Log Meal" to add your first meal</Text>
            </View>
          ) : (
            todayMeals.map((meal, index) => (
              <TouchableOpacity 
                key={meal.id || index.toString()} 
                style={styles.mealItem}
                onPress={() => handleEditMeal(meal)}
              >
                <View style={[styles.mealIcon, { backgroundColor: '#F3E5F5' }]}>
                  <Text style={styles.mealIconText}>🍽️</Text>
                </View>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealTitle}>{meal.food}</Text>
                  <Text style={styles.mealDetails}>{meal.notes || 'No notes'}</Text>
                  <View style={styles.mealMacros}>
                    <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                    {meal.protein > 0 && (
                      <Text style={styles.mealMacroText}>P: {meal.protein}g</Text>
                    )}
                    {meal.carbs > 0 && (
                      <Text style={styles.mealMacroText}>C: {meal.carbs}g</Text>
                    )}
                    {meal.fat > 0 && (
                      <Text style={styles.mealMacroText}>F: {meal.fat}g</Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <ImageDetectionModal
        visible={isAddModalVisible}
        onClose={() => {
          setIsAddModalVisible(false);
          setCapturedImage(null);
        }}
        imageUri={capturedImage}
        onSave={handleSaveMeal}
      />

      <EditMealModal
        visible={isEditModalVisible}
        onClose={() => {
          setIsEditModalVisible(false);
          setSelectedMeal(null);
        }}
        mealData={selectedMeal}
        onSave={handleUpdateMeal}
        onDelete={handleDeleteMeal}
      />

      <GoalSettingsModal
        visible={isGoalModalVisible}
        onClose={() => setIsGoalModalVisible(false)}
        onSave={handleSaveGoals}
      />

      <BarcodeScanner
        visible={isBarcodeModalVisible}
        onClose={() => setIsBarcodeModalVisible(false)}
        onProductScanned={(product) => {
          setIsBarcodeModalVisible(false);
          handleSaveMeal(product);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerDate: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
  },
  summaryCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  calorieCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  calorieCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
  },
  calorieLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  goalInfo: {
    flex: 1,
  },
  goalText: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2E7D32',
    borderRadius: 3,
  },
  remainingText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  addMealButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginRight: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cameraButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginLeft: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  barcodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  barcodeButtonText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  buttonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  buttonIconText: {
    fontSize: 18,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sectionAction: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  macrosScrollView: {
    paddingLeft: 20,
    marginBottom: 25,
  },
  macroCard: {
    width: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  macroIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  macroIconText: {
    fontSize: 20,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  macroProgress: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '500',
    marginBottom: 4,
  },
  microProgressBar: {
    height: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  microProgress: {
    height: 4,
    backgroundColor: '#2E7D32',
    borderRadius: 2,
  },
  mealsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  mealIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  mealIconText: {
    fontSize: 24,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  mealDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  mealMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mealCalories: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '500',
    marginRight: 8,
  },
  mealMacroText: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyMealsContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginVertical: 10,
  },
  emptyMealsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyMealsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});