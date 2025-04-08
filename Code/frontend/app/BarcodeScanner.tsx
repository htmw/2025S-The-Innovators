import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import * as Camera from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

// Define interfaces for TypeScript
interface BarcodeApiResponse {
  product: {
    title: string;
    description?: string;
    brand?: string | null;
    category?: string[];
    nutrition_facts?: string;
    images?: string[];
    barcode_formats?: {
      upc_a?: string;
      ean_13?: string;
    };
    online_stores?: Array<{
      name: string;
      price: string;
    }>;
  };
}

interface MealEntry {
  id: string;
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes: string;
  timestamp: string;
}

interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onProductScanned: (mealEntry: MealEntry) => void;
}

// Fallback mock data in case API fails
const mockFoodDatabase: Record<string, any> = {
  '5449000000996': { name: 'Coca-Cola', calories: 139, protein: 0, carbs: 35, fat: 0 },
  '5000112637922': { name: 'Cadbury Dairy Milk', calories: 240, protein: 4, carbs: 25, fat: 14 },
  '027917009711': { name: 'Vitafusion MultiVites', calories: 150, protein: 0, carbs: 100, fat: 0 }
};

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ visible, onClose, onProductScanned }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission',
          'Please grant camera permission to use the barcode scanner',
          [{ text: 'OK', onPress: () => onClose() }]
        );
      }
    })();
  }, [onClose]);

  const parseNutritionFacts = (nutritionText: string | undefined): { calories: number, protein: number, carbs: number, fat: number } => {
    if (!nutritionText) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    
    try {
      // Extract data from strings like "Energy 150 kcal, Carbohydrates 100 g, Sugars 75 g, Salt 1.25 g."
      const caloriesMatch = nutritionText.match(/Energy\s+(\d+)\s+kcal/i);
      const carbsMatch = nutritionText.match(/Carbohydrates\s+(\d+)\s+g/i);
      const proteinMatch = nutritionText.match(/Protein\s+(\d+)\s+g/i);
      const fatMatch = nutritionText.match(/Fat\s+(\d+)\s+g/i);
      
      return {
        calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 0,
        carbs: carbsMatch ? parseInt(carbsMatch[1]) : 0,
        protein: proteinMatch ? parseInt(proteinMatch[1]) : 0,
        fat: fatMatch ? parseInt(fatMatch[1]) : 0
      };
    } catch (error) {
      console.error('Error parsing nutrition facts:', error);
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  };

  const fetchProductFromAPI = async (barcode: string): Promise<BarcodeApiResponse | null> => {
    try {
      const options = {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'barcodes1.p.rapidapi.com',
          'x-rapidapi-key': '87b088a185msh6dc197816329727p13c48ajsnb75d08fdfdf6'
        }
      };

      const response = await fetch(`https://barcodes1.p.rapidapi.com/?query=${barcode}`, options);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching product data:', error);
      return null;
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (!scanning) return;
    
    setScanned(true);
    setScanning(false);
    setLoading(true);
    
    try {
      // Fetch product data from the API
      const apiResponse = await fetchProductFromAPI(data);
      
      if (apiResponse && apiResponse.product) {
        const { product } = apiResponse;
        
        // Parse nutrition facts from the API
        const nutrition = parseNutritionFacts(product.nutrition_facts);
        
        // Create product notes with all relevant information
        let productNotes = `Scanned barcode: ${data}\n`;
        if (product.brand) productNotes += `Brand: ${product.brand}\n`;
        if (product.category && product.category.length > 0) productNotes += `Category: ${product.category.join(', ')}\n`;
        if (product.online_stores && product.online_stores.length > 0) {
          productNotes += 'Available at: ';
          product.online_stores.forEach((store, index) => {
            productNotes += `${store.name} (${store.price})${index < product.online_stores!.length - 1 ? ', ' : ''}`;
          });
          productNotes += '\n';
        }
        if (product.description) {
          // Limit description length
          const shortDesc = product.description.length > 150 
            ? product.description.substring(0, 150) + '...' 
            : product.description;
          productNotes += `Description: ${shortDesc}`;
        }
        
        // Create meal entry from product data
        const mealEntry: MealEntry = {
          id: Date.now().toString(),
          food: product.title || 'Unknown Product',
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          notes: productNotes,
          timestamp: new Date().toISOString(),
        };
        
        onProductScanned(mealEntry);
      } else {
        // Fallback to mock database if API fails
        const mockProduct = mockFoodDatabase[data];
        
        if (mockProduct) {
          const mealEntry: MealEntry = {
            id: Date.now().toString(),
            food: mockProduct.name,
            calories: mockProduct.calories,
            protein: mockProduct.protein,
            carbs: mockProduct.carbs,
            fat: mockProduct.fat,
            notes: `Scanned barcode: ${data} (from local database)`,
            timestamp: new Date().toISOString(),
          };
          
          onProductScanned(mealEntry);
        } else {
          // Neither API nor mock database has the product
          Alert.alert(
            'Product Not Found',
            `No product found for barcode: ${data}`,
            [
              { 
                text: 'Try Again', 
                onPress: () => {
                  setScanned(false);
                  setScanning(true);
                  setLoading(false);
                } 
              },
              { 
                text: 'Close', 
                onPress: () => onClose() 
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error in barcode scanning process:', error);
      Alert.alert(
        'Error',
        'Failed to retrieve product information',
        [
          { 
            text: 'Try Again', 
            onPress: () => {
              setScanned(false);
              setScanning(true);
              setLoading(false);
            } 
          },
          { 
            text: 'Close', 
            onPress: () => onClose() 
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCamera = () => {
    return (
      <View style={styles.cameraContainer}>
        <Camera.BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={styles.camera}
          barCodeTypes={['ean13', 'ean8', 'upc_e', 'upc_a']}
        />
        
        <View style={styles.overlay}>
          <View style={styles.scanWindow} />
        </View>
        
        <View style={styles.helpTextContainer}>
          <Text style={styles.helpText}>
            Align barcode within the square
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Barcode</Text>
          <View style={{ width: 40 }} />
        </View>
        
        {hasPermission === null ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.statusText}>Requesting camera permission...</Text>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.centeredContainer}>
            <Text style={styles.errorText}>No access to camera</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={onClose}
            >
              <Text style={styles.retryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.statusText}>Searching for product...</Text>
          </View>
        ) : (
          renderCamera()
        )}
        
        {scanned && !loading && (
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => {
                setScanned(false);
                setScanning(true);
              }}
            >
              <Text style={styles.scanAgainButtonText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanWindow: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#2E7D32',
    backgroundColor: 'transparent',
  },
  helpTextContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  helpText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#FFF',
  },
  scanAgainButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  scanAgainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#E53935',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '80%',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BarcodeScanner;