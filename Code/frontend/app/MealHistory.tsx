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
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMealEntries } from './mealStorage';
import EditMealModal, { MealData } from './EditMealModal'; // Changed to default import
import { deleteMealEntry, saveMealEntry } from './mealStorage';

// Define interfaces
interface GroupedMeals {
  [date: string]: MealData[];
}

interface SectionData {
  title: string;
  data: MealData[];
}

export default function MealHistory() {
  const [meals, setMeals] = useState<MealData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealData | null>(null);
  const [groupedMeals, setGroupedMeals] = useState<GroupedMeals>({});

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      setRefreshing(true);
      const mealEntries = await getMealEntries();
      setMeals(mealEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      
      // Group meals by date
      groupMealsByDate(mealEntries);
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const groupMealsByDate = (mealEntries: MealData[]) => {
    const grouped: GroupedMeals = {};
    
    mealEntries.forEach(meal => {
      const date = new Date(meal.timestamp).toDateString();
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      
      grouped[date].push(meal);
    });
    
    // Sort each group by timestamp (newest first)
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
    
    setGroupedMeals(grouped);
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
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderMealItem = ({ item }: { item: MealData }) => (
    <TouchableOpacity
      style={styles.mealItem}
      onPress={() => handleEditMeal(item)}
    >
      <View style={styles.mealContent}>
        <View style={styles.mealIconContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.mealImage} />
          ) : (
            <View style={[styles.mealIcon, { backgroundColor: '#F3E5F5' }]}>
              <Text style={styles.mealIconText}>🍽️</Text>
            </View>
          )}
          <Text style={styles.mealTime}>{formatTime(item.timestamp)}</Text>
        </View>
        
        <View style={styles.mealInfo}>
          <Text style={styles.mealTitle}>{item.food}</Text>
          {item.notes ? (
            <Text style={styles.mealNotes} numberOfLines={1}>{item.notes}</Text>
          ) : null}
          
          <View style={styles.macrosRow}>
            <Text style={styles.macroText}>{item.calories} kcal</Text>
            {item.protein > 0 && (
              <Text style={styles.macroText}>P: {item.protein}g</Text>
            )}
            {item.carbs > 0 && (
              <Text style={styles.macroText}>C: {item.carbs}g</Text>
            )}
            {item.fat > 0 && (
              <Text style={styles.macroText}>F: {item.fat}g</Text>
            )}
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );

  const renderDateSection = ({ section }: { section: SectionData }) => (
    <View style={styles.dateHeader}>
      <Text style={styles.dateHeaderText}>{formatDate(section.title)}</Text>
    </View>
  );

  // Convert grouped meals to a format that FlatList can use with sections
  const getSectionData = (): SectionData[] => {
    const sections = Object.keys(groupedMeals)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Sort dates (newest first)
      .map(date => ({
        title: date,
        data: groupedMeals[date]
      }));
    
    return sections;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal History</Text>
      </View>

      {Object.keys(groupedMeals).length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={60} color="#CCC" />
          <Text style={styles.emptyText}>No meal entries yet</Text>
          <Text style={styles.emptySubText}>
            Your logged meals will appear here
          </Text>
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
          ListHeaderComponent={
            <View>
              {getSectionData().map((section) => (
                <View key={section.title}>
                  <View style={styles.dateHeader}>
                    <Text style={styles.dateHeaderText}>{formatDate(section.title)}</Text>
                  </View>
                  {section.data.map((meal) => (
                    <TouchableOpacity
                      key={meal.id || meal.timestamp}
                      style={styles.mealItem}
                      onPress={() => handleEditMeal(meal)}
                    >
                      <View style={styles.mealContent}>
                        <View style={styles.mealIconContainer}>
                          {meal.image ? (
                            <Image source={{ uri: meal.image }} style={styles.mealImage} />
                          ) : (
                            <View style={[styles.mealIcon, { backgroundColor: '#F3E5F5' }]}>
                              <Text style={styles.mealIconText}>🍽️</Text>
                            </View>
                          )}
                          <Text style={styles.mealTime}>{formatTime(meal.timestamp)}</Text>
                        </View>
                        
                        <View style={styles.mealInfo}>
                          <Text style={styles.mealTitle}>{meal.food}</Text>
                          {meal.notes ? (
                            <Text style={styles.mealNotes} numberOfLines={1}>{meal.notes}</Text>
                          ) : null}
                          
                          <View style={styles.macrosRow}>
                            <Text style={styles.macroText}>{item.calories} kcal</Text>
                            {meal.protein > 0 && (
                              <Text style={styles.macroText}>P: {meal.protein}g</Text>
                            )}
                            {meal.carbs > 0 && (
                              <Text style={styles.macroText}>C: {meal.carbs}g</Text>
                            )}
                            {meal.fat > 0 && (
                              <Text style={styles.macroText}>F: {meal.fat}g</Text>
                            )}
                          </View>
                        </View>
                        
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          }
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
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  listContent: {
    paddingBottom: 20,
  },
  dateHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  dateHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
  mealItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  mealContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  mealIconContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  mealIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  mealImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 6,
  },
  mealIconText: {
    fontSize: 24,
  },
  mealTime: {
    fontSize: 12,
    color: '#999',
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
  mealNotes: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
  },
  macrosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  macroText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '500',
    marginRight: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});