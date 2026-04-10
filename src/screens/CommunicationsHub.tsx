import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { useData, AppNotification } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { MatteCard, MatteUnderlay, MatteIconButton } from '../components/design-system/CortexMatte';
import { 
  ChevronLeft, 
  Trash2, 
  Bell, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock,
  Brain,
  Filter,
  Check,
  Zap
} from 'lucide-react-native';
import { Radius, Spacing, Shadows } from '../constants/theme';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function CommunicationsHub({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    clearNotifications, 
    deleteNotification,
    addNotification 
  } = useData();
  const { theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState<'all' | 'important'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  React.useEffect(() => {
    const hasSecurityNotif = notifications.some(n => n.id === 'system_security_check');
    if (!hasSecurityNotif) {
        addNotification({
            id: 'system_security_check',
            title: 'SEGURIDAD: Cuenta Protegida 🛡️',
            body: 'Tu núcleo Cortex está operando bajo el protocolo Búnker v3.5. Encriptación de nivel militar activada.',
            type: 'success',
        });
    }

    const hasUpdateNotif = notifications.some(n => n.id === 'system_update_v35');
    if (!hasUpdateNotif) {
        addNotification({
            id: 'system_update_v35',
            title: 'SISTEMA: Actualización v3.5 🚀',
            body: '¡Ya estás en la versión estable! Disfruta de las mejoras en el motor académico y el nuevo Centro de Comunicaciones.',
            type: 'info',
        });
    }
  }, []);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter(n => n.type === 'warning' || n.type === 'error' || n.title.includes('IMPORTANTE') || n.title.includes('Corty Oracle'));
  }, [notifications, activeFilter]);

  const getIcon = (notif: AppNotification) => {
    const size = 26;
    const strokeWidth = 2.5;

    // 🧠 LOGO CORTY: El cerebro distintivo que el usuario pidió
    if (notif.title.includes("Corty Oracle") || notif.type === 'info') {
        return (
            <View style={[styles.cortyAvatarMini, { backgroundColor: theme.primary + '20' }]}>
                <Brain size={24} color={theme.primary} strokeWidth={strokeWidth} />
            </View>
        );
    }
    
    switch (notif.type) {
      case 'success': return <CheckCircle2 size={size} color={theme.success} strokeWidth={strokeWidth} />;
      case 'warning': return <AlertTriangle size={size} color={theme.warning} strokeWidth={strokeWidth} />;
      case 'error': return <XCircle size={size} color={theme.error} strokeWidth={strokeWidth} />;
      default: return <Zap size={size} color={theme.primary} strokeWidth={strokeWidth} />;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString();
  };

  const handleClearAll = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    clearNotifications();
  };

  const handleMarkAllRead = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markAllNotificationsAsRead();
  };

  const handleNotificationPress = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!notif.action) return;

    // Lógica de navegación basada en acciones
    switch (notif.action) {
      case 'open_academic':
        navigation.navigate('Academic');
        break;
      case 'open_nexus':
        navigation.navigate('Nexus');
        break;
      case 'open_manual':
        navigation.navigate('Settings');
        // El manual suele ser un modal o sección en settings
        break;
      case 'open_cronos':
        navigation.navigate('Cronos');
        break;
      case 'open_chat':
        navigation.navigate('Cortex IA');
        break;
      default:
        console.log('❓ [CommunicationsHub] Acción desconocida:', notif.action);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Premium Header with Blur */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BlurView 
            intensity={Platform.OS === 'ios' ? 40 : 80} 
            tint={theme.isDark ? 'dark' : 'light'} 
            style={StyleSheet.absoluteFill} 
        />
        <View style={styles.headerContent}>
          <MatteIconButton 
            onPress={() => {
                if (navigation.canGoBack()) {
                    navigation.goBack();
                } else {
                    navigation.navigate('Home'); // Fallback seguro
                }
            }}
            size={44}
            radius={22}
            tint={theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
          >
            <ChevronLeft size={24} color={theme.text} />
          </MatteIconButton>
          
          <View style={styles.headerTitleContainer}>
             <Text style={[styles.title, { color: theme.text }]}>Comunicaciones</Text>
             <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Cortex Hub v3.5</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <MatteIconButton 
              onPress={handleMarkAllRead}
              size={44}
              radius={22}
              tint={theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
            >
              <CheckCircle2 size={20} color={theme.success} />
            </MatteIconButton>

            <MatteIconButton 
              onPress={handleClearAll}
              size={44}
              radius={22}
              tint={theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
            >
              <Trash2 size={20} color={theme.error} />
            </MatteIconButton>
          </View>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterRow}>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => {
                setActiveFilter('all');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[
                styles.filterBtn, 
                activeFilter === 'all' && { backgroundColor: theme.primary }
            ]}
          >
            <Text style={[
                styles.filterText, 
                { color: activeFilter === 'all' ? '#FFF' : theme.textSecondary }
            ]}>Todos</Text>
            {activeFilter === 'all' && <Check size={14} color="#FFF" style={{ marginLeft: 4 }} />}
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => {
                setActiveFilter('important');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[
                styles.filterBtn, 
                activeFilter === 'important' && { backgroundColor: theme.primary }
            ]}
          >
            <Text style={[
                styles.filterText, 
                { color: activeFilter === 'important' ? '#FFF' : theme.textSecondary }
            ]}>Importantes</Text>
            {activeFilter === 'important' && <Check size={14} color="#FFF" style={{ marginLeft: 4 }} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <AnimatePresence>
          {filteredNotifications.length === 0 ? (
            <MotiView 
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={styles.emptyContainer}
            >
                <View style={[styles.emptyIconCircle, { backgroundColor: theme.primary + '10' }]}>
                    <Bell size={48} color={theme.primary + '40'} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Silencio absoluto</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                    No hay mensajes en este canal. Todo fluye bajo control.
                </Text>
            </MotiView>
          ) : (
            filteredNotifications.map((notif, index) => (
              <MotiView
                key={notif.id}
                from={{ opacity: 0, translateY: 20, scale: 0.95 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', damping: 20, stiffness: 150, delay: index * 50 }}
              >
                <MatteCard
                  radius={28}
                  onPress={() => handleNotificationPress(notif)}
                  style={[
                    styles.notifCard,
                    { 
                      backgroundColor: notif.read 
                        ? (theme.isDark ? '#1F1F23' : '#FFFFFF') 
                        : (theme.isDark ? '#2A2A32' : '#F0F4FF'),
                      borderColor: notif.read ? 'transparent' : theme.primary + '40',
                      borderWidth: 1.5,
                      marginBottom: 12,
                    },
                  ]}
                >
                  <View style={styles.notifRow}>
                    <View style={[styles.iconBox, { backgroundColor: theme.primary + '10' }]}>
                      {getIcon(notif)}
                      {!notif.read && (
                        <MotiView 
                            from={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={[styles.unreadBadge, { backgroundColor: theme.primary }]} 
                        />
                      )}
                    </View>

                    <View style={styles.notifMain}>
                      <View style={styles.notifHeader}>
                        <Text style={[styles.notifTitle, { color: theme.text }]} numberOfLines={1}>
                          {notif.title}
                        </Text>
                        <TouchableOpacity 
                          onPress={() => {
                            deleteNotification(notif.id);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          }}
                          style={styles.deleteBtn}
                        >
                          <Trash2 size={16} color={theme.textMuted} />
                        </TouchableOpacity>
                      </View>
                      
                      <Text style={[styles.notifBody, { color: theme.textSecondary }]}>
                        {notif.body}
                      </Text>

                      <View style={styles.notifFooter}>
                        <Clock size={12} color={theme.textMuted} />
                        <Text style={[styles.notifTime, { color: theme.textMuted }]}>
                          {formatTime(notif.timestamp)}
                        </Text>
                        {notif.type === 'warning' && (
                            <View style={[styles.typeBadge, { backgroundColor: theme.warning + '20' }]}>
                                <Text style={{ color: theme.warning, fontSize: 10, fontWeight: '800' }}>SISTEMA</Text>
                            </View>
                        )}
                      </View>
                    </View>
                  </View>
                </MatteCard>
              </MotiView>
            ))
          )}
        </AnimatePresence>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 15,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.6,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 15,
  },
  filterBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 15,
  },
  notifCard: {
    padding: 18,
    ...Shadows.md,
  },
  notifRow: {
    flexDirection: 'row',
    gap: 16,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  notifMain: {
    flex: 1,
    gap: 4,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  notifBody: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  notifFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  notifTime: {
    fontSize: 11,
    fontWeight: '700',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  cortyAvatarMini: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  }
});
