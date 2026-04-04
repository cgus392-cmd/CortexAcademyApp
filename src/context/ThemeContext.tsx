import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme, Appearance } from 'react-native';
import { PALETTES, Colors } from '../constants/theme';
import { useData } from './DataContext';

const THEME_STORAGE_KEY = '@cortex_theme_pref';

type ThemeId = keyof typeof PALETTES;
type ThemeType = typeof Colors & typeof PALETTES.cortex_classic & { 
  isDark: boolean;
  nebulaIntensity: number;
  glassOpacity: number;
  glassBlur: number;
  performanceMode: 'eco' | 'ahorro' | 'balanced' | 'ultra';
  compactMode: boolean;
};

interface ThemeContextType {
  themeId: ThemeId;
  theme: ThemeType;
  setTheme: (id: ThemeId) => void;
  toggleTheme: () => void;
  setDarkMode: (mode: 'light' | 'dark' | 'auto') => void;
  darkMode: 'light' | 'dark' | 'auto';
  // Matte OS Appearance Tokens
  nebulaIntensity: number;
  glassOpacity: number;
  glassBlur: number;
  performanceMode: 'eco' | 'ahorro' | 'balanced' | 'ultra';
  compactMode: boolean;
  updateAppearance: (updates: { 
    intensity?: number; 
    opacity?: number; 
    blur?: number;
    performanceMode?: 'eco' | 'ahorro' | 'balanced' | 'ultra';
    compactMode?: boolean;
  }) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<ThemeId>('cortex_classic');
  const [darkModePref, setDarkModePref] = useState<'light' | 'dark' | 'auto'>('auto');
  const [nebulaIntensity, setNebulaIntensity] = useState(0.8);
  const [glassOpacity, setGlassOpacity] = useState(0.35);
  const [glassBlur, setGlassBlur] = useState(45);
  const [performanceMode, setPerformanceMode] = useState<'eco' | 'ahorro' | 'balanced' | 'ultra'>('balanced');
  const [compactMode, setCompactMode] = useState(false);
  const systemColorScheme = useColorScheme();
  const { userProfile, updateUserProfile } = useData();
  
  // Load persistence
  useEffect(() => {
    const loadPref = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved) setDarkModePref(saved as any);
        
        const savedAppearance = await AsyncStorage.getItem('@cortex_appearance_pref');
        if (savedAppearance) {
            const { intensity, opacity, blur, performanceMode: perf, compactMode: comp } = JSON.parse(savedAppearance);
            if (intensity !== undefined) setNebulaIntensity(intensity);
            if (opacity !== undefined) setGlassOpacity(opacity);
            if (blur !== undefined) setGlassBlur(blur);
            if (perf !== undefined) setPerformanceMode(perf);
            if (comp !== undefined) setCompactMode(comp);
        }
      } catch (e) { console.error('Error loading theme:', e); }
    };
    loadPref();

    // Appearance listener as backup for hook flakiness
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      // Re-render handled by systemColorScheme hook, but this ensures background sync
    });
    return () => listener.remove();
  }, []);

  // Sync with userProfile once loaded
  useEffect(() => {
    if (userProfile?.preferences?.darkMode) {
      setDarkModePref(userProfile.preferences.darkMode);
    }
    if (userProfile?.theme && PALETTES[userProfile.theme as ThemeId]) {
      setThemeId(userProfile.theme as ThemeId);
    }
    // Sync appearance from profile
    if (userProfile?.preferences) {
        if (userProfile.preferences.nebulaIntensity !== undefined) setNebulaIntensity(userProfile.preferences.nebulaIntensity);
        if (userProfile.preferences.glassOpacity !== undefined) setGlassOpacity(userProfile.preferences.glassOpacity);
        if (userProfile.preferences.glassBlur !== undefined) setGlassBlur(userProfile.preferences.glassBlur);
        if (userProfile.preferences.performanceMode !== undefined) setPerformanceMode(userProfile.preferences.performanceMode);
        if (userProfile.preferences.compactMode !== undefined) setCompactMode(userProfile.preferences.compactMode);
    }
  }, [userProfile?.preferences, userProfile?.theme]);

  const isDark = darkModePref === 'auto' 
    ? (systemColorScheme === 'dark') 
    : darkModePref === 'dark';

  const lightBase = {
      bg: '#F4F5F7',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      text: '#0F172A',
      textSecondary: '#64748B',
      textMuted: '#94A3B8',
      border: 'rgba(0,0,0,0.06)',
      divider: '#E2E8F0',
      inputBg: '#F1F5F9',
      glassBase: 'rgba(255, 255, 255, 0.75)',
      glassBorder: 'rgba(255, 255, 255, 0.5)',
      glassHighlight: 'rgba(255, 255, 255, 1)',
      glassSpecular1: 'rgba(255, 255, 255, 0.6)',
      glassSpecular3: 'rgba(255, 255, 255, 0.2)',
      overlay: 'rgba(0, 0, 0, 0.4)',
  };

  const darkBase = {
      bg: '#000000',
      surface: '#101010',
      surfaceElevated: '#1a1a1a',
      text: '#FFFFFF',
      textSecondary: '#A1A1AA',
      textMuted: '#71717A',
      border: 'rgba(255,255,255,0.1)',
      divider: '#27272A',
      inputBg: '#27272A',
      glassBase: 'rgba(0, 0, 0, 0.45)',
      glassBorder: 'rgba(255, 255, 255, 0.15)',
      glassHighlight: 'rgba(255, 255, 255, 0.05)',
      glassSpecular1: 'rgba(0,0,0,0.8)',
      glassSpecular3: 'rgba(255,255,255,0.05)',
      overlay: 'rgba(0, 0, 0, 0.7)',
  };

  const theme = {
    ...Colors,
    ...(isDark ? darkBase : lightBase),
    ...PALETTES[themeId],
    isDark,
    nebulaIntensity,
    glassOpacity,
    glassBlur,
    performanceMode,
    compactMode,
  };

  const setDarkMode = async (mode: 'light' | 'dark' | 'auto') => {
    setDarkModePref(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {}
    updateUserProfile({ preferences: { ...userProfile?.preferences, darkMode: mode } });
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setDarkMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ 
      themeId, 
      theme, 
      setTheme: (id: ThemeId) => {
          setThemeId(id);
          updateUserProfile({ theme: id });
      }, 
      toggleTheme, 
      setDarkMode, 
      darkMode: darkModePref,
      nebulaIntensity,
      glassOpacity,
      glassBlur,
      performanceMode,
      compactMode,
      updateAppearance: async (updates) => {
          if (updates.intensity !== undefined) setNebulaIntensity(updates.intensity);
          if (updates.opacity !== undefined) setGlassOpacity(updates.opacity);
          if (updates.blur !== undefined) setGlassBlur(updates.blur);
          if (updates.performanceMode !== undefined) setPerformanceMode(updates.performanceMode);
          if (updates.compactMode !== undefined) setCompactMode(updates.compactMode);
          
          try {
              const current = { 
                  intensity: updates.intensity ?? nebulaIntensity, 
                  opacity: updates.opacity ?? glassOpacity, 
                  blur: updates.blur ?? glassBlur,
                  performanceMode: updates.performanceMode ?? performanceMode,
                  compactMode: updates.compactMode ?? compactMode
              };
              await AsyncStorage.setItem('@cortex_appearance_pref', JSON.stringify(current));
              updateUserProfile({ 
                  preferences: { 
                      ...userProfile?.preferences, 
                      nebulaIntensity: current.intensity,
                      glassOpacity: current.opacity,
                      glassBlur: current.blur,
                      performanceMode: current.performanceMode,
                      compactMode: current.compactMode
                  } 
              });
          } catch (e) {}
      }
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
