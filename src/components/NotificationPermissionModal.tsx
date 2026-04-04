import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Dimensions, 
  Platform 
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Bell, Sparkles, Brain, CheckCircle2, X, Zap } from 'lucide-react-native';
import { MatteCard } from './design-system/CortexMatte';
import { Colors, Radius, Spacing, Shadows } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function NotificationPermissionModal({ visible, onAccept, onDecline }: Props) {
  const { theme } = useTheme();
  
  const Benefit = ({ icon: Icon, text, color }: { icon: any, text: string, color: string }) => (
    <View style={styles.benefitRow}>
      <View style={[styles.benefitIcon, { backgroundColor: color + '15' }]}>
        <Icon size={16} color={color} />
      </View>
      <Text style={[styles.benefitText, { color: theme.textSecondary }]}>{text}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDecline}>
      <View style={styles.overlay}>
        <AnimatePresence>
          {visible && (
            <MotiView
              from={{ opacity: 0, scale: 0.9, translateY: 30 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, translateY: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 150 }}
              style={styles.container}
            >
              <MatteCard radius={32} style={styles.glass}>
                <View style={styles.content}>
                  {/* Top Graphic */}
                  <View style={styles.headerGraphic}>
                    <MotiView
                        from={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 300, type: 'spring' }}
                        style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}
                    >
                        <Bell size={42} color={theme.primary} />
                        <MotiView
                            from={{ rotate: '-15deg' }}
                            animate={{ rotate: '15deg' }}
                            transition={{ loop: true, duration: 2000, type: 'timing', repeatReverse: true }}
                            style={styles.bellBadge}
                        >
                            <Zap size={14} color="#FFF" />
                        </MotiView>
                    </MotiView>
                  </View>
                  
                  <Text style={[styles.title, { color: theme.text }]}>Activar Cortex Hub</Text>
                  <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Para que tu academia inteligente funcione al 100%, necesitamos enviarte alertas críticas de sincronización y metas.
                  </Text>
                  
                  <View style={styles.benefits}>
                    <Benefit icon={Sparkles} text="Sincronización en la Nube HubOS" color="#10B981" />
                    <Benefit icon={Brain} text="Consejos Proactivos de Oracle AI" color="#8B5CF6" />
                    <Benefit icon={CheckCircle2} text="Alertas de Metas y Promedios" color="#3B82F6" />
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.btn, { backgroundColor: theme.primary }]}
                    onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        onAccept();
                    }}
                  >
                    <Text style={styles.btnText}>HABILITAR HUB</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={onDecline} style={styles.skipBtn}>
                    <Text style={[styles.skipText, { color: theme.textMuted }]}>Configurar después</Text>
                  </TouchableOpacity>
                </View>
              </MatteCard>
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 360,
  },
  glass: {
    padding: Spacing.xl,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
  },
  headerGraphic: {
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
    marginBottom: Spacing.xl,
  },
  benefits: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  btn: {
    width: '100%',
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  skipBtn: {
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.6,
  },
});
