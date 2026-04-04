import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { useTheme } from '../context/ThemeContext';
import { Radius, Shadows } from '../constants/theme';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  message: string;
}

export default function CortySpeechBubble({ visible, message }: Props) {
  const { theme } = useTheme();

  if (!message) return null;

  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          from={{ opacity: 0, scale: 0.9, translateY: -10 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          exit={{ opacity: 0, scale: 0.9, translateY: -10 }}
          transition={{ type: 'timing', duration: 300 }}
          style={styles.container}
        >
          <View style={styles.bubbleWrapper}>
            {/* Arrow Pointer (TOP) */}
            <View style={[styles.arrow, { borderBottomColor: theme.isDark ? '#1A1A2E' : '#FFFFFF' }]} />

            <View style={[
                styles.bubble, 
                { 
                  backgroundColor: theme.isDark ? '#1A1A2E' : '#FFFFFF',
                  borderColor: theme.primary + '30',
                  shadowColor: theme.primary
                }
              ]}>
              <Text style={[styles.text, { color: theme.text }]}>
                {message}
              </Text>
            </View>
          </View>
        </MotiView>
      )}
    </AnimatePresence>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 52, 
    right: 0,
    width: width * 0.75,
    maxWidth: 280,
    zIndex: 99999,
  },
  bubbleWrapper: {
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    ...Shadows.lg,
    elevation: 6,
    minHeight: 50,
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginRight: 12,
    marginBottom: -1,
    zIndex: 100000,
  },
});
