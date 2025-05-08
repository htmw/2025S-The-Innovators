import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { useTheme } from './ThemeContext';

export interface MealData {
  id: string;
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes: string;
  image?: string;
  timestamp: string;
}

interface EditMealModalProps {
  visible: boolean;
  onClose: () => void;
  mealData: MealData | null;
  onSave: (updatedMeal: MealData) => void;
  onDelete: (mealId: string) => void;
}

const EditMealModal: React.FC<EditMealModalProps> = ({ 
  visible, 
  onClose, 
  mealData,
  onSave,
  onDelete
}) => {
  const { theme, isDarkMode } = useTheme();
  const [food, setFood] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (mealData) {
      setFood(mealData.food || '');
      setCalories(mealData.calories ? mealData.calories.toString() : '');
      setProtein(mealData.protein ? mealData.protein.toString() : '');
      setCarbs(mealData.carbs ? mealData.carbs.toString() : '');
      setFat(mealData.fat ? mealData.fat.toString() : '');
      setNotes(mealData.notes || '');
    }
  }, [mealData]);

  const handleSave = () => {
    if (!food.trim()) {
      Alert.alert('Error', 'Please enter a food name');
      return;
    }

    if (!mealData) {
      Alert.alert('Error', 'No meal data available');
      return;
    }

    const updatedMeal: MealData = {
      ...mealData,
      food: food,
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
      notes: notes,
    };

    onSave(updatedMeal);
    onClose();
  };

  const handleDelete = () => {
    if (!mealData) {
      Alert.alert('Error', 'No meal data available');
      return;
    }

    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            onDelete(mealData.id);
            onClose();
          },
          style: 'destructive' 
        },
      ]
    );
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
          keyboardVerticalOffset={10}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Meal</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {mealData?.image && (
              <Image
                source={{ uri: mealData.image }}
                style={[styles.previewImage, { backgroundColor: theme.placeholder }]}
                resizeMode="cover"
              />
            )}

            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Food Item</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.placeholder, color: theme.text }]}
                    value={food}
                    onChangeText={setFood}
                    placeholder="What food did you eat?"
                    placeholderTextColor={theme.textSecondary}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Calories</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.placeholder, color: theme.text }]}
                    value={calories}
                    onChangeText={setCalories}
                    placeholder="Estimated calories"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                </View>
                
                <View style={styles.macroRow}>
                  <View style={[styles.inputContainer, styles.macroInput]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Protein (g)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.placeholder, color: theme.text }]}
                      value={protein}
                      onChangeText={setProtein}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                      returnKeyType="next"
                    />
                  </View>
                  
                  <View style={[styles.inputContainer, styles.macroInput]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Carbs (g)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.placeholder, color: theme.text }]}
                      value={carbs}
                      onChangeText={setCarbs}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                      returnKeyType="next"
                    />
                  </View>
                  
                  <View style={[styles.inputContainer, styles.macroInput]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Fat (g)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.placeholder, color: theme.text }]}
                      value={fat}
                      onChangeText={setFat}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                      returnKeyType="next"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Notes</Text>
                  <TextInput
                    style={[
                      styles.input, 
                      styles.textArea, 
                      { backgroundColor: theme.placeholder, color: theme.text }
                    ]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add any additional notes"
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    returnKeyType="done"
                    blurOnSubmit={true}
                    onSubmitEditing={dismissKeyboard}
                  />
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={[
                      styles.deleteButton, 
                      { 
                        backgroundColor: isDarkMode ? '#2A2A2A' : '#FFF',
                        borderColor: theme.error 
                      }
                    ]} 
                    onPress={handleDelete}
                  >
                    <Text style={[styles.deleteButtonText, { color: theme.error }]}>Delete</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.saveButton, { backgroundColor: theme.primary }]} 
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroInput: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 2,
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditMealModal;