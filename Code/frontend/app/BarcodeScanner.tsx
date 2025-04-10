import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { BarCodeScanner } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

// Define interfaces for TypeScript
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

// Simple mock database for common products
const mockFoodDatabase: Record<string, any> = {
  '5449000000996': { name: 'Coca-Cola', calories: 139, protein: 0, carbs: 35, fat: 0 },
  '5000112637922': { name: 'Cadbury Dairy Milk', calories: 240, protein: 4, carbs: 25, fat: 14 },
  '027917009711': { name: 'Vitafusion MultiVites', calories: 15, protein: 0, carbs: 4, fat: 0 }
};

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ visible, onClose, onProductScanned }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check camera permissions when modal becomes visible
  useEffect(() => {
    let isMounted = true;
    
    const getPermission = async () => {
      try {
        // First try using the Camera module for permissions
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        
        // Only update state if component is still mounted
        if (isMounted) {
          console.log("Camera permission status:", status);
          setHasPermission(status === 'granted');
          
          if (status !== 'granted') {
            Alert.alert(
              'Camera Permission',
              'Please grant camera permission to use the barcode scanner',
              [{ text: 'OK', onPress: onClose }]
            );
          }
        }
      } catch (err) {
        console.error("Error requesting camera permission:", err);
        
        // Only update state if component is still mounted
        if (isMounted) {
          setHasPermission(false);
          Alert.alert('Camera Error', 'Failed to access camera.', [{ text: 'OK', onPress: onClose }]);
        }
      }
    };

    if (visible) {
      getPermission();
    } else {
      // Reset state when modal is closed
      setScanned(false);
      setLoading(false);
    }
    
    // Cleanup function to prevent state updates if unmounted
    return () => {
      isMounted = false;
    };
  }, [visible]);

  // Handle barcode scanning
  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setLoading(true);
    
    try {
      // Check if product exists in our mock database
      const product = mockFoodDatabase[data];
      
      if (product) {
        // Create meal entry from product data
        const mealEntry: MealEntry = {
          id: Date.now().toString(),
          food: product.name,
          calories: product.calories,
          protein: product.protein,
          carbs: product.carbs,
          fat: product.fat,
          notes: `Scanned barcode: ${data}`,
          timestamp: new Date().toISOString(),
        };
        
        onProductScanned(mealEntry);
      } else {
        // Product not found
        Alert.alert(
          'Product Not Found',
          `No product found for barcode: ${data}`,
          [
            { text: 'Try Again', onPress: () => setScanned(false) },
            { text: 'Close', onPress: onClose }
          ]
        );
      }
    } catch (error) {
      console.error('Error in barcode scanning process:', error);
      Alert.alert('Error', 'Failed to retrieve product information');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  // For testing without a real barcode
  const scanTestBarcode = () => {
    handleBarCodeScanned({ type: 'TEST', data: '5449000000996' });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Barcode</Text>
          <View style={{ width: 40 }} />
        </View>
        
        {/* Content */}
        {hasPermission === null ? (
          // Loading state while checking permissions
          <View style={styles.centeredContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.statusText}>Requesting camera permission...</Text>
          </View>
        ) : hasPermission === false ? (
          // No permission state
          <View style={styles.centeredContainer}>
            <Text style={styles.errorText}>Camera permission not granted</Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={scanTestBarcode}
            >
              <Text style={styles.buttonText}>Use Test Barcode</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          // Loading state while processing barcode
          <View style={styles.centeredContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.statusText}>Processing barcode...</Text>
          </View>
        ) : (
          // Camera view
          <View style={styles.cameraContainer}>
            <BarCodeScanner
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
        )}
        
        {/* Bottom buttons */}
        {scanned && !loading && (
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.buttonText}>Scan Again</Text>
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
  button: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#E53935',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default BarcodeScanner;