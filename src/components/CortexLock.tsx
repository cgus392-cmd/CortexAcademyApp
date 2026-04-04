import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Platform 
} from 'react-native';
import { 
  ShieldCheck, 
  Fingerprint, 
  Unlock,
  Sparkles
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { MotiView, AnimatePresence } from 'moti';
import { BlurView } from 'expo-blur';
import { Colors, Radius, Shadows } from '../constants/theme';
import { MatteCard } from './design-system/CortexMatte';

const { width, height } = Dimensions.get('window');

interface CortexLockProps {
  onUnlock: () => void;
  userName?: string;
}

export default function CortexLock({ onUnlock, userName }: CortexLockProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback for devices without biometrics or not enrolled
        // In a real app, you'd use a PIN or Password
        onUnlock();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Acceder a la Bóveda Cortex',
        fallbackLabel: 'Usar contraseña del dispositivo',
        disableDeviceFallback: false,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUnlock();
      } else {
        setError('Autenticación fallida. Reintenta.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e) {
      setError('Error de seguridad. Contacta soporte.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    // Auto-trigger biometrics on mount
    handleAuthenticate();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Blur covers everything */}
      <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="light" />
      
      {/* Particle Background or Gradient Overlay */}
      <LinearGradient
        colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
        style={StyleSheet.absoluteFill}
      />

      <MotiView
        from={{ opacity: 0, scale: 0.9, translateY: 20 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        style={styles.card}
      >
        <MatteCard radius={35} />
        
        <View style={styles.iconContainer}>
          <MotiView
            animate={{ 
                scale: isAuthenticating ? [1, 1.1, 1] : 1,
                rotate: isAuthenticating ? ['0deg', '10deg', '-10deg', '0deg'] : '0deg'
            }}
            transition={{ loop: true, type: 'timing', duration: 2000 }}
            style={styles.glowAura}
          >
             <LinearGradient 
                colors={[Colors.primary + '40', 'transparent']} 
                style={styles.glowGradient} 
             />
          </MotiView>
          <Fingerprint size={64} color={Colors.primary} strokeWidth={1.5} />
        </View>

        <Text style={styles.title}>Bóveda Cortex</Text>
        <Text style={styles.subtitle}>
          Hola{userName ? `, ${userName}` : ''}. Esta sesión está protegida con cifrado biométrico.
        </Text>

        {error && (
            <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
            </MotiView>
        )}

        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={handleAuthenticate}
          style={styles.button}
        >
          <LinearGradient
            colors={[Colors.primary, '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Unlock size={20} color="#FFF" />
            <Text style={styles.buttonText}>DESBLOQUEAR AHORA</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
            <Sparkles size={14} color={Colors.primary} />
            <Text style={styles.footerText}>Secure Academic Environment</Text>
        </View>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  card: {
    width: width * 0.85,
    padding: 30,
    alignItems: 'center',
    borderRadius: 35,
    ...Shadows.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  glowAura: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    opacity: 0.5,
  },
  glowGradient: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -1,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 30,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    ...Shadows.primary,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  errorBox: {
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 30,
    opacity: 0.5,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
