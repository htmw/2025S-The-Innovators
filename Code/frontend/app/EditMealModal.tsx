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

// Define interfaces for TypeScript
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

    // Create updated meal entry object
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
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Edit Meal</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {mealData?.image && (
              <Image
                source={{ uri: mealData.image }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}

            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Food Item</Text>
                  <TextInput
                    style={styles.input}
                    value={food}
                    onChangeText={setFood}
                    placeholder="What food did you eat?"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Calories</Text>
                  <TextInput
                    style={styles.input}
                    value={calories}
                    onChangeText={setCalories}
                    placeholder="Estimated calories"
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                </View>
                
                <View style={styles.macroRow}>
                  <View style={[styles.inputContainer, styles.macroInput]}>
                    <Text style={styles.label}>Protein (g)</Text>
                    <TextInput
                      style={styles.input}
                      value={protein}
                      onChangeText={setProtein}
                      placeholder="0"
                      keyboardType="numeric"
                      returnKeyType="next"
                    />
                  </View>
                  
                  <View style={[styles.inputContainer, styles.macroInput]}>
                    <Text style={styles.label}>Carbs (g)</Text>
                    <TextInput
                      style={styles.input}
                      value={carbs}
                      onChangeText={setCarbs}
                      placeholder="0"
                      keyboardType="numeric"
                      returnKeyType="next"
                    />
                  </View>
                  
                  <View style={[styles.inputContainer, styles.macroInput]}>
                    <Text style={styles.label}>Fat (g)</Text>
                    <TextInput
                      style={styles.input}
                      value={fat}
                      onChangeText={setFat}
                      placeholder="0"
                      keyboardType="numeric"
                      returnKeyType="next"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add any additional notes"
                    multiline
                    returnKeyType="done"
                    blurOnSubmit={true}
                    onSubmitEditing={dismissKeyboard}
                  />
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={handleDelete}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.saveButton} 
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
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666666',
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
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
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
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
    backgroundColor: '#2E7D32',
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
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E53935',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
  },
  deleteButtonText: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditMealModal;