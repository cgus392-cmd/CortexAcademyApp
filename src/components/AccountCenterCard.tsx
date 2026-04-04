import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Brain, ChevronRight, Share2 } from 'lucide-react-native';
import { MotiView } from 'moti';
import { MatteCard } from './design-system/CortexMatte';

interface AccountCenterCardProps {
  onPress: () => void;
  theme: any;
}

const AccountCenterCard: React.FC<AccountCenterCardProps> = ({ onPress, theme }) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.container}>
      <MatteCard 
        radius={32} 
        style={styles.card} 
        baseColor={theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)"}
      >
        <View style={styles.content}>
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
          >
            <View style={[
              styles.logoContainer, 
              { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }
            ]}>
              <Brain size={26} strokeWidth={1.5} color={theme.primary} />
              
              {/* Firebase Engine Badge */}
              <View style={[styles.engineBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.engineLetter}>F</Text>
              </View>
            </View>
          </MotiView>

          {/* Text Section */}
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={[styles.mainLabel, { color: theme.text }]}>Centro de cuentas</Text>
              <View style={styles.badge}>
                <Share2 size={10} color="#FFF" />
                <Text style={styles.badgeText}>Meta-Ready</Text>
              </View>
            </View>
            <Text style={[styles.subLabel, { color: theme.textMuted }]}>
              Perfil, seguridad, respaldo de datos y más...
            </Text>
          </View>

          <ChevronRight size={18} color={theme.textMuted} />
        </View>
      </MatteCard>
      
      {/* Label above */}
      <Text style={[styles.topLabel, { color: theme.textMuted }]}>Tu cuenta</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
    marginTop: 10,
  },
  topLabel: {
    position: 'absolute',
    top: -18,
    left: 4,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  card: {
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  logoContainer: {
    width: 52,
    height: 52,
    borderRadius: 18, 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  },
  engineBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  engineLetter: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  textContainer: {
    flex: 1,
    gap: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainLabel: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    opacity: 0.7,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0064E0', 
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});

export default AccountCenterCard;
