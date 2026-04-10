import messaging from '@react-native-firebase/messaging';
import { db, auth } from './firebase';
import { Platform, PermissionsAndroid } from 'react-native';

/**
 * MessagingService handles all Firebase Cloud Messaging (FCM) 
 * logic for remote push notifications.
 */
export const MessagingService = {
  /**
   * Request user permission for notifications
   * For Android 13+, explicit permission is required.
   */
  async requestUserPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const status = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return status === PermissionsAndroid.RESULTS.GRANTED;
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('📡 [Messaging] Authorization status:', authStatus);
    }
    return enabled;
  },

  /**
   * Get FCM Token and subscribe user to the global topic
   * Also saves the token in Firestore for targeted broadcasts.
   */
  async initializeFCM() {
    const hasPermission = await this.requestUserPermission();
    if (!hasPermission) return null;

    try {
      // Get the token
      const token = await messaging().getToken();
      if (!token) return null;

      console.log('📡 [Messaging] FCM Token generated');
      
      // Save token to Firestore if user is authenticated
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        await db.collection('users').doc(uid).set({
          pushToken: token,
          lastTokenUpdate: new Date().toISOString(),
          platform: Platform.OS
        }, { merge: true });
        
        console.log('📡 [Messaging] Token registered in Cloud Firestore');
      }

      // Subscribe to global topic for mass broadcasts
      await messaging().subscribeToTopic('all_users');
      console.log('📡 [Messaging] Subscribed to global topic');

      return token;
    } catch (error) {
      console.error('📡 [Messaging] Initialization error:', error);
      return null;
    }
  },

  /**
   * Set up listeners for when the app is in the foreground
   */
  setupForegroundListener(onMessageReceived: (message: any) => void) {
    return messaging().onMessage(async remoteMessage => {
      console.log('📡 [Messaging] Foreground message received:', remoteMessage);
      onMessageReceived(remoteMessage);
    });
  },

  /**
   * Handle the notification when the app is opened from a quit state
   */
  async handleInitialNotification() {
    const remoteMessage = await messaging().getInitialNotification();
    if (remoteMessage) {
      console.log('📡 [Messaging] App opened from quit state:', remoteMessage);
      return remoteMessage;
    }
    return null;
  }
};
