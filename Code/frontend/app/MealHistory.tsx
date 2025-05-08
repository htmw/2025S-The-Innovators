import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMealEntries, deleteMealEntry, saveMealEntry } from './mealStorage';
import EditMealModal, { MealData } from './EditMealModal';
import { useTheme } from './ThemeContext';

interface MealHistoryProps {
  onBack: () => void;
}

export default function MealHistory({ onBack }: MealHistoryProps) {
  const { theme, isDarkMode } = useTheme();
  const [meals, setMeals] = useState<MealData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealData | null>(null);

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      setRefreshing(true);
      const mealEntries = await getMealEntries();
      setMeals(mealEntries.sort((a: MealData, b: MealData) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditMeal = (meal: MealData) => {
    setSelectedMeal(meal);
    setEditModalVisible(true);
  };

  const handleUpdateMeal = async (updatedMeal: MealData) => {
    try {
      await saveMealEntry(updatedMeal);
      await loadMeals();
    } catch (error) {
      console.error('Error updating meal:', error);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      await deleteMealEntry(mealId);
      await loadMeals();
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const renderMealItem = ({ item }: { item: MealData }) => (
    <TouchableOpacity
      style={[styles.mealItem, { backgroundColor: theme.card }]}
      onPress={() => handleEditMeal(item)}
    >
      <View style={styles.mealContent}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.mealImage} />
        ) : (
          <View style={[styles.mealIcon, { backgroundColor: isDarkMode ? '#4A2F4A' : '#F3E5F5' }]}>
            <Text style={styles.mealIconText}>🍽️</Text>
          </View>
        )}
        
        <View style={styles.mealInfo}>
          <Text style={[styles.mealTitle, { color: theme.text }]}>{item.food}</Text>
          <Text style={[styles.dateText, { color: theme.textSecondary }]}>{formatDate(item.timestamp)}</Text>
          
          <View style={styles.macrosRow}>
            <Text style={[styles.macroText, { color: theme.primary }]}>{item.calories} kcal</Text>
            {item.protein > 0 && <Text style={[styles.macroText, { color: theme.primary }]}>P: {item.protein}g</Text>}
            {item.carbs > 0 && <Text style={[styles.macroText, { color: theme.primary }]}>C: {item.carbs}g</Text>}
            {item.fat > 0 && <Text style={[styles.macroText, { color: theme.primary }]}>F: {item.fat}g</Text>}
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, { 
        backgroundColor: theme.card,
        borderBottomColor: theme.border
      }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Meal History</Text>
        <View style={styles.rightPlaceholder} />
      </View>

      {meals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={50} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No meals recorded yet</Text>
        </View>
      ) : (
        <FlatList
          data={meals}
          keyExtractor={(item) => item.id || item.timestamp}
          renderItem={renderMealItem}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={loadMeals}
              tintColor={theme.primary}
              colors={[theme.primary]} 
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <EditMealModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        mealData={selectedMeal}
        onSave={handleUpdateMeal}
        onDelete={handleDeleteMeal}
      />
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
  rightPlaceholder: {
    width: 28,
  },
  listContent: {
    paddingVertical: 12,
  },
  mealItem: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  mealContent: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mealImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  mealIconText: {
    fontSize: 20,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    marginBottom: 4,
  },
  macrosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  macroText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  }
});