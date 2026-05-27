import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { isWeb, getWebPlatform, isStandalonePWA } from '../utils/WebPlatform';
import { BlurView } from 'expo-blur';
import { ShareIcon, PlusSquareIcon, SmartphoneIcon } from 'lucide-react-native';

interface WebGuardProps {
  children: React.ReactNode;
}

export default function WebGuard({ children }: WebGuardProps) {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'windows' | 'mac' | 'other' | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (isWeb) {
      setPlatform(getWebPlatform());
      setIsStandalone(isStandalonePWA());
    }
  }, []);

  // Si no es web o si es una PWA instalada, renderizar la app normal
  if (!isWeb || isStandalone) {
    return <>{children}</>;
  }

  // Si es web y es Android/Windows/Mac, mostrar pantalla de bloqueo
  if (platform === 'android' || platform === 'windows' || platform === 'mac' || platform === 'other') {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <SmartphoneIcon color="#60A5FA" size={64} style={{ marginBottom: 20 }} />
          <Text style={styles.title}>Exclusivo para iOS</Text>
          <Text style={styles.description}>
            Cortex Hub OS en web está diseñado exclusivamente como una PWA para dispositivos iPhone y iPad.
          </Text>
          <Text style={styles.description2}>
            Por favor, descarga nuestra aplicación nativa para Android.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => window.open('https://www.cortexwebacademy.com/', '_self')}
          >
            <Text style={styles.buttonText}>Ir a la Landing Page</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Si es web y es iOS (Safari), mostrar instrucciones para agregar a inicio
  if (platform === 'ios') {
    return (
      <View style={styles.container}>
        <View style={styles.iosCard}>
          <Image source={require('../../assets/icon.png')} style={styles.appIcon} />
          <Text style={styles.iosTitle}>Instalar Cortex Hub</Text>
          <Text style={styles.iosDescription}>
            Para una experiencia nativa y notificaciones, agrega esta aplicación a tu pantalla de inicio.
          </Text>
          
          <View style={styles.instructionBox}>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
              <Text style={styles.stepText}>Toca el botón <Text style={{fontWeight: 'bold'}}>Compartir</Text> en la barra inferior de Safari.</Text>
            </View>
            <View style={styles.iconCenter}>
              <ShareIcon color="#3B82F6" size={24} />
            </View>
            
            <View style={[styles.stepRow, { marginTop: 20 }]}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
              <Text style={styles.stepText}>Selecciona <Text style={{fontWeight: 'bold'}}>Agregar a inicio</Text> en el menú.</Text>
            </View>
            <View style={styles.iconCenter}>
              <PlusSquareIcon color="#3B82F6" size={24} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Fallback temporal mientras carga el estado
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060A10',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  description2: {
    color: '#CBD5E1',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  iosCard: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 24,
    marginBottom: 24,
  },
  iosTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  iosDescription: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  instructionBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepText: {
    color: '#E2E8F0',
    fontSize: 15,
    flex: 1,
  },
  iconCenter: {
    alignItems: 'center',
    marginVertical: 4,
  }
});
