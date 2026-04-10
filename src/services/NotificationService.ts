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

import Constants from 'expo-constants';

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
   * Programa un recordatorio para una tarea académica con tiempo configurable
   */
  async scheduleTaskReminder(taskId: string, title: string, dateStr: string, offsetMs: number = 86400000) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    const taskDate = new Date(dateStr);
    const triggerDate = new Date(taskDate.getTime() - offsetMs);
    const now = new Date();

    // Calcular segundos restantes hasta el momento de la alerta
    const deltaMs = triggerDate.getTime() - now.getTime();

    if (deltaMs <= 0) {
      console.log(`📡 [NotificationService] Alerta para "${title}" ignorada por estar en el pasado.`);
      return; 
    }

    const deltaSeconds = Math.ceil(deltaMs / 1000);

    // Calcular etiqueta de tiempo para el mensaje
    const hours = offsetMs / 3600000;
    const timeLabel = hours >= 24 ? `${Math.floor(hours / 24)} día(s)` : `${hours} horas`;

    await Notifications.scheduleNotificationAsync({
      identifier: `task_${taskId}`,
      content: {
        title: "Recordatorio de Tarea 📚",
        body: `"${title}" vence en ${timeLabel}. ¡Es hora del Focus Mode! 🧠⚡`,
        data: { taskId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: deltaSeconds,
        channelId: 'default',
        repeats: false,
      },
    });
    
    console.log(`📡 [NotificationService] Alerta programada: ${title} (${timeLabel} antes, en ${deltaSeconds}s)`);
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
  },

  /**
   * Registra el dispositivo para recibir notificaciones push de Expo
   */
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('📡 [NotificationService] Permission not granted for push token');
      return null;
    }

    try {
      // Get the token from Expo
      // 📡 Note: We specify the ID explicitly as a fallback for Dev Builds
      const projectId = 
        Constants.expoConfig?.extra?.eas?.projectId || 
        Constants.easConfig?.projectId ||
        '7fa9f74b-af20-414a-a841-2a4bc8f59f37';
        
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      })).data;
      
      console.log('📡 [NotificationService] Expo Push Token:', token);
      return token;
    } catch (e) {
      console.error('📡 [NotificationService] Error getting push token:', e);
      return null;
    }
  }
};
