import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { 
  X, 
  Info, 
  Wifi, 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  Smartphone,
  ChevronRight,
  BookOpen,
  Brain,
  Sparkles,
  Clock
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { MatteCard } from './design-system/CortexMatte';

const { width } = Dimensions.get('window');

interface ManualStep {
  title: string;
  description: string;
  icon: any;
  color: string;
}

const STEPS: ManualStep[] = [
  {
    title: "Búnker Offline 🛡️",
    description: "Tus datos se guardan instantáneamente en tu dispositivo. Puedes estudiar sin conexión y nada se perderá. Prioridad absoluta a la persistencia local.",
    icon: Database,
    color: '#6366F1'
  },
  {
    title: "Sincronización Hub 🔄",
    description: "Al detectar internet, Cortex Hub sincroniza tu progreso en la nube. El icono de flechas girando indica trabajo en progreso; el CHECK VERDE garantiza seguridad total.",
    icon: RefreshCw,
    color: '#10B981'
  },
  {
    title: "Cortex IA 🧠",
    description: "Accede a tu asistente en la nube. Analiza tus notas, crea resúmenes y te recomienda metas basadas en tu Smart Context.",
    icon: Brain,
    color: '#8B5CF6'
  },
  {
    title: "Memos & Nexus 🪐",
    description: "Sincronización bidireccional entre la web y móvil. Tus ideas rápidas viajan entre dispositivos en milisegundos.",
    icon: Sparkles,
    color: '#F472B6'
  },
  {
    title: "Cronos Academic ⏱️",
    description: "Motor de cálculo de promedios ponderados. Configura tus cortes en Ajustes para predicciones exactas de aprobación.",
    icon: Clock,
    color: '#3B82F6'
  },
  {
    title: "Security Vault 🔐",
    description: "Protege tu identidad con biometría avanzada. Tus credenciales se cifran en el Secure Store de tu dispositivo.",
    icon: ShieldCheck,
    color: '#EF4444'
  }
];

interface UserManualProps {
  visible: boolean;
  onClose: () => void;
}

export default function UserManual({ visible, onClose }: UserManualProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        
        <AnimatePresence>
          {visible && (
            <MotiView
              from={{ scale: 0.9, opacity: 0, translateY: 50 }}
              animate={{ scale: 1, opacity: 1, translateY: 0 }}
              exit={{ scale: 0.9, opacity: 0, translateY: 50 }}
              style={styles.modalContent}
            >
              <MatteCard radius={30} style={styles.glass}>
                <View style={styles.header}>
                  <View style={styles.headerTitle}>
                    <BookOpen size={24} color={theme.primary} />
                    <Text style={[styles.title, { color: theme.text }]}>Cortex Hub OS 3.0</Text>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <X size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                  <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Domina tu arquitectura híbrida (Offline-First) y asegura tu éxito académico.
                  </Text>

                  {STEPS.map((step, index) => (
                    <MotiView
                      key={step.title}
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ delay: 200 + index * 100 }}
                      style={styles.stepCard}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: step.color + '20' }]}>
                        <step.icon size={22} color={step.color} />
                      </View>
                      <View style={styles.stepInfo}>
                        <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
                        <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>{step.description}</Text>
                      </View>
                    </MotiView>
                  ))}

                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    onPress={onClose}
                  >
                    <Text style={styles.actionText}>¡Entendido, Corty!</Text>
                    <ShieldCheck size={20} color="#FFF" />
                  </TouchableOpacity>
                </ScrollView>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    height: '80%',
  },
  glass: {
    flex: 1,
    padding: 25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 25,
  },
  scroll: {
    paddingBottom: 20,
  },
  stepCard: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
    borderRadius: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  actionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
