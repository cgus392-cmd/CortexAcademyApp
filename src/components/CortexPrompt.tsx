import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { Radius, Shadows, Spacing } from '../constants/theme';
import { MatteCard } from './design-system/CortexMatte';

const { width } = Dimensions.get('window');

interface CortexPromptProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
  primaryAction: {
    label: string;
    onPress: () => void | Promise<void>;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

export default function CortexPrompt({
  isVisible,
  onClose,
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
}: CortexPromptProps) {
  const { theme } = useTheme();

  const handlePrimaryPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await primaryAction.onPress();
  };

  const handleSecondaryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (secondaryAction) {
      secondaryAction.onPress();
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Backdrop */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={[StyleSheet.absoluteFill, styles.backdrop]}
          >
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              onPress={onClose} 
              activeOpacity={1} 
            />
          </MotiView>

          <View style={styles.centeredView} pointerEvents="box-none">
            <MotiView
              from={{ opacity: 0, scale: 0.9, translateY: 20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, translateY: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 150 }}
              style={styles.modalContent}
            >
              <MatteCard
                radius={32}
                style={styles.glass}
               
               
               
               
              >
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>

                <View style={styles.buttonContainer}>
                  {secondaryAction && (
                    <TouchableOpacity
                      style={[styles.button, styles.secondaryButton]}
                      onPress={handleSecondaryPress}
                    >
                      <Text style={[styles.buttonText, { color: theme.textSecondary }]}>
                        {secondaryAction.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handlePrimaryPress}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[theme.primary, theme.primaryDark || theme.primary]}
                      style={styles.primaryGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.primaryText}>{primaryAction.label}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </MatteCard>
            </MotiView>
          </View>
        </View>
      )}
    </AnimatePresence>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  glass: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  primaryGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  primaryText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
