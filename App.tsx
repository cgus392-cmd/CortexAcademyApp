import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, ScrollView, LogBox } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { DataProvider, useData } from './src/context/DataContext';
import CortexLock from './src/components/CortexLock';
import { NotificationService } from './src/services/NotificationService';
import { db } from './src/services/firebase';
import * as Notifications from 'expo-notifications';
import logger from './src/services/Logger';

// 🛡️ Inicialización del Diagnóstico Cortex
logger.init();

// Suppress non-fatal warnings
LogBox.ignoreLogs([
  'This method is deprecated (as well as all React Native Firebase namespaced API)',
  'SafeAreaView has been deprecated',
]);

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#990000', padding: 20, paddingTop: 50 }}>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
            CRITICAL JS ERROR
          </Text>
          <ScrollView>
            <Text style={{ color: 'white', fontSize: 16, marginBottom: 10 }}>
              {this.state.error && this.state.error.toString()}
            </Text>
            <Text style={{ color: '#ffaaaa', fontSize: 12 }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

import { TutorialProvider } from './src/services/TutorialService';
import NetworkBanner from './src/components/NetworkBanner';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as RootNavigation from './src/navigation/RootNavigation';
import GlobalBroadcast from './src/components/GlobalBroadcast';

function AppRoot() {
  const { userProfile, isLoading, updateUserProfile, updatePushTokenImmediately, addNotification } = useData();
  const [isLocked, setIsLocked] = React.useState(false);
  const [hasCheckedVault, setHasCheckedVault] = React.useState(false);

  // 📡 Push Token & Notification Listeners (MOVED TO TOP)
  React.useEffect(() => {
    const initPush = async () => {
      if (userProfile?.uid && !isLoading) {
        console.log('-------------------------------------------');
        console.log('📡 [DEBUG] INICIANDO REGISTRO DE PUSH TOKEN...');
        const token = await NotificationService.registerForPushNotificationsAsync();
        if (token) {
          console.log('✅ [DEBUG] TOKEN OBTENIDO:', token);
          if (userProfile.expoPushToken !== token) {
            await updatePushTokenImmediately(token);
          }
           // Local test to confirm engine
           await Notifications.scheduleNotificationAsync({
            content: { title: "Cortex OK ✅", body: "Motor de push activo." },
            trigger: null,
          });
        }
        console.log('-------------------------------------------');
      }
    };
    initPush();

    const nL = Notifications.addNotificationReceivedListener(n => {
      const isRemote = n.request.trigger && (n.request.trigger as any).type !== 'immediate';
      console.log(`🔔 RECEIVED (${isRemote ? 'REMOTE' : 'LOCAL'}):`, n);
      
      const { title, body, data } = n.request.content;
      addNotification({
        title: title || 'Notificación',
        body: body || '',
        type: (data?.type as any) || 'info',
        action: data?.action as string
      });
    });

    const rL = Notifications.addNotificationResponseReceivedListener(r => {
      console.log('🔔 TAPPED:', r);
      const { data } = r.notification.request.content;
      
      // Al tocar la notificación, primero vamos al Hub
      RootNavigation.navigate('CommunicationsHub');
      
      // Nota: La lógica de navegación específica por 'action' ya está en CommunicationsHub.tsx
      // Pero si quisiéramos redirigir directo desde aquí podrías hacerlo con:
      // if (data?.action) { ... }
    });
    return () => { nL.remove(); rL.remove(); };
  }, [userProfile?.uid, isLoading]);

  // 🔒 Vault Lock Logic
  React.useEffect(() => {
    if (!isLoading && userProfile && !hasCheckedVault) {
      if (userProfile.vaultEnabled) setIsLocked(true);
      setHasCheckedVault(true);
    }
    if (!userProfile) { setHasCheckedVault(false); setIsLocked(false); }
  }, [userProfile, isLoading, hasCheckedVault]);

  return (
    <View style={{ flex: 1 }}>
      <NetworkBanner />
      <GlobalBroadcast />
      {isLocked ? (
        <CortexLock userName={userProfile?.name} onUnlock={() => setIsLocked(false)} />
      ) : (
        <ErrorBoundary>
          <AppNavigator />
        </ErrorBoundary>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <ThemeProvider>
          <TutorialProvider>
            <AppRoot />
          </TutorialProvider>
        </ThemeProvider>
      </DataProvider>
    </SafeAreaProvider>
  );
}
