import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { getUserGoals, saveUserGoals } from './mealStorage';

// Define interfaces for TypeScript
export interface UserGoals {
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  goalType: 'lose' | 'maintain' | 'gain';
  activityLevel: 'low' | 'moderate' | 'high';
}

interface GoalSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (goals: UserGoals) => void;
}

const GoalSettingsModal: React.FC<GoalSettingsModalProps> = ({ visible, onClose, onSave }) => {
  const [calorieTarget, setCalorieTarget] = useState('2000');
  const [proteinTarget, setProteinTarget] = useState('80');
  const [carbTarget, setCarbTarget] = useState('250');
  const [fatTarget, setFatTarget] = useState('70');
  const [goalType, setGoalType] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [activityLevel, setActivityLevel] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserGoals();
  }, []);

  const loadUserGoals = async () => {
    try {
      setIsLoading(true);
      const goals = await getUserGoals();
      
      setCalorieTarget(goals.calorieTarget.toString());
      setProteinTarget(goals.proteinTarget.toString());
      setCarbTarget(goals.carbTarget.toString());
      setFatTarget(goals.fatTarget.toString());
      setGoalType(goals.goalType || 'maintain');
      setActivityLevel(goals.activityLevel || 'moderate');
      
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate inputs
    if (!calorieTarget || !proteinTarget || !carbTarget || !fatTarget) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Create goals object
    const goals: UserGoals = {
      calorieTarget: parseInt(calorieTarget),
      proteinTarget: parseInt(proteinTarget),
      carbTarget: parseInt(carbTarget),
      fatTarget: parseInt(fatTarget),
      goalType,
      activityLevel,
    };

    try {
      await saveUserGoals(goals);
      onSave(goals);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save goals');
    }
  };

  const calculateCalories = () => {
    // This is a simplified calculation - in a real app, you'd use a more accurate formula
    // based on age, gender, weight, height, etc.
    let baseCalories = 2000;
    
    // Adjust for activity level
    if (activityLevel === 'low') {
      baseCalories = 1800;
    } else if (activityLevel === 'high') {
      baseCalories = 2400;
    }
    
    // Adjust for goal
    if (goalType === 'lose') {
      baseCalories -= 500;
    } else if (goalType === 'gain') {
      baseCalories += 500;
    }
    
    setCalorieTarget(baseCalories.toString());
    
    // Set macros based on calorie goal
    // Protein: 30% of calories (4 calories per gram)
    const proteinCals = baseCalories * 0.3;
    const proteinGrams = Math.round(proteinCals / 4);
    setProteinTarget(proteinGrams.toString());
    
    // Carbs: 45% of calories (4 calories per gram)
    const carbCals = baseCalories * 0.45;
    const carbGrams = Math.round(carbCals / 4);
    setCarbTarget(carbGrams.toString());
    
    // Fat: 25% of calories (9 calories per gram)
    const fatCals = baseCalories * 0.25;
    const fatGrams = Math.round(fatCals / 9);
    setFatTarget(fatGrams.toString());
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
              <Text style={styles.headerTitle}>Nutrition Goals</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Goal</Text>
                <View style={styles.goalOptions}>
                  <TouchableOpacity 
                    style={[styles.goalOption, goalType === 'lose' && styles.selectedGoal]}
                    onPress={() => {
                      setGoalType('lose');
                      calculateCalories();
                    }}
                  >
                    <Text style={[styles.goalText, goalType === 'lose' && styles.selectedGoalText]}>
                      Lose Weight
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.goalOption, goalType === 'maintain' && styles.selectedGoal]}
                    onPress={() => {
                      setGoalType('maintain');
                      calculateCalories();
                    }}
                  >
                    <Text style={[styles.goalText, goalType === 'maintain' && styles.selectedGoalText]}>
                      Maintain
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.goalOption, goalType === 'gain' && styles.selectedGoal]}
                    onPress={() => {
                      setGoalType('gain');
                      calculateCalories();
                    }}
                  >
                    <Text style={[styles.goalText, goalType === 'gain' && styles.selectedGoalText]}>
                      Gain Weight
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Activity Level</Text>
                <View style={styles.goalOptions}>
                  <TouchableOpacity 
                    style={[styles.goalOption, activityLevel === 'low' && styles.selectedGoal]}
                    onPress={() => {
                      setActivityLevel('low');
                      calculateCalories();
                    }}
                  >
                    <Text style={[styles.goalText, activityLevel === 'low' && styles.selectedGoalText]}>
                      Low
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.goalOption, activityLevel === 'moderate' && styles.selectedGoal]}
                    onPress={() => {
                      setActivityLevel('moderate');
                      calculateCalories();
                    }}
                  >
                    <Text style={[styles.goalText, activityLevel === 'moderate' && styles.selectedGoalText]}>
                      Moderate
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.goalOption, activityLevel === 'high' && styles.selectedGoal]}
                    onPress={() => {
                      setActivityLevel('high');
                      calculateCalories();
                    }}
                  >
                    <Text style={[styles.goalText, activityLevel === 'high' && styles.selectedGoalText]}>
                      High
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Daily Targets</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Calories (kcal)</Text>
                  <TextInput
                    style={styles.input}
                    value={calorieTarget}
                    onChangeText={setCalorieTarget}
                    placeholder="2000"
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Protein (g)</Text>
                  <TextInput
                    style={styles.input}
                    value={proteinTarget}
                    onChangeText={setProteinTarget}
                    placeholder="80"
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Carbohydrates (g)</Text>
                  <TextInput
                    style={styles.input}
                    value={carbTarget}
                    onChangeText={setCarbTarget}
                    placeholder="250"
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Fat (g)</Text>
                  <TextInput
                    style={styles.input}
                    value={fatTarget}
                    onChangeText={setFatTarget}
                    placeholder="70"
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Goals</Text>
              </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  goalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalOption: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedGoal: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
    borderWidth: 1,
  },
  goalText: {
    color: '#666',
    fontWeight: '500',
  },
  selectedGoalText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
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
  saveButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Change from named export to default export
export default GoalSettingsModal;