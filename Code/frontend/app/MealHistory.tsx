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

interface MealHistoryProps {
  onBack: () => void;
}

export default function MealHistory({ onBack }: MealHistoryProps) {
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
      setMeals(mealEntries.sort((a, b) => 
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
      style={styles.mealItem}
      onPress={() => handleEditMeal(item)}
    >
      <View style={styles.mealContent}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.mealImage} />
        ) : (
          <View style={styles.mealIcon}>
            <Text style={styles.mealIconText}>🍽️</Text>
          </View>
        )}
        
        <View style={styles.mealInfo}>
          <Text style={styles.mealTitle}>{item.food}</Text>
          <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
          
          <View style={styles.macrosRow}>
            <Text style={styles.macroText}>{item.calories} kcal</Text>
            {item.protein > 0 && <Text style={styles.macroText}>P: {item.protein}g</Text>}
            {item.carbs > 0 && <Text style={styles.macroText}>C: {item.carbs}g</Text>}
            {item.fat > 0 && <Text style={styles.macroText}>F: {item.fat}g</Text>}
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal History</Text>
        <View style={styles.rightPlaceholder} />
      </View>

      {meals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={50} color="#CCC" />
          <Text style={styles.emptyText}>No meals recorded yet</Text>
        </View>
      ) : (
        <FlatList
          data={meals}
          keyExtractor={(item) => item.id || item.timestamp}
          renderItem={renderMealItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadMeals} />
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
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  rightPlaceholder: {
    width: 28,
  },
  listContent: {
    paddingVertical: 12,
  },
  mealItem: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F3E5F5',
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
    color: '#333',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  macrosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  macroText: {
    fontSize: 12,
    color: '#2E7D32',
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
    color: '#666',
    marginTop: 12,
  }
});