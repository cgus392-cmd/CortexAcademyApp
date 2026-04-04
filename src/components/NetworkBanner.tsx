import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Wifi, WifiOff, Globe } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { Spacing } from '../constants/theme';
import { BlurView } from 'expo-blur';

export default function NetworkBanner() {
  const { isConnected } = useData();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    if (isConnected === true) {
      setShowOnline(true);
      const timer = setTimeout(() => setShowOnline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  return (
    <View style={[styles.container, { top: insets.top }]}>
      <AnimatePresence>
        {isConnected === false && (
          <MotiView
            key="offline"
            from={{ translateY: -100, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            style={[styles.banner, styles.offline]}
          >
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <WifiOff size={16} color="#FFF" />
            <Text style={styles.text}>Modo Offline Activado 🚫</Text>
          </MotiView>
        )}

        {showOnline && isConnected === true && (
          <MotiView
            key="online"
            from={{ translateY: -100, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            style={[styles.banner, styles.online, { backgroundColor: theme.primary }]}
          >
             <Globe size={16} color="#FFF" />
             <Text style={styles.text}>¡Conexión Recuperada! 🌐✨</Text>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  offline: {
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  online: {
    backgroundColor: '#10B981',
  },
  text: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
