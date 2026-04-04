import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { MotiView } from 'moti';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface SettingCellProps {
  label: string;
  subLabel?: string;
  icon: React.ReactNode;
  onPress: () => void;
  rightElement?: React.ReactNode;
  isLast?: boolean;
}

export default function SettingCell({ 
    label, 
    subLabel, 
    icon, 
    onPress, 
    rightElement,
    isLast 
}: SettingCellProps) {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={onPress}
        style={[styles.container, !isLast && { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' }]}
    >
      <MotiView 
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        style={[
            styles.iconContainer, 
            { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }
        ]}
      >
        {icon}
      </MotiView>
      
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        {subLabel && <Text style={[styles.subLabel, { color: theme.textSecondary }]}>{subLabel}</Text>}
      </View>
      
      <View style={styles.rightContainer}>
        {rightElement ? rightElement : <ChevronRight size={18} color={theme.textMuted} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
