import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import Svg, { Path, Circle, G, Line } from 'react-native-svg';

const { width } = Dimensions.get('window');

type Expression = 'normal' | 'happy' | 'thinking' | 'hidden' | 'success' | 'wink';

interface CortexCoreProps {
  expression?: Expression;
  message?: string;
  isPasswordFocused?: boolean;
  showPassword?: boolean;
  isSuccess?: boolean;
  theme: any;
  size?: number;
}

export default function CortexCore({
  expression = 'normal',
  message,
  isPasswordFocused = false,
  showPassword = false,
  isSuccess = false,
  theme,
  size = 120
}: CortexCoreProps) {
  const [currentMessage, setCurrentMessage] = useState(message);
  
  // Update internal message when prop changes
  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
    }
  }, [message]);

  // Determine actual expression based on legacy props or explicit prop
  const activeExpression = useMemo(() => {
    if (isSuccess) return 'success';
    if (isPasswordFocused && !showPassword) return 'hidden';
    return expression;
  }, [expression, isSuccess, isPasswordFocused, showPassword]);

  return (
    <View style={[styles.container, { width: size * 1.5, height: size * 1.8 }]}>
      {/* Area for Speech Bubble */}
      <View style={styles.bubbleArea}>
        <AnimatePresence exitBeforeEnter>
          {!!currentMessage && (
            <MotiView
              key={currentMessage}
              from={{ opacity: 0, scale: 0.5, translateY: 10 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              exit={{ opacity: 0, scale: 0.8, translateY: -5 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200, mass: 1 }}
              style={[styles.bubble, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.95)' : '#111' }]}
            >
              <Text style={[styles.bubbleText, { color: theme.isDark ? '#111' : '#fff' }]}>
                {currentMessage}
              </Text>
              {/* Bubble Tail */}
              <View style={[styles.bubbleTail, { borderTopColor: theme.isDark ? 'rgba(255,255,255,0.95)' : '#111' }]} />
            </MotiView>
          )}
        </AnimatePresence>
      </View>

      {/* Area for Robot */}
      <MotiView
        animate={{ translateY: [0, -6, 0] }}
        transition={{ loop: true, duration: 3200, type: 'timing' }}
        style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      >
        <Svg viewBox="0 0 200 200" width={size} height={size}>
          {/* Aura Background */}
          <Circle 
            cx="100" 
            cy="100" 
            r="70" 
            fill={activeExpression === 'success' ? theme.success + '15' : theme.primary + '10'} 
          />
          
          {/* Antenna */}
          <G>
            <Line 
              x1="100" y1="40" x2="100" y2="25" 
              stroke={activeExpression === 'success' ? theme.success : theme.primary} 
              strokeWidth="4" 
              strokeLinecap="round" 
            />
            <MotiView
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ loop: true, duration: 2000 }}
            >
              <Circle 
                cx="100" cy="20" r="6" 
                fill={activeExpression === 'success' ? theme.success : theme.secondary || theme.primary} 
              />
            </MotiView>
          </G>

          {/* Body Shape */}
          <Path
            d="M 50 80 Q 50 40 100 40 Q 150 40 150 80 L 150 140 Q 150 160 100 160 Q 50 160 50 140 Z"
            fill={theme.isDark ? "#FFFFFF" : "rgba(255,255,255,0.98)"}
            stroke={activeExpression === 'success' ? theme.success : (theme.isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)")}
            strokeWidth="2"
          />

          {/* Mask / Screen Area */}
          <Path 
            d="M 60 85 Q 60 65 100 65 Q 140 65 140 85 L 140 115 Q 140 135 100 135 Q 60 135 60 115 Z" 
            fill="#1e293b" 
          />

          {/* Eyes / Face Expressions */}
          <G>
            {activeExpression === 'success' || activeExpression === 'happy' ? (
              <G translate="0, 5">
                <Path d="M 75 105 Q 85 90 95 105" fill="none" stroke={theme.success || theme.primary} strokeWidth="6" strokeLinecap="round" />
                <Path d="M 105 105 Q 115 90 125 105" fill="none" stroke={theme.success || theme.primary} strokeWidth="6" strokeLinecap="round" />
              </G>
            ) : activeExpression === 'hidden' ? (
              <G>
                {/* Closed eyes lines */}
                <Line x1="75" y1="100" x2="95" y2="100" stroke={theme.primary} strokeWidth="4" opacity="0.3" />
                <Line x1="105" y1="100" x2="125" y2="100" stroke={theme.primary} strokeWidth="4" opacity="0.3" />
                {/* Hands coming from bottom */}
                <G>
                    <Path d="M 65 140 Q 80 100 90 100" fill="white" stroke={theme.primary} strokeWidth="2" />
                    <Path d="M 135 140 Q 120 100 110 100" fill="white" stroke={theme.primary} strokeWidth="2" />
                </G>
              </G>
            ) : (
              <G>
                {/* Normal eyes - Removing MotiView from inside Svg to fix disappearing eyes */}
                 <Circle cx="85" cy="100" r="7" fill={theme.primary} />
                 <Circle cx="87" cy="98" r="2.5" fill="white" />
                 <Circle cx="115" cy="100" r="7" fill={theme.primary} />
                 <Circle cx="117" cy="98" r="2.5" fill="white" />
              </G>
            )}
          </G>
        </Svg>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleArea: {
    height: '40%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    maxWidth: width * 0.85,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    position: 'relative',
  },
  bubbleText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  }
});
