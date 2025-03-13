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
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageDetectionModal } from '../ImageDetectionModal';
import { saveMealEntry, getMealEntries } from '../mealStorage';

export default function HomeScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [meals, setMeals] = useState([]);
  const [totalCalories, setTotalCalories] = useState(0);

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    const savedMeals = await getMealEntries();
    setMeals(savedMeals);
    
    // Calculate total calories for today
    const today = new Date().toDateString();
    const todayCalories = savedMeals
      .filter(meal => new Date(meal.timestamp).toDateString() === today)
      .reduce((sum, meal) => sum + (meal.calories || 0), 0);
    
    setTotalCalories(todayCalories);
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
        setIsModalVisible(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const handleSaveMeal = async (mealEntry) => {
    try {
      await saveMealEntry(mealEntry);
      await loadMeals(); // Refresh meals list
      Alert.alert('Success', 'Meal saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save meal');
    }
  };

  const calculateProgress = () => {
    const dailyGoal = 2000;
    const progress = (totalCalories / dailyGoal) * 100;
    return {
      percentage: Math.min(progress, 100),
      remaining: Math.max(dailyGoal - totalCalories, 0)
    };
  };

  const { percentage, remaining } = calculateProgress();

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
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileInitial}>R</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.calorieCircle}>
            <Text style={styles.calorieCount}>{totalCalories}</Text>
            <Text style={styles.calorieLabel}>calories</Text>
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalText}>Daily Goal: 2,000 kcal</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${percentage}%` }]} />
            </View>
            <Text style={styles.remainingText}>{remaining} kcal remaining</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.addMealButton}
            onPress={() => setIsModalVisible(true)}>
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

        {/* Nutrition Overview */}
        <Text style={styles.sectionTitle}>Nutrition Overview</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.macrosScrollView}
        >
          <View style={styles.macroCard}>
            <View style={[styles.macroIcon, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.macroIconText}>🥩</Text>
            </View>
            <Text style={styles.macroValue}>65g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroProgress}>81%</Text>
          </View>

          <View style={styles.macroCard}>
            <View style={[styles.macroIcon, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.macroIconText}>🍚</Text>
            </View>
            <Text style={styles.macroValue}>180g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroProgress}>72%</Text>
          </View>

          <View style={styles.macroCard}>
            <View style={[styles.macroIcon, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.macroIconText}>🥑</Text>
            </View>
            <Text style={styles.macroValue}>45g</Text>
            <Text style={styles.macroLabel}>Fats</Text>
            <Text style={styles.macroProgress}>64%</Text>
          </View>
        </ScrollView>

        {/* Today's Meals */}
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        <View style={styles.mealsContainer}>
          {meals.map((meal, index) => (
            <TouchableOpacity key={index} style={styles.mealItem}>
              <View style={[styles.mealIcon, { backgroundColor: '#F3E5F5' }]}>
                <Text style={styles.mealIconText}>🍽️</Text>
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealTitle}>{meal.food}</Text>
                <Text style={styles.mealDetails}>{meal.notes}</Text>
                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ImageDetectionModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setCapturedImage(null);
        }}
        imageUri={capturedImage}
        onSave={handleSaveMeal}
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
    marginBottom: 25,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    paddingHorizontal: 20,
    marginBottom: 15,
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
  },
  mealsContainer: {
    paddingHorizontal: 20,
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
    marginBottom: 2,
  },
  mealCalories: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '500',
  },
});