import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useData } from '../context/DataContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, PALETTES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { ImageBackground } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Props {
  children?: React.ReactNode;
  overrideIntensity?: number;
  shadowOpacity?: number;
}

export default function CleanBackground({ children, overrideIntensity, shadowOpacity }: Props) {
  const { theme } = useTheme();
  const { userProfile } = useData();
  const { performanceMode, nebulaIntensity: themeIntensity } = theme;
  
  const rawIntensity = overrideIntensity !== undefined ? overrideIntensity : themeIntensity;
  const i = typeof rawIntensity === 'number' ? rawIntensity : 0.8;

  const hexAlpha1 = Math.round(i * 50).toString(16).padStart(2, '0');
  const hexAlpha2 = Math.round(i * 40).toString(16).padStart(2, '0');
  const hexAlpha3 = Math.round(i * 30).toString(16).padStart(2, '0');
  
  const isEco = performanceMode === 'eco';
  const isAhorro = performanceMode === 'ahorro';
  const isUltra = performanceMode === 'ultra';
  const isStatic = isAhorro || isEco;

  const animDuration = (isUltra ? 15000 : 10000) / (0.4 + i);
  const scaleMult = (0.5 + i) * (isUltra ? 1.2 : 1);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Base Solid / Dark layer */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.isDark ? '#000' : '#FFF', opacity: shadowOpacity ?? 1 }]} />
      
      {/* Nebula Pro Layers with Blur */}
      {!isEco && (
        <View style={StyleSheet.absoluteFill}>
          <MotiView
            from={{ translateX: -width * 0.4, translateY: -height * 0.2, rotate: '0deg', scale: 1 * scaleMult }}
            animate={isStatic ? undefined : { 
                translateX: width * 0.3, 
                translateY: height * 0.1, 
                rotate: isUltra ? '40deg' : '15deg', 
                scale: isUltra ? 1.8 * scaleMult : 1.5 * scaleMult 
            }}
            transition={{ loop: true, type: 'timing', duration: animDuration * (isUltra ? 2 : 1.5), repeatReverse: true }}
            style={styles.nebula1}
          >
            <LinearGradient
              colors={[theme.primary + hexAlpha1, 'transparent', 'transparent']}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: width }]}
            />
          </MotiView>

          <MotiView
            from={{ translateX: width * 0.3, translateY: height * 0.2, rotate: '0deg', scale: 1.2 * scaleMult }}
            animate={isStatic ? undefined : { 
                translateX: -width * 0.4, 
                translateY: -height * 0.1, 
                rotate: isUltra ? '-45deg' : '-20deg', 
                scale: isUltra ? 0.7 * scaleMult : 0.9 * scaleMult 
            }}
            transition={{ loop: true, type: 'timing', duration: animDuration * 2, repeatReverse: true }}
            style={styles.nebula2}
          >
            <LinearGradient
              colors={[theme.accent + hexAlpha2, theme.accent + '05', 'transparent']}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: width }]}
            />
          </MotiView>

          <MotiView
            from={{ opacity: 0.05 * i, scale: 1 * scaleMult, rotate: '0deg' }}
            animate={isStatic ? undefined : { 
                opacity: isUltra ? 0.25 * i : 0.15 * i, 
                scale: isUltra ? 3 * scaleMult : 2.2 * scaleMult, 
                rotate: '360deg' 
            }}
            transition={{ loop: true, type: 'timing', duration: animDuration * 3 }}
            style={styles.nebula3}
          >
            <LinearGradient
              colors={['transparent', PALETTES.nebula_violeta.primary + hexAlpha3, 'transparent']}
              style={[StyleSheet.absoluteFill, { borderRadius: width }]}
            />
          </MotiView>

          {/* Global Blur - Windows Glass Feel */}
          <BlurView
            intensity={isUltra ? 100 : isAhorro ? 30 : 70}
            tint={theme.isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      {/* Noise Texture Overlay */}
      {!isEco && !isAhorro && (
        <View style={[StyleSheet.absoluteFill, { opacity: (theme.isDark ? 0.04 : 0.02) * (isUltra ? 1.5 : 1), pointerEvents: 'none' }]}>
          <ImageBackground
            source={{ uri: 'https://www.transparenttextures.com/patterns/carbon-fibre.png' }} 
            style={StyleSheet.absoluteFill}
            resizeMode="repeat"
          />
        </View>
      )}

      {/* Subtle Bottom vignette to emphasize colors */}
      <LinearGradient
        colors={['transparent', theme.bg + '44', theme.bg]}
        style={[StyleSheet.absoluteFill, { top: height * 0.4 }]}
      />
      
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  nebula1: {
    position: 'absolute',
    width: width * 2.5,
    height: height * 0.8,
    top: -height * 0.2,
    left: -width * 0.5,
  },
  nebula2: {
    position: 'absolute',
    width: width * 2.2,
    height: height * 0.7,
    bottom: -height * 0.1,
    right: -width * 0.6,
  },
  nebula3: {
    position: 'absolute',
    width: width * 2,
    height: height * 0.6,
    top: height * 0.3,
    left: -width * 0.4,
  },
  nebula4: {
    display: 'none', // Simplified to 3 massive layers for better blending
  },
});
