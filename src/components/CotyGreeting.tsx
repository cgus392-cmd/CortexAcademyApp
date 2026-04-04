import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import Svg, { Rect, Path } from 'react-native-svg';

const PixelCotySvg = ({ size = 60 }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
     {/* Antenna - Exact Pixel Style */}
     <Rect x="15" y="1" width="2" height="2" fill="#FF4D4D" />
     <Rect x="15.5" y="3" width="1" height="3" fill="#1E293B" />
     
     {/* Body Shadow (Subtle) */}
     <Rect x="7" y="7" width="18" height="15" fill="#E2E8F0" />
     
     {/* Body - Main White (Blocky) */}
     <Rect x="6" y="6" width="18" height="14" fill="#FFFFFF" />
     <Rect x="7" y="5" width="16" height="1" fill="#FFFFFF" />
     <Rect x="7" y="20" width="16" height="1" fill="#FFFFFF" />
     
     {/* Border - Pixel Style */}
     <Path d="M 7 5 H 23 M 6 6 V 20 M 24 6 V 20 M 7 21 H 23" stroke="#1E293B" strokeWidth="1" />
     
     {/* Screen - Dark Navy */}
     <Rect x="9" y="8" width="12" height="9" fill="#1E293B" />
     
     {/* Eyes - Red Pixels (Glowing style) */}
     <Rect x="11" y="11" width="3" height="3" fill="#FF4D4D" opacity="0.9" />
     <Rect x="16" y="11" width="3" height="3" fill="#FF4D4D" opacity="0.9" />
     
     {/* ARMS - NEW POSE: Right waving, Left pointing down */}
     {/* Right Arm (Waving - Top Right) */}
     <Path d="M 24 10 H 27 V 7 H 29 V 5" stroke="#1E293B" strokeWidth="1" fill="none" />
     <Rect x="28" y="4" width="3" height="3" fill="#FFFFFF" stroke="#1E293B" strokeWidth="0.5" />
     
     {/* Left Arm (Pointing DOWN - Bottom Left) */}
     <Path d="M 6 15 H 3 V 18 H 1 V 20" stroke="#1E293B" strokeWidth="1" fill="none" />
     <Path d="M 1 20 L 0 22 L 2 22 Z" fill="#1E293B" /> {/* Small pointing tip */}
  </Svg>
);

const PixelBubbleTail = () => (
  <View style={styles.tailContainer}>
    {/* Zig-Zag Pixelated Tail pointing to Coty (on the right of the bubble) */}
    <View style={[styles.tailStep, { marginRight: 0 }]} />
    <View style={[styles.tailStep, { marginRight: 2 }]} />
    <View style={[styles.tailStep, { marginRight: 4 }]} />
    <View style={[styles.tailStep, { marginRight: 6 }]} />
  </View>
);

export default function CotyGreeting({ isVisible, rightOffset = 120 }: { isVisible: boolean, rightOffset?: number }) {
  if (!isVisible) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 30, scale: 0.8 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      exit={{ opacity: 0, translateY: 20, scale: 0.8 }}
      transition={{ type: 'spring', damping: 15, stiffness: 120, delay: 600 }}
      style={[styles.container, { right: rightOffset }]}
      pointerEvents="box-none"
    >
      <MotiView from={{ opacity: 0, scale: 0.5, translateX: 20, translateY: 10 }} animate={{ opacity: 1, scale: 1, translateX: 0, translateY: 0 }} transition={{ type: 'spring', damping: 12, delay: 1300 }} style={styles.bubbleContainer}><View style={styles.bubble}><Text style={styles.bubbleText}>{`¡Hola! ¿Cómo estás?\nEstoy por aquí para que me preguntes cualquier cosa 👋`}</Text></View><PixelBubbleTail /></MotiView><MotiView style={{ alignItems: 'center' }}><PixelCotySvg size={55} /></MotiView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 56, // Calibrado para sentarse sobre la barra de 70px
    zIndex: 1000,
    alignItems: 'center',
  },
  bubbleContainer: {
    position: 'absolute',
    top: -55,  
    right: 35, // Ahora la burbuja se expande a la IZQUIERDA de Coty
    alignItems: 'flex-end',
  },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1E293B',
    padding: 10,
    paddingHorizontal: 16,
    borderRadius: 2, 
    minWidth: 160,
    maxWidth: 220,
    // Sombra Pixelada Sólida
    shadowColor: '#1E293B',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 2,
  },
  bubbleText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 14,
    fontFamily: 'monospace',
  },
  tailContainer: {
    marginTop: -2,
    marginRight: 10,
  },
  tailStep: {
    width: 3,
    height: 3,
    backgroundColor: '#1E293B',
    marginBottom: -1, 
  },
});
