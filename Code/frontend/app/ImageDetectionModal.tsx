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
  ActivityIndicator,
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

// OpenAI API configuration
const OPENAI_API_KEY = ''; // Replace with your actual API key
const API_URL = 'https://api.openai.com/v1/chat/completions';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Analyze the image when the modal becomes visible and we have an image
  useEffect(() => {
    if (visible && imageUri && !analysisComplete) {
      analyzeImage();
    }
  }, [visible, imageUri]);

  // Function to analyze the image using OpenAI API
  const analyzeImage = async () => {
    if (!imageUri) return;
    
    setIsAnalyzing(true);
    
    try {
      // Convert image to base64
      const imageBase64 = await getBase64FromUri(imageUri);
      if (!imageBase64) {
        throw new Error('Failed to convert image to base64');
      }
      
      // Prepare request to OpenAI API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this food image and provide nutritional information. Return the exact response in JSON format with the following structure: {\"food\": \"name of food\", \"calories\": number, \"protein\": number, \"carbs\": number, \"fat\": number, \"description\": \"brief description\"}"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract the JSON response from the AI
      const content = data.choices[0].message.content;
      
      // Parse the JSON from the response
      // The AI might return markdown or text with the JSON, so we need to extract it
      const jsonMatch = content.match(/\{.*\}/s);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from API response');
      }
      
      const nutritionData = JSON.parse(jsonMatch[0]);
      
      // Update state with the returned data
      setDetectedFood(nutritionData.food || '');
      setCalories(nutritionData.calories ? nutritionData.calories.toString() : '');
      setProtein(nutritionData.protein ? nutritionData.protein.toString() : '');
      setCarbs(nutritionData.carbs ? nutritionData.carbs.toString() : '');
      setFat(nutritionData.fat ? nutritionData.fat.toString() : '');
      
      // Add the description to notes
      setNotes(nutritionData.description || '');
      
      // Set analysis as complete to prevent multiple API calls
      setAnalysisComplete(true);
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert(
        'Analysis Failed',
        'Failed to analyze the image. Please enter the details manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper function to convert image URI to base64
  const getBase64FromUri = async (uri: string): Promise<string | null> => {
    try {
      // Using fetch to get the image data
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            // Extract base64 data without the prefix
            const base64Data = reader.result.split(',')[1];
            resolve(base64Data);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  };

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
    setAnalysisComplete(false);
    
    onClose();
  };

  // Retry analysis if it failed initially
  const handleRetryAnalysis = () => {
    setAnalysisComplete(false);
    analyzeImage();
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
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                {isAnalyzing && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                    <Text style={styles.loadingText}>Analyzing your meal...</Text>
                  </View>
                )}
              </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.form}>
                {analysisComplete && !isAnalyzing && (
                  <View style={styles.analysisBanner}>
                    <Text style={styles.analysisText}>AI analysis complete! You can edit the results below.</Text>
                  </View>
                )}
                
                {!analysisComplete && !isAnalyzing && imageUri && (
                  <TouchableOpacity style={styles.retryButton} onPress={handleRetryAnalysis}>
                    <Text style={styles.retryButtonText}>Analyze Image with AI</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Food Item</Text>
                  <TextInput
                    style={styles.input}
                    value={detectedFood}
                    onChangeText={setDetectedFood}
                    placeholder="What food did you eat?"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    editable={!isAnalyzing}
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
                    editable={!isAnalyzing}
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
                      editable={!isAnalyzing}
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
                      editable={!isAnalyzing}
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
                      editable={!isAnalyzing}
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
                    editable={!isAnalyzing}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.saveButton, isAnalyzing && styles.disabledButton]} 
                  onPress={handleSave}
                  disabled={isAnalyzing}
                >
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
  imageContainer: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    padding: 20,
  },
  analysisBanner: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  analysisText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
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
  disabledButton: {
    backgroundColor: '#A5D6A7',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImageDetectionModal;