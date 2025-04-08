import React, { useState } from 'react';
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
export interface MealEntry {
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

interface ImageDetectionModalProps {
  visible: boolean;
  onClose: () => void;
  imageUri: string | null;
  onSave: (mealEntry: MealEntry) => void;
}

const ImageDetectionModal: React.FC<ImageDetectionModalProps> = ({ 
  visible, 
  onClose, 
  imageUri,
  onSave 
}) => {
  const [detectedFood, setDetectedFood] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    // Validate
    if (!detectedFood.trim()) {
      Alert.alert('Error', 'Please enter a food name');
      return;
    }

    // Create meal entry object
    const mealEntry: MealEntry = {
      id: Date.now().toString(),
      food: detectedFood,
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
      notes: notes,
      image: imageUri || undefined,
      timestamp: new Date().toISOString(),
    };

    onSave(mealEntry);
    
    // Reset form
    setDetectedFood('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setNotes('');
    
    onClose();
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
              <Text style={styles.headerTitle}>Add Food</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {imageUri && (
              <Image
                source={{ uri: imageUri }}
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
                    value={detectedFood}
                    onChangeText={setDetectedFood}
                    placeholder="What food did you eat?"
                    returnKeyType="next"
                    blurOnSubmit={false}
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
                    blurOnSubmit={false}
                  />
                </View>

                <Text style={styles.macroTitle}>Macronutrients (optional)</Text>
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
                      blurOnSubmit={false}
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
                      blurOnSubmit={false}
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
                      blurOnSubmit={false}
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

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save Entry</Text>
                </TouchableOpacity>
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
  macroTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
    marginTop: 4,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  saveButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImageDetectionModal;