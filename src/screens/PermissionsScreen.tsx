import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  AppState,
  Alert,
  PermissionsAndroid
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Bell, 
  Battery, 
  FolderOpen, 
  ShieldCheck, 
  ExternalLink,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { MotiView, AnimatePresence } from 'moti';
import * as Notifications from 'expo-notifications';
import * as MediaLibrary from 'expo-media-library';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Application from 'expo-application';

import { useTheme } from '../context/ThemeContext';
import CleanBackground from '../components/CleanBackground';
import { MatteCard, MatteIconButton } from '../components/design-system/CortexMatte';
import FocusTransition from '../components/FocusTransition';

type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'restricted';

export default function PermissionsScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [notifStatus, setNotifStatus] = useState<PermissionStatus>('undetermined');
  const [storageStatus, setStorageStatus] = useState<PermissionStatus>('undetermined');
  const [appState, setAppState] = useState(AppState.currentState);

  const isDark = theme.isDark;

  // Actualizar estados al montar y al volver a la app
  useEffect(() => {
    checkAllPermissions();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        checkAllPermissions();
      }
      setAppState(nextAppState);
    });

    return () => subscription.remove();
  }, [appState]);

  const checkAllPermissions = async () => {
    try {
      console.log("Checking all permissions...");
      
      const { status: nStatus } = await Notifications.getPermissionsAsync();
      setNotifStatus(nStatus);

      if (Platform.OS === 'android') {
          const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version as string, 10);
          const perm = apiLevel >= 33 ? 'android.permission.READ_MEDIA_IMAGES' : 'android.permission.READ_EXTERNAL_STORAGE';
          const hasStorage = await PermissionsAndroid.check(perm as any);
          setStorageStatus(hasStorage ? 'granted' : 'undetermined');
      } else {
          const { status: sStatus } = await MediaLibrary.getPermissionsAsync();
          setStorageStatus(sStatus);
      }
      
    } catch (e) {
      console.log("Critical Error in checkAllPermissions:", e);
    }
  };

  const requestNotificationPermission = async () => {
    console.log("Btn: Notificaciones presionado");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (notifStatus === 'granted') {
        Linking.openSettings();
        return;
    }

    try {
      const response = await Notifications.requestPermissionsAsync();
      setNotifStatus(response.status);
      
      // Solo manda a ajustes si el usuario le dio "No volver a preguntar"
      if (response.status !== 'granted' && !response.canAskAgain) {
          Alert.alert("Permiso Denegado", "Las notificaciones están bloqueadas permanentemente. Áctivalas en los ajustes.", [
            { text: "Abrir Ajustes", onPress: () => Linking.openSettings() },
            { text: "Cancelar", style: "cancel" }
          ]);
      }
    } catch (e) {
      Linking.openSettings();
    }
  };

  const requestStoragePermission = async () => {
    console.log("Btn: Almacenamiento presionado");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (storageStatus === 'granted') {
        Linking.openSettings();
        return;
    }

    if (Platform.OS === 'android') {
        try {
            const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version as string, 10);
            
            // Usamos el string crudo para evitar undefined crashes en versiones antiguas de RN
            const permissionToRequest = apiLevel >= 33 
                ? 'android.permission.READ_MEDIA_IMAGES' 
                : 'android.permission.READ_EXTERNAL_STORAGE';
                
            const grantedResult = await PermissionsAndroid.request(permissionToRequest as any);
            console.log("Resultado del Pop-up:", grantedResult);
            
            if (grantedResult === PermissionsAndroid.RESULTS.GRANTED) {
                setStorageStatus('granted');
            } else if (grantedResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
                setStorageStatus('denied');
                Alert.alert("Acceso Bloqueado", "Has denegado el permiso de fotos permanentemente. Para activarlo, ve a los ajustes de la app.", [
                    { text: "Abrir Ajustes", onPress: () => Linking.openSettings() },
                    { text: "Cancelar", style: "cancel" }
                ]);
            } else {
                // Fue 'denied' simple (le dio a no permitir una sola vez). No hacemos modal de ajustes aún.
                setStorageStatus('denied');
            }
        } catch (err) {
            console.log("Error al lanzar pop-up de almacenamiento:", err);
            Linking.openSettings();
        }
    } else {
        try {
          const res = await MediaLibrary.requestPermissionsAsync();
          setStorageStatus(res.status);
          if (res.status !== 'granted' && !res.canAskAgain) {
              Linking.openSettings();
          }
        } catch (e) {
          Linking.openSettings();
        }
    }
  };

  const openBatterySettings = async () => {
    console.log("Btn: Batería presionado");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (Platform.OS === 'android') {
        try {
            // Usa la constante nativa de Expo IntentLauncher para abrir la lista (100% confiable)
            await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
        } catch (e) {
            console.log("Direct battery intent failed:", e);
            Alert.alert(
                "Ajuste Manual", 
                "Te abriremos los ajustes generales de la app. Desde ahí entra a 'Uso de Batería' y selecciona 'Sin restricciones'.",
                [
                    { text: "Entendido", onPress: () => Linking.openSettings() }
                ]
            );
        }
    } else {
        Linking.openSettings();
    }
  };

  const renderPermissionItem = (
    title: string, 
    desc: string, 
    icon: any, 
    status: PermissionStatus, 
    onPress: () => void,
    color: string
  ) => {
    const isGranted = status === 'granted';
    
    return (
      <MatteCard 
        radius={24} 
        style={styles.card}
      >
        <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
                {React.createElement(icon, { size: 24, color: color, strokeWidth: 2.5 })}
            </View>
            <View style={styles.statusBadge}>{isGranted ? (<View style={styles.badgeActive}><CheckCircle2 size={12} color="#10B981" /><Text style={styles.badgeTextActive}>AUTORIZADO</Text></View>) : (<View style={styles.badgePending}><AlertCircle size={12} color="#F59E0B" /><Text style={styles.badgeTextPending}>PENDIENTE</Text></View>)}</View>
        </View>

        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{desc}</Text>

        <TouchableOpacity 
            activeOpacity={0.6}
            onPress={onPress}
            style={[styles.actionRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
        >
            <Text style={[styles.actionLabel, { color: isGranted ? '#10B981' : theme.primary }]}>
                {isGranted ? 'Gestionar ajustes' : 'Configurar ahora'}
            </Text>
            <ExternalLink size={14} color={isGranted ? '#10B981' : theme.primary} />
        </TouchableOpacity>
      </MatteCard>
    );
  };

  return (
    <CleanBackground>
      <FocusTransition>
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
                <MatteIconButton 
                    icon={ChevronLeft} 
                    onPress={() => navigation.goBack()} 
                />
                <Text style={[styles.headerTitle, { color: theme.text }]}>Centro de Control</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView 
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 600 }}
                >
                    <View style={styles.introSection}>
                        <View style={[styles.mainBadge, { backgroundColor: theme.primary + '15' }]}><ShieldCheck size={16} color={theme.primary} /><Text style={[styles.mainBadgeText, { color: theme.primary }]}>SISTEMA SEGURO</Text></View>
                        <Text style={[styles.title, { color: theme.text }]}>Gestión de Permisos</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            Asegura que Cortex Hub funcione sin interrupciones y con acceso total a tus herramientas académicas.
                        </Text>
                    </View>

                    {renderPermissionItem(
                        "Notificaciones",
                        "Recibe alertas en tiempo real sobre vencimientos de tareas, recordatorios de Cronos y actualizaciones de IA.",
                        Bell,
                        notifStatus,
                        requestNotificationPermission,
                        "#007AFF"
                    )}

                    {renderPermissionItem(
                        "Almacenamiento y Fotos",
                        "Permite que Nexus IA organice tus archivos académicos, PDF y fotos de apuntes localmente.",
                        FolderOpen,
                        storageStatus,
                        requestStoragePermission,
                        "#AF52DE"
                    )}

                    {renderPermissionItem(
                        "Optimización de Batería",
                        "Evita que Android cierre la aplicación en segundo plano para garantizar que los recordatorios lleguen siempre.",
                        Battery,
                        'undetermined', // Este no se puede verificar fácilmente sin nativos
                        openBatterySettings,
                        "#F59E0B"
                    )}

                    <MatteCard style={styles.infoBox} radius={20}>
                        <Info size={18} color={theme.textSecondary} />
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                            Cortex Hub prioriza tu privacidad. Los permisos de archivos se utilizan únicamente para procesar información académica localmente.
                        </Text>
                    </MatteCard>
                </MotiView>
            </ScrollView>
        </View>
      </FocusTransition>
    </CleanBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  introSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  mainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  badgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  badgeTextActive: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  badgeTextPending: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  }
});
