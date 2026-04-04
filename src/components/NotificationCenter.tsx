import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { useData, AppNotification } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { MatteCard, MatteUnderlay } from '../components/design-system/CortexMatte';
import { 
  X, 
  Bell, 
  Trash2, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock,
  Brain
} from 'lucide-react-native';
import { Radius, Spacing, Shadows } from '../constants/theme';

const { width } = Dimensions.get('window');

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
  onAction?: (action: string) => void;
}

export default function NotificationCenter({ visible, onClose, onAction }: NotificationCenterProps) {
  const { notifications, markNotificationAsRead, clearNotifications, deleteNotification } = useData();
  const { theme } = useTheme();

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (notif: AppNotification) => {
    const size = 20;
    if (notif.title.includes("Corty Oracle")) {
        return (
            <View style={[styles.cortyAvatarMini, { backgroundColor: theme.primary + '20' }]}>
                <Brain size={18} color={theme.primary} />
            </View>
        );
    }
    switch (notif.type) {
      case 'success': return <CheckCircle2 size={size} color={theme.success} />;
      case 'warning': return <AlertTriangle size={size} color={theme.warning} />;
      case 'error': return <XCircle size={size} color={theme.error} />;
      default: return <Info size={size} color={theme.primary} />;
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onClose} 
        />
        
        <AnimatePresence>
          {visible && (
            <MotiView
              from={{ opacity: 0, scale: 0.9, translateY: 20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, translateY: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 150 }}
              style={styles.modalContainer}
            >
              <MatteUnderlay radius={Radius.xl} />
              <View style={styles.blur}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerTitleRow}>
                    <Text style={[styles.title, { color: theme.text }]}>Notificaciones</Text>
                    {unreadCount > 0 && (
                      <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                        <Text style={styles.badgeText}>{unreadCount}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.headerActions}>
                    {notifications.length > 0 && (
                      <TouchableOpacity 
                        onPress={clearNotifications}
                        style={styles.actionIcon}
                      >
                        <Trash2 size={20} color={theme.textMuted} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                      <X size={24} color={theme.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Content */}
                <ScrollView 
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {notifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <View style={[styles.emptyIconCircle, { backgroundColor: theme.primary + '10' }]}>
                        <Bell size={40} color={theme.primary + '40'} />
                      </View>
                      <Text style={[styles.emptyTitle, { color: theme.text }]}>Todo al día</Text>
                      <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                        No tienes notificaciones pendientes por ahora.
                      </Text>
                    </View>
                  ) : (
                    notifications.map((notif) => (
                      <MatteCard
                        key={notif.id}
                        radius={Radius.lg}
                        onPress={() => {
                          markNotificationAsRead(notif.id);
                          if (notif.action && onAction) {
                            onAction(notif.action);
                          }
                        }}
                        style={[
                          styles.notifCard,
                          { 
                            backgroundColor: notif.title.includes("Corty Oracle") 
                                ? (theme.isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.05)')
                                : 'transparent',
                            borderColor: notif.read ? 'transparent' : (notif.title.includes("Corty Oracle") ? theme.primary + '50' : theme.primary + '30'),
                            borderWidth: 1,
                          }
                        ]}
                      >
                        <View style={styles.notifContent}>
                          <View style={styles.notifIconArea}>
                            {getIcon(notif)}
                            {!notif.read && (
                              <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
                            )}
                          </View>
                          
                          <View style={styles.notifText}>
                            <View style={styles.notifHeaderRow}>
                                <Text style={[styles.notifTitle, { color: theme.text }]}>
                                {notif.title}
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => deleteNotification(notif.id)}
                                    style={styles.deleteIndividual}
                                >
                                    <X size={14} color={theme.textMuted} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.notifBody, { color: theme.textSecondary }]}>
                              {notif.body}
                            </Text>
                            <View style={styles.timeRow}>
                              <Clock size={12} color={theme.textMuted} />
                              <Text style={[styles.notifTime, { color: theme.textMuted }]}>
                                {formatTime(notif.timestamp)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </MatteCard>
                    ))
                  )}
                </ScrollView>
                </View>
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
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: '80%',
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.xl,
  },
  blur: {
    paddingBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    padding: 8,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  notifCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  notifContent: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  notifIconArea: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  notifText: {
    flex: 1,
    gap: 2,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  notifBody: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  notifTime: {
    fontSize: 11,
    fontWeight: '600',
  },
  cortyAvatarMini: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deleteIndividual: {
    padding: 4,
    marginLeft: 8,
    opacity: 0.6,
  },
});
