import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Configuración básica del handler de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationService = {
  /**
   * Solicita permisos al usuario
   */
  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  },

  /**
   * Obtiene el estado actual sin solicitar
   */
  async getPermissionsStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  },

  /**
   * Envía una notificación de prueba inmediata
   */
  async sendTestNotification() {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return false;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Cortex Hub 🔥",
        body: "¡Genial, las notificaciones están activas y a toda marcha! 🚀⚙️🎯",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Inmediata
    });
    return true;
  },

  /**
   * Programa un recordatorio para una tarea académica
   */
  async scheduleTaskReminder(taskId: string, title: string, dateStr: string) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    const taskDate = new Date(dateStr);
    const triggerDate = new Date(taskDate.getTime() - 3600000); // 1 hora antes

    if (triggerDate < new Date()) return; // Ya pasó

    await Notifications.scheduleNotificationAsync({
      identifier: `task_${taskId}`,
      content: {
        title: "Recordatorio de Tarea 📚",
        body: `"${title}" vence en 1 hora. ¡Es hora del Focus Mode! 🧠⚡`,
        data: { taskId },
      },
      trigger: {
        date: triggerDate,
      } as Notifications.DateTriggerInput,
    });
  },

  /**
   * Cancela una notificación específica
   */
  async cancelNotification(id: string) {
    await Notifications.cancelScheduledNotificationAsync(id);
  },

  /**
   * Obtiene un resumen completo de los permisos del sistema
   */
  async getSystemPermissionsStatus() {
    const { status: notificationStatus } = await Notifications.getPermissionsAsync();
    
    let mediaStatus = 'undetermined';
    try {
      const MediaLibrary = require('expo-media-library');
      const { status } = await MediaLibrary.getPermissionsAsync();
      mediaStatus = status;
    } catch (e) {}

    return {
      notifications: notificationStatus,
      media: mediaStatus,
      battery: 'needs_check' // No hay API directa en Expo para esto sin nativos adicionales
    };
  }
};
