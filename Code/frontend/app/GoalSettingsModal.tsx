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
import { useTheme } from './ThemeContext';

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
  const { theme, isDarkMode } = useTheme();
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
    if (!calorieTarget || !proteinTarget || !carbTarget || !fatTarget) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

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
    let baseCalories = 2000;
    
    if (activityLevel === 'low') {
      baseCalories = 1800;
    } else if (activityLevel === 'high') {
      baseCalories = 2400;
    }
    
    if (goalType === 'lose') {
      baseCalories -= 500;
    } else if (goalType === 'gain') {
      baseCalories += 500;
    }
    
    setCalorieTarget(baseCalories.toString());
    
    const proteinCals = baseCalories * 0.3;
    const proteinGrams = Math.round(proteinCals / 4);
    setProteinTarget(proteinGrams.toString());
    
    const carbCals = baseCalories * 0.45;
    const carbGrams = Math.round(carbCals / 4);
    setCarbTarget(carbGrams.toString());
    
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
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Nutrition Goals</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Goal</Text>
                <View style={styles.goalOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.goalOption, 
                      { backgroundColor: theme.placeholder },
                      goalType === 'lose' && [
                        styles.selectedGoal, 
                        { 
                          backgroundColor: isDarkMode ? '#2D3B2D' : '#E8F5E9',
                          borderColor: theme.primary 
                        }
                      ]
                    ]}
                    onPress={() => {
                      setGoalType('lose');
                      calculateCalories();
                    }}
                  >
                    <Text style={[
                      styles.goalText, 
                      { color: theme.textSecondary },
                      goalType === 'lose' && [styles.selectedGoalText, { color: theme.primary }]
                    ]}>
                      Lose Weight
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.goalOption, 
                      { backgroundColor: theme.placeholder },
                      goalType === 'maintain' && [
                        styles.selectedGoal, 
                        { 
                          backgroundColor: isDarkMode ? '#2D3B2D' : '#E8F5E9',
                          borderColor: theme.primary 
                        }
                      ]
                    ]}
                    onPress={() => {
                      setGoalType('maintain');
                      calculateCalories();
                    }}
                  >
                    <Text style={[
                      styles.goalText, 
                      { color: theme.textSecondary },
                      goalType === 'maintain' && [styles.selectedGoalText, { color: theme.primary }]
                    ]}>
                      Maintain
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.goalOption, 
                      { backgroundColor: theme.placeholder },
                      goalType === 'gain' && [
                        styles.selectedGoal, 
                        { 
                          backgroundColor: isDarkMode ? '#2D3B2D' : '#E8F5E9',
                          borderColor: theme.primary 
                        }
                      ]
                    ]}
                    onPress={() => {
                      setGoalType('gain');
                      calculateCalories();
                    }}
                  >
                    <Text style={[
                      styles.goalText, 
                      { color: theme.textSecondary },
                      goalType === 'gain' && [styles.selectedGoalText, { color: theme.primary }]
                    ]}>
                      Gain Weight
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Activity Level</Text>
                <View style={styles.goalOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.goalOption, 
                      { backgroundColor: theme.placeholder },
                      activityLevel === 'low' && [
                        styles.selectedGoal, 
                        { 
                          backgroundColor: isDarkMode ? '#2D3B2D' : '#E8F5E9',
                          borderColor: theme.primary 
                        }
                      ]
                    ]}
                    onPress={() => {
                      setActivityLevel('low');
                      calculateCalories();
                    }}
                  >
                    <Text style={[
                      styles.goalText, 
                      { color: theme.textSecondary },
                      activityLevel === 'low' && [styles.selectedGoalText, { color: theme.primary }]
                    ]}>
                      Low
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.goalOption, 
                      { backgroundColor: theme.placeholder },
                      activityLevel === 'moderate' && [
                        styles.selectedGoal, 
                        { 
                          backgroundColor: isDarkMode ? '#2D3B2D' : '#E8F5E9',
                          borderColor: theme.primary 
                        }
                      ]
                    ]}
                    onPress={() => {
                      setActivityLevel('moderate');
                      calculateCalories();
                    }}
                  >
                    <Text style={[
                      styles.goalText, 
                      { color: theme.textSecondary },
                      activityLevel === 'moderate' && [styles.selectedGoalText, { color: theme.primary }]
                    ]}>
                      Moderate
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.goalOption, 
                      { backgroundColor: theme.placeholder },
                      activityLevel === 'high' && [
                        styles.selectedGoal, 
                        { 
                          backgroundColor: isDarkMode ? '#2D3B2D' : '#E8F5E9',
                          borderColor: theme.primary 
                        }
                      ]
                    ]}
                    onPress={() => {
                      setActivityLevel('high');
                      calculateCalories();
                    }}
                  >
                    <Text style={[
                      styles.goalText, 
                      { color: theme.textSecondary },
                      activityLevel === 'high' && [styles.selectedGoalText, { color: theme.primary }]
                    ]}>
                      High
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Targets</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Calories (kcal)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.placeholder, color: theme.text }]}
                    value={calorieTarget}
                    onChangeText={setCalorieTarget}
                    placeholder="2000"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Protein (g)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.placeholder, color: theme.text }]}
                    value={proteinTarget}
                    onChangeText={setProteinTarget}
                    placeholder="80"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Carbohydrates (g)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.placeholder, color: theme.text }]}
                    value={carbTarget}
                    onChangeText={setCarbTarget}
                    placeholder="250"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    returnKeyType="next"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Fat (g)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.placeholder, color: theme.text }]}
                    value={fatTarget}
                    onChangeText={setFatTarget}
                    placeholder="70"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: theme.primary }]} 
                onPress={handleSave}
              >
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
  },
  goalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedGoal: {
    borderWidth: 1,
  },
  goalText: {
    fontWeight: '500',
  },
  selectedGoalText: {
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
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
  saveButton: {
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

export default GoalSettingsModal;