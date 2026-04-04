import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Svg, { Defs, Mask, Rect, Circle } from 'react-native-svg';
import { MotiView, AnimatePresence } from 'moti';
import { useTutorial } from '../services/TutorialService';
import { useTheme } from '../context/ThemeContext';
import CortexCore from './CortexCore';
import { Radius, Shadows } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, X } from 'lucide-react-native';

export default function TutorialOverlay() {
  const { currentStep, isActive, nextStep, stopTutorial, getElementLayout } = useTutorial();
  const { theme } = useTheme();
  const [layout, setLayout] = React.useState({ width: 0, height: 0, x: 0, y: 0 });
  const containerRef = React.useRef<View>(null);

  const measureContainer = () => {
    if (containerRef.current) {
      containerRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          setLayout({ width, height, x, y });
        }
      });
    }
  };

  const elementLayout = useMemo(() => {
    if (!currentStep || !layout.width) return null;
    const raw = getElementLayout(currentStep.targetId);
    if (!raw) return null;
    
    // Convert window coordinates to local coordinates
    return {
      ...raw,
      x: raw.x - layout.x,
      y: raw.y - layout.y
    };
  }, [currentStep, getElementLayout, layout.width, layout.x, layout.y]);

  if (!isActive || !currentStep || !layout.width) {
     // If active but no layout, trigger a measure
     if (isActive) {
         setTimeout(measureContainer, 100);
     }
     if (!isActive || !currentStep) return null;
     // Return empty view while measuring to avoid flicker
     return <View ref={containerRef} style={StyleSheet.absoluteFill} onLayout={measureContainer} pointerEvents="none" />;
  }

  const { width, height } = layout;
  const padding = 8;
  const spotlightX = elementLayout ? elementLayout.x - padding : width / 2 - 50;
  const spotlightY = elementLayout ? elementLayout.y - padding : height / 2 - 50;
  const spotlightW = elementLayout ? elementLayout.width + padding * 2 : 100;
  const spotlightH = elementLayout ? elementLayout.height + padding * 2 : 100;

  return (
    <View 
        ref={containerRef}
        style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 10 }]} 
        pointerEvents="box-none"
        onLayout={measureContainer}
    >
      {/* Dimmed Background with Hole */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <Mask id="mask">
            {/* White covers everything (visible) */}
            <Rect x="0" y="0" width={width || 1000} height={height || 2000} fill="white" />
            {/* Black cuts the hole (hidden/transparent in the final Rect) */}
            {elementLayout && (
              <Rect
                  x={spotlightX}
                  y={spotlightY}
                  width={spotlightW}
                  height={spotlightH}
                  rx={Radius.lg}
                  fill="black"
              />
            )}
          </Mask>
        </Defs>
        <Rect
          x="0"
          y="0"
          width={width || 1000}
          height={height || 2000}
          fill="rgba(0,0,0,0.78)"
          mask="url(#mask)"
        />
      </Svg>

      {/* Content Area */}
      <AnimatePresence>
        <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: 20 }}
            style={styles.container}
            pointerEvents="box-none"
        >
            {/* Pulsing Target Indicator (Rounded Rect) */}
            {elementLayout && (
                <MotiView
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1.05 }}
                    transition={{
                        type: 'timing',
                        duration: 1000,
                        loop: true,
                    }}
                    style={{
                        position: 'absolute',
                        left: spotlightX,
                        top: spotlightY,
                        width: spotlightW,
                        height: spotlightH,
                        borderRadius: Radius.lg,
                        borderWidth: 2,
                        borderColor: theme.primary,
                    }}
                />
            )}

            {/* Corty Positioned relative to spotlight or at bottom */}
            <MotiView 
                animate={{ 
                    top: (spotlightY + spotlightH / 2) > height / 2 
                        ? (spotlightY - 220) 
                        : (spotlightY + spotlightH + 40) 
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 250 }}
                style={styles.cortyContainer}
            >
                <CortexCore 
                    theme={theme} 
                    expression={currentStep.expression} 
                    message={currentStep.text}
                    size={110}
                />
            </MotiView>

            {/* Next Button / Instructions */}
            <MotiView 
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={[styles.footer, { maxWidth: 600, alignSelf: 'center' }]}
            >
                <TouchableOpacity style={styles.skipBtn} onPress={stopTutorial}>
                    <Text style={styles.skipText}>Finalizar Guía</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
                    <LinearGradient
                        colors={[theme.primary, theme.primaryDark || theme.primary]}
                        style={styles.nextGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.nextText}>Siguiente</Text>
                        <ArrowRight size={18} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </MotiView>
        </MotiView>
      </AnimatePresence>

      {/* Trap interaction in the hole if we want it to be truly interactive */}
      {elementLayout && (
          <TouchableOpacity
            style={{
                position: 'absolute',
                left: spotlightX,
                top: spotlightY,
                width: spotlightW,
                height: spotlightH,
                borderRadius: Radius.lg,
            }}
            onPress={() => {
                if (currentStep.onAction) currentStep.onAction();
                nextStep();
            }}
          />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cortyContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 15,
  },
  skipBtn: {
    padding: 15,
  },
  skipText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 1,
    height: 56,
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.md,
  },
  nextGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  nextText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
