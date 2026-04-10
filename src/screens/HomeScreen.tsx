import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Dimensions,
  RefreshControl,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Search, 
  Settings, 
  Bell, 
  Calendar as CalendarIcon, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Target, 
  Zap, 
  Sparkles,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Check,
  QrCode,
  FileText,
  CreditCard,
  ChevronRight,
  StickyNote,
  Calendar,
  MoreHorizontal,
  Award,
  Brain,
  Paperclip
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MotiView, AnimatePresence } from 'moti';
import { Colors, Spacing, Radius, Shadows } from '../constants/theme';
import CleanBackground from '../components/CleanBackground';
import { useTheme } from '../context/ThemeContext';
import { useData, resolveColor } from '../context/DataContext';
import UserManual from '../components/UserManual';

import { MatteCard, MatteUnderlay as GlassLayers, MatteIconButton as GlassIconButton } from '../components/design-system/CortexMatte'
import { useResponsive } from '../hooks/useResponsive';
import { LAYOUT } from '../constants/layout';
import CortexModal from '../components/CortexModal';
import FocusTransition from '../components/FocusTransition';
import { MatteActionBtn, MatteBanner, MatteMemoCard, MatteCourseCard } from '../components/design-system/CortexMatte';
import { NotificationService } from '../services/NotificationService';
import NotificationPermissionModal from '../components/NotificationPermissionModal';
import { auth, db } from '../services/firebase';
import { getUniversityLogo } from '../services/university';
import { useTutorial } from '../services/TutorialService';
import { QuoteService } from '../services/QuoteService';
import NotificationCenter from '../components/NotificationCenter';
import CortySpeechBubble from '../components/CortySpeechBubble';
import { useScrollToHideTabBar } from '../hooks/useScrollToHideTabBar';
import * as AcademicEngine from '../services/AcademicEngine';

// --- Helper: Tutorial Target for Absolute Measurement ---
const TutorialTarget = ({ id, children, style }: { id: string, children: React.ReactNode, style?: any }) => {
    const { registerElement, isActive, currentStep } = useTutorial();
    const ref = React.useRef<View>(null);
    
    const measure = useCallback(() => {
        if (ref.current) {
            ref.current.measureInWindow((x, y, width, height) => {
                if (width > 0 && height > 0) {
                    registerElement(id, { x, y, width, height });
                }
            });
        }
    }, [id, registerElement]);

    // Measure when tutorial becomes active OR when this specific step is reached
    useEffect(() => {
        if (isActive || currentStep?.targetId === id) {
            const timer = setTimeout(measure, 150); // Small buffer for animations
            return () => clearTimeout(timer);
        }
    }, [isActive, measure, currentStep?.targetId]);

    return (
        <View 
            ref={ref} 
            style={style} 
            onLayout={measure}
        >
            {children}
        </View>
    );
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos dias';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function getTodayDay(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

const BASE_DELAY = 3600; // Sincronizado con Lobby (3.5s)

export default function HomeScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { isTablet, isLaptop, width: screenWidth } = useResponsive();
  const isWide = isTablet || isLaptop;
  const { 
    userProfile, 
    courses, 
    tasks, 
    scheduleBlocks, 
    notes, 
    isLoading, 
    isSyncing,
    isDataFresh,
    syncData,
    updateTask, 
    updateNotes,
    updateUserProfile,
    notifications,
    addNotification,
    globalConfig,
    isAdmin
  } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showCortyBubble, setShowCortyBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState('');
  const wasSyncing = useRef(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const styles = getStyles(theme, isWide);
  const today = getTodayDay();
  const todayBlocks = scheduleBlocks.filter(b => b.day === today);
  const pendingTasks = tasks.filter(t => !t.done).length;
  const handleScroll = useScrollToHideTabBar(40);

   const [showQRModal, setShowQRModal] = React.useState(false);
  const [showCarnetModal, setShowCarnetModal] = React.useState(false);
  const [showCortexModal, setShowCortexModal] = React.useState(false);
  const [modalType, setModalType] = React.useState<any>(null);
  const [selectedMemo, setSelectedMemo] = React.useState<any>(null);

  let parsedNotes: any[] = [];
  try {
    parsedNotes = typeof notes === 'string' ? JSON.parse(notes) : notes;
    if (!Array.isArray(parsedNotes)) parsedNotes = [];
  } catch (e) {
    if (notes) parsedNotes = [{ id: '1', text: notes, color: theme.primary + '20' }];
  }

  // --- GLOBAL ACADEMIC ENGINE REFINEMENT (CortexCore 3.1) ---
  const [isAccumulatedGlobalView, setIsAccumulatedGlobalView] = useState(false);
  const globalLastTap = useRef<number>(0);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleGlobalPress = () => {
    const now = Date.now();
    if (now - globalLastTap.current < 250) {
      // DOBLE TOQUE (Toggle)
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
      setIsAccumulatedGlobalView(!isAccumulatedGlobalView);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      globalLastTap.current = 0; // Reset
    } else {
      // POSIBLE TOQUE SIMPLE (Esperar para ver si hay un segundo)
      globalLastTap.current = now;
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
      tapTimeout.current = setTimeout(() => {
        // TOQUE SIMPLE (Navegar)
        navigation.navigate('Academic');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        globalLastTap.current = 0;
      }, 250);
    }
  };

  useEffect(() => {
    return () => {
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
    };
  }, []);

  const avgGradeNum = AcademicEngine.calculateGlobalWeightedGPA(courses);
  const avgGrade = avgGradeNum.toFixed(2);
  const globalAccumulatedScore = AcademicEngine.calculateGlobalAccumulatedScore(courses);
  
  const isRedundant = Math.abs(avgGradeNum - globalAccumulatedScore) < 0.05;

  const displayValue = isAccumulatedGlobalView 
    ? globalAccumulatedScore.toFixed(2) 
    : avgGrade;

  const displayLabel = isAccumulatedGlobalView 
    ? "PROMEDIO GLOBAL" 
    : "PROMEDIO PARCIAL";

  const userName = userProfile?.name || 'Estudiante';
  const university = userProfile?.university || 'Cortex Academy';
  const domain = userProfile?.universityDomain || userProfile?.domain;
  const fallbackPhotoURL = userProfile?.fallbackPhotoURL || (domain ? getUniversityLogo(domain) : null);
  const initial = userName.charAt(0).toUpperCase();
  const photoURL = userProfile?.photoURL;
  const { compactMode } = theme;

  if (isLoading) {
    return (
      <CleanBackground>
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
          <Text style={{color: theme.textSecondary, fontWeight: '700'}}>Sincronizando con CortexWebOS...</Text>
        </View>
      </CleanBackground>
    );
  }

  // Smart Context Logic
  let contextTitle = "Resumen semanal";
  let contextSub = "Todo al día, buen trabajo.";
  let ContextIcon: any = Sparkles;
  let contextColor = theme.primary;

  if (todayBlocks.length > 0) {
    const nextBlock = todayBlocks[0];
    contextTitle = `Siguiente clase en 15m`;
    contextSub = `${nextBlock.subject} • ${nextBlock.room}`;
    ContextIcon = Clock;
    contextColor = theme.accent;
  } else if (pendingTasks > 0) {
    contextTitle = `Tienes ${pendingTasks} entregas`;
    contextSub = `Revisa tu lista de pendientes para mañana.`;
    ContextIcon = AlertTriangle;
    contextColor = '#FF5A5F';
  } else if (parseFloat(avgGrade) < (userProfile?.targetGrade || 4.5)) {
    contextTitle = `Bajo la meta de ${userProfile?.targetGrade || 4.5}`;
    contextSub = `Necesitas optimizar tus próximos cortes.`;
    ContextIcon = Target;
    contextColor = '#6C63FF';
  }

  const handleContextAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (pendingTasks > 0 && contextTitle.includes('entregas')) {
      navigation.navigate('Cronos');
    } else {
      navigation.navigate('Cortex IA');
    }
  };

  const { startTutorial, registerElement, isActive: isTutorialActive } = useTutorial();

  const triggerTutorial = useCallback(() => {
    startTutorial([
      { 
        id: 'welcome', 
        targetId: 'header', 
        text: `¡Hola ${userName}! Bienvenido a Cortex Hub OS. Soy Corty, el núcleo de tu sistema académico nativo.`, 
        expression: 'happy' 
      },
      { 
        id: 'stats', 
        targetId: 'stats', 
        text: "Estos son tus Vitales Académicos. Tu Promedio y Eficiencia se calculan en tiempo real usando Cortex Engine.", 
        expression: 'normal' 
      },
      { 
        id: 'oracle', 
        targetId: 'oracle', 
        text: "Este es el Smart Context. Aquí leeré tu mente (bueno, tus datos) para darte consejos críticos sobre qué estudiar hoy.", 
        expression: 'thinking' 
      },
      { 
        id: 'memos', 
        targetId: 'memos', 
        text: "Tus Memos se sincronizan con Cortex Web. Mantén tus ideas rápidas y pensamientos académicos siempre a la mano.", 
        expression: 'happy' 
      },
      { 
        id: 'actions', 
        targetId: 'actions', 
        text: "Finalmente, usa estas funciones rápidas para tu Carnet Digital o tu código QR de acceso.", 
        expression: 'success' 
      },
      { 
        id: 'sync-manual', 
        targetId: 'sync-btn', 
        text: "¡Nuevo en v3.0! Este es tu botón de Sincronización. Al terminar verás un Check Verde con el efecto 'Pum' que garantiza que tus datos están seguros en la nube.", 
        expression: 'happy' 
      },
      { 
        id: 'bunker', 
        targetId: 'header', 
        text: "Recuerda: Cortex usa arquitectura 'Búnker Offline'. Tus datos están SIEMPRE seguros localmente incluso sin internet. Consulta el Manual en Ajustes para más info.", 
        expression: 'success' 
      },
      {
        id: 'finish',
        targetId: 'header',
        text: "¡Y ya está! Estás listo para darle vida a tus estudios. ¡Hagamos que este semestre sea legendario!",
        expression: 'happy',
        onAction: () => {
          addNotification({
            title: "¡Bienvenido a Bordo! 👋",
            body: "Corty está listo para ayudarte a dominar el semestre. ¡Explora tus cursos y empieza a trackear!",
            type: 'success'
          });
        }
      }
    ]);
  }, [startTutorial, userName, addNotification]);

  React.useEffect(() => {
    if (!isLoading && isDataFresh && userProfile && !userProfile.tutorialCompleted) {
      const timer = setTimeout(triggerTutorial, 2500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isDataFresh, userProfile, userProfile?.tutorialCompleted, triggerTutorial]);

  // Manejador del éxito de sincronización
  useEffect(() => {
    if (isSyncing) {
      wasSyncing.current = true;
    }

    if (!isSyncing && wasSyncing.current) {
      // Solo mostrar si venimos de un estado de carga real
      setShowSyncSuccess(true);
      wasSyncing.current = false;
      const timer = setTimeout(() => setShowSyncSuccess(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isSyncing]);

  const hasSentQuote = useRef(false);

  // Inyección de Frase de Corty al entrar
  useEffect(() => {
    if (!isLoading && userProfile && !hasSentQuote.current) {
        const lastQuoteDate = userProfile.preferences?.lastOracleQuoteDate;
        const isEnabled = userProfile.preferences?.oracleQuotesEnabled !== false;
        
        // Fase 19: Mostrar SIEMPRE al entrar (primera vez por sesión o tras 8h)
        // hasSentQuote.current ya garantiza que es solo una vez por montaje/sesión si no hay navegación pesada.
        if (isEnabled) {
            // Inyección de Frase de Corty
            const welcomeMessage = QuoteService.getWelcomeMessage();
            setBubbleMessage(welcomeMessage);
            setShowCortyBubble(true);

            // Ocultar tras 10 segundos
            setTimeout(() => setShowCortyBubble(false), 10000);
            
            // Actualizar fecha de última frase
            const updatedPrefs = {
                ...(userProfile.preferences || {}),
                lastOracleQuoteDate: new Date().toISOString()
            };
            updateUserProfile({ preferences: updatedPrefs });
            
            // Añadir también al historial de notificaciones
            addNotification({
                title: "Corty Oracle 🧠✨",
                body: welcomeMessage,
                type: "info",
                action: "open_notifications" 
            });
        }
        
        hasSentQuote.current = true;
    }
  }, [isLoading, userProfile]);

  // Verificación de Permisos al inicio
  useEffect(() => {
    const checkPerms = async () => {
        // Solo preguntar si no hemos preguntado en esta sesión o si es nuevo
        const status = await NotificationService.getPermissionsStatus();
        if (status !== 'granted' && status !== 'denied') {
            // Mostrar modal educativo antes del prompt del sistema
            setShowPermissionModal(true);
        }
    };
    if (!isLoading && userProfile) {
        checkPerms();
    }
  }, [isLoading, userProfile]);

  const handleAcceptPermissions = async () => {
    setShowPermissionModal(false);
    const granted = await NotificationService.requestPermissions();
    if (granted) {
        // Disparar las notificaciones de éxito y manual
        setTimeout(() => {
            NotificationService.sendTestNotification();
            addNotification({
                title: "📘 Bienvenido a Cortex Hub OS",
                body: "Hemos ampliado tu manual técnico. Toca aquí para descubrir el poder del Hub.",
                type: "info",
                action: "open_manual"
            });
            updateUserProfile({ manualNotificationSent: true });
        }, 1000);
    }
  };

  // Notificación de Bienvenida al Manual (v3.0) - Solo si ya hay permisos
  useEffect(() => {
    const checkAndSend = async () => {
        const status = await NotificationService.getPermissionsStatus();
        if (status === 'granted' && userProfile && !userProfile.manualNotificationSent) {
            addNotification({
                title: "📘 Bienvenido a Cortex Hub OS",
                body: "Hemos ampliado tu manual técnico. Toca aquí para descubrir el poder del Hub.",
                type: "info",
                action: "open_manual"
            });
            updateUserProfile({ manualNotificationSent: true });
        }
    };
    if (userProfile) checkAndSend();
  }, [userProfile]);

  const AgendaGlassCard = ({ block, index }: { block: any; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'spring', delay: BASE_DELAY + 500 + index * 80 }}
    >
      <MatteCard radius={25} style={styles.agendaCard}>
        <View style={[styles.agendaLine, { backgroundColor: resolveColor(block.color) }]} />
        <View style={styles.agendaInfo}>
          <Text style={styles.agendaTitle}>{block.subject}</Text>
          <View style={styles.agendaMeta}>
            <Clock size={12} color={theme.textSecondary} />
            <Text style={styles.agendaTime}>
              {block.startTime} - {block.endTime}
            </Text>
            <Text style={styles.agendaRoom}> • {block.room}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.agendaAction}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <BookOpen size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      </MatteCard>
    </MotiView>
  );

  return (
    <CleanBackground shadowOpacity={isTutorialActive ? 0.3 : 0.8}>
      <FocusTransition>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + (compactMode ? 4 : Spacing.base), paddingBottom: insets.bottom + 60, gap: compactMode ? 8 : 16 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={isSyncing}
              onRefresh={syncData}
              tintColor={theme.primary}
              colors={[theme.primary]}
              progressBackgroundColor={theme.surface}
            />
          }
        >
        <View style={styles.maxWidthWrapper}>
          <TutorialTarget id="header" style={styles.header}>
            <TouchableOpacity
              style={styles.userInfo}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.7}
            >
              <MatteCard radius={Radius.full} style={styles.initialContainer}>
                {photoURL ? (
                  <View style={[StyleSheet.absoluteFill, { borderRadius: 999, overflow: 'hidden' }]}>
                    <Image source={{ uri: photoURL }} style={{ width: '100%', height: '100%' }} />
                  </View>
                ) : (
                  <Text style={styles.initialText}>{initial}</Text>
                )}
              </MatteCard>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.welcomeText, compactMode && { fontSize: 24 }]}>Hola, {userName}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  {fallbackPhotoURL && (
                    <Image source={{ uri: fallbackPhotoURL }} style={{ width: 14, height: 14, marginRight: 6, borderRadius: 2 }} />
                  )}
                  <Text style={[styles.greetingText, { marginTop: 0 }]} numberOfLines={1}>
                    {getGreeting()} • {university}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.headerActions}>
              <TutorialTarget id="sync-btn">
                <GlassIconButton
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    syncData();
                  }}
                  size={42}
                  radius={21}
                  tint={showSyncSuccess ? "#10B981" : (isSyncing ? "rgba(99, 102, 241, 0.2)" : (theme.isDark ? undefined : "rgba(255,255,255,0.5)"))}
                >
                  <MotiView
                    key={showSyncSuccess ? 'success' : 'sync'}
                    from={{ scale: 0.5, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1, 
                      rotate: (isSyncing && !showSyncSuccess) ? '360deg' : '0deg' 
                    }}
                    transition={{ 
                      type: 'timing', 
                      duration: showSyncSuccess ? 400 : 1000, 
                      loop: isSyncing && !showSyncSuccess,
                      repeatReverse: false 
                    }}
                    style={{ alignItems: 'center', justifyContent: 'center' }}
                  >
                    {showSyncSuccess ? (
                      <Check size={22} color="#FFFFFF" strokeWidth={4} />
                    ) : (
                      <RefreshCw size={20} color={isSyncing ? theme.primary : theme.textSecondary} />
                    )}
                  </MotiView>
                </GlassIconButton>
              </TutorialTarget>

              <GlassIconButton
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  triggerTutorial();
                }}
                size={42}
                radius={21}
                tint={theme.isDark ? undefined : "rgba(255,255,255,0.5)"}
              >
                <HelpCircle size={20} color={theme.primary} />
              </GlassIconButton>

              <View>
                {/* Corty silenciado por petición del usuario */}
                <GlassIconButton
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('CommunicationsHub');
                    setShowCortyBubble(false);
                  }}
                  size={42}
                  radius={21}
                  tint={theme.isDark ? undefined : "rgba(255,255,255,0.5)"}
                >
                  <Bell size={20} color={theme.textSecondary} />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <MotiView
                        key="badge"
                        from={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 15 }}
                        style={[styles.badgeContainer, { backgroundColor: theme.primary }]}
                      >
                        <Text style={styles.badgeText}>{unreadCount}</Text>
                      </MotiView>
                    )}
                  </AnimatePresence>
                </GlassIconButton>
              </View>
            </View>
          </TutorialTarget>
        </View>

        <View style={styles.maxWidthWrapper}>
          {/* ---------- GLOBAL ANNOUNCEMENT / UPDATE BANNER ---------- */}
          <AnimatePresence>
            {globalConfig?.announcement?.active && (
              <MotiView
                from={{ height: 0, opacity: 0, scale: 0.95, marginBottom: 0 }}
                animate={{ height: 'auto', opacity: 1, scale: 1, marginBottom: 20 }}
                exit={{ height: 0, opacity: 0, scale: 0.95, marginBottom: 0 }}
                transition={{ type: 'timing', duration: 400 }}
                style={{ overflow: 'hidden', paddingHorizontal: 20 }}
              >
                <TouchableOpacity 
                   activeOpacity={0.8}
                   onPress={() => {
                     if (globalConfig.updateUrl) Linking.openURL(globalConfig.updateUrl);
                   }}
                >
                  <MatteCard radius={22} style={[styles.announcementCard, { borderColor: globalConfig.announcement.type === 'warning' ? '#FF5A5F60' : theme.primary + '40' }]}>
                    <LinearGradient
                      colors={globalConfig.announcement.type === 'warning' ? ['#FF5A5F20', 'transparent'] : [theme.primary + '20', 'transparent']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <View style={styles.announcementIcon}>
                        {globalConfig.announcement.type === 'warning' ? <AlertTriangle size={20} color="#FF5A5F" /> : <Bell size={20} color={theme.primary} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.announcementTitle}>{globalConfig.announcement.title}</Text>
                      <Text style={styles.announcementBody}>{globalConfig.announcement.body}</Text>
                    </View>
                    <ChevronRight size={18} color={theme.textMuted} />
                  </MatteCard>
                </TouchableOpacity>
              </MotiView>
            )}

            {globalConfig?.currentVersion && globalConfig.currentVersion !== '3.1.0' && (
              <MotiView
                from={{ height: 0, opacity: 0, scale: 0.95 }}
                animate={{ height: 'auto', opacity: 1, scale: 1 }}
                style={{ paddingHorizontal: 20, marginBottom: 20 }}
              >
                 <MatteBanner 
                    title={`Nueva Versión v${globalConfig.currentVersion}`}
                    subtitle="Hay una actualización crítica disponible para tu núcleo Cortex."
                    icon={Sparkles}
                    color={theme.primary}
                    onPress={() => {
                        if (globalConfig.updateUrl) Linking.openURL(globalConfig.updateUrl);
                    }}
                 />
              </MotiView>
            )}
          </AnimatePresence>

          <TutorialTarget id="stats" style={[styles.statsGrid, compactMode && { gap: 8, marginTop: 4 }]}>
            {/* Column 1: Promedio & Eficiencia */}
            <View style={styles.statsColumn}>
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={handleGlobalPress}
                style={{ flex: 1 }}
              >
                <MotiView
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: BASE_DELAY + 200 }}
                  style={{ flex: 1 }}
                >
                  <View style={{
                    backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF',
                    borderRadius: 28,
                    padding: 16,
                    justifyContent: 'space-between',
                    flex: 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: theme.isDark ? 0.3 : 0.04,
                    shadowRadius: 15,
                    elevation: 3,
                    borderWidth: theme.isDark ? 1 : 0,
                    borderColor: 'rgba(255,255,255,0.05)'
                  }}>
                    {/* Top Header Row */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: theme.textSecondary, letterSpacing: 0.5 }}>
                           {displayLabel}
                        </Text>
                       <Target size={16} color={theme.text} strokeWidth={2.5} />
                    </View>
                    
                    {/* Bottom Data Row */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
                      <View style={{ gap: 2 }}>
                         <Text style={{ fontSize: 26, fontWeight: '800', color: theme.text, letterSpacing: -1 }}>{displayValue}</Text>
                         <Text style={{ fontSize: 10, fontWeight: '600', color: theme.textMuted }}>{!isRedundant ? 'Doble-Tap para alternar' : 'Datos sincronizados'}</Text>
                      </View>

                      <View style={{ width: 60, height: 8, borderRadius: 4, backgroundColor: theme.isDark ? '#333' : '#F0F0F0', overflow: 'hidden' }}>
                         <LinearGradient colors={['#FF5A5F', '#F59E0B', '#10B981']} start={{x:0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFill} />
                         <View style={{ 
                           position: 'absolute', width: 6, height: 12, top: -2, borderRadius: 3, 
                           backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, 
                           shadowOffset: {height: 1, width: 0}, left: `${Math.min(100, (parseFloat(displayValue) / 5) * 100)}%`, 
                           transform: [{translateX: -3}] 
                         }} />
                      </View>
                    </View>
                  </View>
                </MotiView>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => navigation.navigate('Academic')}
                style={{ flex: 1 }}
              >
                <MotiView
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: BASE_DELAY + 300 }}
                  style={{ flex: 1 }}
                >
                  <View style={{
                    backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF',
                    borderRadius: 28,
                    padding: 16,
                    justifyContent: 'space-between',
                    flex: 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: theme.isDark ? 0.3 : 0.04,
                    shadowRadius: 15,
                    elevation: 3,
                    borderWidth: theme.isDark ? 1 : 0,
                    borderColor: 'rgba(255,255,255,0.05)'
                  }}>
                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>Eficiencia</Text>
                        <Zap size={18} color={theme.text} strokeWidth={2.5} />
                     </View>
                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
                        <View style={{ gap: 2 }}>
                           <Text style={{ fontSize: 26, fontWeight: '800', color: theme.text, letterSpacing: -1 }}>{AcademicEngine.calculateEfficiency(courses)}%</Text>
                           <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary }}>{AcademicEngine.calculateEfficiency(courses) >= 80 ? 'Excelente' : 'Mejorable'}</Text>
                        </View>
                        <View style={{ width: 65, height: 8, borderRadius: 4, backgroundColor: theme.isDark ? '#333' : '#F0F0F0', overflow: 'hidden' }}>
                           <View style={{ width: `${AcademicEngine.calculateEfficiency(courses)}%`, height: '100%', backgroundColor: theme.accent, borderRadius: 4 }} />
                        </View>
                     </View>
                  </View>
                </MotiView>
              </TouchableOpacity>
            </View>

            {/* Column 2: Riesgo & Tareas */}
            <View style={styles.statsColumn}>
              {[
                { 
                  label: 'Riesgo', 
                  value: `${AcademicEngine.calculateRiskCourses(courses)}`, 
                  subtext: AcademicEngine.calculateRiskCourses(courses) > 0 ? 'Peligro' : 'Seguro',
                  color: theme.text, 
                  icon: AlertTriangle,
                  type: 'alert'
                },
                { 
                  label: 'Tareas', 
                  value: `${pendingTasks}`, 
                  subtext: pendingTasks > 0 ? 'Pendientes' : 'Al día',
                  color: theme.text, 
                  icon: Sparkles,
                  type: 'info'
                },
              ].map((stat, i) => (
                
                  <MotiView
                    key={stat.label}
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: BASE_DELAY + 300 + i * 100 }}
                    style={{ flex: 1 }}
                  >
                    <View style={{
                        backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF',
                        borderRadius: 28,
                        padding: 16,
                        justifyContent: 'space-between',
                        flex: 1,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: theme.isDark ? 0.3 : 0.04,
                        shadowRadius: 15,
                        elevation: 3,
                        borderWidth: theme.isDark ? 1 : 0,
                        borderColor: 'rgba(255,255,255,0.05)'
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                           <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>{stat.label}</Text>
                           <stat.icon size={18} color={theme.text} strokeWidth={2.5} />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
                          <View style={{ gap: 2 }}>
                             <Text style={{ fontSize: 26, fontWeight: '800', color: theme.text, letterSpacing: -1 }}>{stat.value}</Text>
                             <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary }}>{stat.subtext}</Text>
                          </View>
                          {stat.type === 'alert' ? (
                             <View style={{ width: 65, height: 8, borderRadius: 4, backgroundColor: theme.isDark ? '#333' : '#F0F0F0', overflow: 'hidden' }}>
                                <View style={{ width: AcademicEngine.calculateRiskCourses(courses) > 0 ? '80%' : '15%', height: '100%', backgroundColor: AcademicEngine.calculateRiskCourses(courses) > 0 ? '#FF5A5F' : '#10B981', borderRadius: 4 }} />
                             </View>
                          ) : (
                             <View style={{ width: 65, height: 8, borderRadius: 4, backgroundColor: theme.isDark ? '#333' : '#F0F0F0', overflow: 'hidden' }}>
                                <View style={{ width: pendingTasks > 0 ? '60%' : '100%', height: '100%', backgroundColor: theme.primary, borderRadius: 4 }} />
                             </View>
                          )}
                        </View>
                    </View>
                  </MotiView>
                
              ))}
            </View>
          </TutorialTarget>
        </View>

          <TutorialTarget 
            id="actions"
            style={{ width: '100%' }}
          >
            <MotiView 
              from={{ opacity: 0, translateY: 15 }} 
              animate={{ opacity: 1, translateY: 0 }} 
              transition={{ delay: BASE_DELAY + 350 }}
            >
              <View style={[styles.quickActionBar, { justifyContent: 'space-evenly' }]}>
                {[
                  { label: 'Mi QR', icon: QrCode, action: () => setShowQRModal(true) },
                  { label: 'Notas', icon: FileText, action: () => navigation.navigate('Academic') },
                  { label: 'Carnet', icon: CreditCard, action: () => setShowCarnetModal(true) },
                ].map((action, i) => (
                   <MatteActionBtn 
                      key={action.label} 
                      icon={action.icon} 
                      label={action.label} 
                      onPress={() => {
                          Haptics.selectionAsync();
                          action.action();
                      }}
                   />
                ))}
              </View>
            </MotiView>
          </TutorialTarget>

          <TutorialTarget 
            id="oracle"
            style={{ width: '100%' }}
          >
            <MotiView 
              from={{ opacity: 0, translateY: 18 }} 
              animate={{ opacity: 1, translateY: 0 }} 
              transition={{ delay: BASE_DELAY + 420 }}
            >
              <MatteBanner 
                 title={contextTitle}
                 subtitle={contextSub}
                 icon={ContextIcon}
                 color={contextColor}
                 onPress={handleContextAction}
              />
            </MotiView>
          </TutorialTarget>

        
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: BASE_DELAY + 520 }} style={styles.sectionHeader}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={styles.sectionTitle}>Memos</Text><Text style={styles.sectionLabel}>Sincronizacion de Notas</Text></View></MotiView>

        <TutorialTarget 
          id="memos"
          style={{ width: '100%' }} 
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.memosWrapper}
          >
          {parsedNotes.map((memo: any, i: number) => (
            <MotiView
              key={memo.id}
              from={{ opacity: 0, scale: 0.9, translateX: 40 }}
              animate={{ opacity: 1, scale: 1, translateX: 0 }}
              transition={{ delay: BASE_DELAY + 560 + i * 90 }}
            >
              <MatteMemoCard 
                key={memo.id}
                text={memo.text}
                color={memo.color || theme.primary}
                onPress={() => {
                  Haptics.selectionAsync();
                  setModalType('memo');
                  setSelectedMemo(memo);
                  setShowCortexModal(true);
                }}
              />
            </MotiView>
          ))}
          <TouchableOpacity 
            style={styles.addMemoCard}
            onPress={() => {
              Haptics.selectionAsync();
              setModalType('memo');
              setShowCortexModal(true);
            }}
          >
            <Text style={styles.addMemoText}>+</Text>
          </TouchableOpacity>
        </ScrollView>
      </TutorialTarget>
      

        
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: BASE_DELAY + 600 }} style={styles.sectionHeader}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={styles.sectionTitle}>Asignaturas</Text><Text style={styles.sectionLabel}>{courses.length} Materias</Text></View></MotiView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.coursesWrapper}>
          {courses.map((course: any, i: number) => (
            <MotiView 
              key={course.id} 
              from={{ opacity: 0, translateX: 30 }} 
              animate={{ opacity: 1, translateX: 0 }} 
              transition={{ delay: BASE_DELAY + 640 + i * 80 }}
            >
              <MatteCourseCard 
                key={course.id} 
                name={course.name} 
                code={course.code} 
                average={course.average} 
                color={resolveColor(course.color)} 
                progress={course.progress} 
                accumulatedScore={AcademicEngine.calculateAccumulatedScore(course.cuts).toFixed(2)}
                onPress={() => navigation.navigate('Courses', { screen: 'CourseDetail', params: { courseId: course.id } })} 
              />
            </MotiView>
          ))}
        </ScrollView>
        

        
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: BASE_DELAY + 620 }}><TouchableOpacity style={styles.sectionHeader} activeOpacity={0.7} onPress={() => {Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);navigation.navigate('Calendar');}}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={styles.sectionTitle}>Mi Agenda</Text><Text style={styles.sectionLabel}>{todayBlocks.length} Items</Text></View><Calendar size={18} color={theme.textSecondary} /></TouchableOpacity></MotiView>

        <View style={styles.agendaList}>
          {todayBlocks.length === 0 ? (
            <MatteCard radius={24} style={styles.emptyDay}>
              <Text style={styles.emptyDayText}>Dia libre hoy. Disfruta.</Text>
            </MatteCard>
          ) : (
            todayBlocks.map((block, i) => <AgendaGlassCard key={block.id} block={block} index={i} />)
          )}
        </View>
        

        
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: BASE_DELAY + 740 }} style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <Text style={styles.sectionLabel}>{tasks.length} Cards</Text>
          </View>
          <TouchableOpacity>
            <MoreHorizontal size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </MotiView>

        {tasks.slice(0, 2).map((task: any, i: number) => (
          <MotiView
            key={task.id}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: BASE_DELAY + 820 + i * 100 }}
          >
            <MatteCard 
              radius={24} 
              onPress={() => navigation.navigate('Cronos')}
              style={{ overflow: 'hidden' }}
            >
                {/* Left pink soft glow focus area */}
                <LinearGradient
                  colors={task.priority === 'high' || i === 0 ? ['rgba(255, 90, 95, 0.15)', 'transparent'] : ['rgba(0,0,0,0.02)', 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 24, width: '45%' }]}
                />
                
                {/* Inner spec border to match premium feel */}
                <View style={[StyleSheet.absoluteFill, {
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.4)',
                    borderLeftWidth: 1.5,
                    borderLeftColor: task.priority === 'high' || i === 0 ? '#FF5A5F' : 'rgba(255,255,255,0.6)',
                }]} />

                <View style={{ padding: 20, gap: 16 }}>
                  {/* Top Tags Row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {(task.priority === 'high' || i === 0) && (
                        <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255, 90, 95, 0.06)', borderWidth: 1, borderColor: 'rgba(255, 90, 95, 0.2)' }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF5A5F' }}>High</Text>
                        </View>
                      )}
                      <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6', borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>Interaction</Text>
                      </View>
                      <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6', borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>Meeting</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6', borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' }}>
                      <Paperclip size={12} color={theme.textSecondary} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>2+</Text>
                    </View>
                  </View>

                  {/* Title & Desc */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text, letterSpacing: -0.3 }}>
                      {task.text || "Dashboard Overview"}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: theme.textSecondary, lineHeight: 18 }} numberOfLines={2}>
                      {task.description || "Refine the dashboard layout, improve color hierarchy, and unify all components."}
                    </Text>
                  </View>

                  {/* Bottom Row / Footer */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>
                      {task.estimatedTime || "09:30 - 10:00"}
                    </Text>
                    <View style={{ flexDirection: 'row' }}>
                      {[12, 45, 68].map((avatarId, idx) => (
                        <View key={idx} style={{
                          width: 30, height: 30, borderRadius: 15, 
                          backgroundColor: '#E2E8F0',
                          marginLeft: idx === 0 ? 0 : -12,
                          borderWidth: 2, borderColor: theme.isDark ? '#1E1E1E' : '#FFFFFF',
                          overflow: 'hidden',
                          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3
                        }}>
                           <Image source={{uri: `https://i.pravatar.cc/100?img=${avatarId}`}} style={{width: '100%', height: '100%'}} />
                        </View>
                      ))}
                    </View>
                  </View>

                </View>
            </MatteCard>
          </MotiView>
        ))}
        

        </ScrollView>

        <Modal
          visible={showQRModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQRModal(false)}
        >
          <View style={styles.fullModalOverlay}>
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              activeOpacity={1} 
              onPress={() => setShowQRModal(false)} 
            />
            <MotiView
               from={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               style={styles.identityModalContent}
            >
              <GlassLayers radius={30} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.8)' : '#fff', opacity: 0.9 }]} />
              
              <View style={styles.qrHeaderSarah}>
                <Image source={{ uri: fallbackPhotoURL || getUniversityLogo('google.com') }} style={{ width: 32, height: 32, borderRadius: 6 }} />
                <Text style={styles.identityTitle}>Cortex Access</Text>
              </View>

              <View style={styles.qrContainerSarah}>
                <QrCode size={200} color="#000" />
              </View>
              
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text style={styles.identityName}>{userName.toUpperCase()}</Text>
                <Text style={styles.identityUni}>SISTEMA DE ACCESO SEGURO</Text>
                <Text style={styles.nexusNote}>Próximamente compatible con Team Nexus</Text>
              </View>
              
              <TouchableOpacity style={styles.modalCloseBtnSarah} onPress={() => setShowQRModal(false)}>
                <Text style={styles.modalCloseTextSarah}>LISTO</Text>
              </TouchableOpacity>
            </MotiView>
          </View>
        </Modal>

        <Modal
          visible={showCarnetModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCarnetModal(false)}
        >
          <View style={styles.fullModalOverlay}>
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              activeOpacity={1} 
              onPress={() => setShowCarnetModal(false)} 
            />
            <MotiView
               from={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               style={styles.carnetModalContent}
            >
              <GlassLayers radius={24} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.8)' : '#fff', opacity: 0.95 }]} />
              
              <View style={styles.carnetHeader}>
                <Image source={{ uri: fallbackPhotoURL || getUniversityLogo('google.com') }} style={styles.carnetUniLogo} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.carnetUniName}>{university}</Text>
                  <Text style={styles.carnetStatus}>TI UNIFICADA</Text>
                  <Text style={styles.legalAlertText}>CARNÉ ILUSTRATIVO - FICTICIO</Text>
                </View>
              </View>

              <View style={styles.carnetPhotoContainer}>
                {photoURL ? (
                  <Image source={{ uri: photoURL }} style={styles.carnetPhoto} />
                ) : (
                  <View style={[styles.carnetPhoto, { backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 40, fontWeight: '900', color: theme.primary }}>{initial}</Text>
                  </View>
                )}
                <View style={styles.carnetQrBadge}>
                  <QrCode size={30} color="#000" />
                </View>
              </View>

              <View style={styles.carnetInfo}>
                <Text style={styles.carnetName}>{userName}</Text>
                <Text style={styles.carnetCareer}>{userProfile?.career || 'ESTUDIANTE'}</Text>
                <View style={styles.carnetDivider} />
                <Text style={styles.carnetId}>ID-CRTX-{auth.currentUser?.uid.slice(0, 8).toUpperCase()}</Text>
              </View>

              <View style={styles.carnetFooter}>
                <View style={styles.chipSymbol} />
                <Text style={styles.carnetVaild}>VALID: {new Date().getFullYear() + 1}</Text>
              </View>
            </MotiView>
          </View>
        </Modal>

        <CortexModal 
          isVisible={showCortexModal}
          type={modalType}
          initialData={selectedMemo}
          onClose={() => {
            setShowCortexModal(false);
            setSelectedMemo(null);
          }}
          onSave={async (data) => {
             if (!auth.currentUser) return;
             if (data.type === 'task') {
                const newTask = {
                   id: Date.now().toString(),
                   text: data.title,
                   description: data.description,
                   done: false,
                   courseId: data.selectedCourse,
                   priority: 'normal'
                };
                await updateTask(newTask);
             } else if (data.type === 'memo') {
                if (data.id) {
                    const newNotes = parsedNotes.map(m => m.id === data.id ? { ...m, text: data.title, color: data.color, description: data.description } : m);
                    await updateNotes(newNotes);
                } else {
                    const newMemo = { id: Date.now().toString(), text: data.title, color: data.color, description: data.description };
                    const newNotes = [...parsedNotes, newMemo];
                    await updateNotes(newNotes);
                }
             }
             setSelectedMemo(null);
          }}
          onDelete={async (id) => {
            if (modalType === 'memo') {
              const newNotes = parsedNotes.filter(m => m.id !== id);
              await updateNotes(newNotes);
            }
          }}
        />
      </FocusTransition>
      <NotificationCenter 
        visible={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        onAction={(action) => {
            if (action === 'open_manual') {
                setShowNotifications(false);
                setShowManual(true);
            }
        }}
      />
      <UserManual visible={showManual} onClose={() => setShowManual(false)} />
      <NotificationPermissionModal 
        visible={showPermissionModal} 
        onAccept={handleAcceptPermissions}
        onDecline={() => setShowPermissionModal(false)}
      />
    </CleanBackground>
  );
}

const { width, height } = Dimensions.get('window');

const getStyles = (theme: any, isWide: boolean = false) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    scrollContent: { 
      padding: Spacing.xl, 
      paddingTop: 60, 
      paddingBottom: 110, 
      gap: Spacing.xl,
      alignItems: 'center', // Center content on wide screens
    },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 20, gap: 20 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      maxWidth: 1200,
      alignSelf: 'center',
      width: '100%',
      marginBottom: 8, // Pequeño respiro hacia el widget de Stats
    },
    badgeContainer: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#060A10',
      paddingHorizontal: 4,
    },
    badgeText: {
      color: '#FFF',
      fontSize: 9,
      fontWeight: '900',
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    initialContainer: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initialText: {
      fontSize: 20,
      fontWeight: '900',
      color: theme.text,
    },
    greetingText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    welcomeText: {
      fontSize: 16,
      color: theme.text,
      fontWeight: '800',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingRight: 4,
    },
    notifBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 6,
      height: 6,
      borderRadius: 3,
      borderWidth: 1.5,
      borderColor: '#fff',
    },
    maxWidthWrapper: {
      width: '100%',
      alignSelf: 'center',
      maxWidth: LAYOUT.MAX_WIDTH,
      alignItems: isWide ? 'center' : 'stretch',
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    statsColumn: {
      flex: 1,
      gap: 12,
    },
    statCard: {
      width: '100%',
      padding: isWide ? 20 : 16,
      alignItems: 'center',
      gap: 8,
      minHeight: isWide ? 100 : 92,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '900',
      letterSpacing: -1,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: Colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    quickActionBar: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      gap: 20,
      marginVertical: 10,
    },
    quickActionItem: {
      alignItems: 'center',
      gap: 8,
    },
    quickActionBtn: {
      width: 64,
      height: 64,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.5)',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.8)',
    },
    quickActionLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.textSecondary,
    },
    oracleBanner: {
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    oracleIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.5)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.7)',
    },
    oracleContent: {
      flex: 1,
    },
    iaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 4,
    },
    iaBadgeText: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1,
    },
    oracleTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: theme.text,
    },
    oracleSub: {
      fontSize: 12,
      color: Colors.textSecondary,
      fontWeight: '500',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
    },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: theme.text, letterSpacing: -0.4 },
    sectionLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
    memosWrapper: {
      paddingRight: 20,
      gap: 12,
    },
    announcementCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderWidth: 1.5,
      overflow: 'hidden',
    },
    announcementIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: 'rgba(0,0,0,0.05)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    announcementTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: -0.3,
    },
    announcementBody: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '600',
      marginTop: 2,
    },
    memoCard: {
      width: 160,
      height: 140,
      padding: 16,
      position: 'relative',
    },
    memoBorder: {
      borderWidth: 1.4,
      borderColor: 'rgba(255,255,255,0.7)',
      borderRadius: 20,
    },
    memoText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
      lineHeight: 18,
    },
    memoPin: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(0,0,0,0.1)',
    },
    addMemoCard: {
      width: 60,
      height: 140,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addMemoText: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    coursesWrapper: {
      paddingRight: 20,
      gap: 12,
    },
    courseCard: {
      width: 180,
      padding: 16,
      gap: 8,
    },
    courseTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: -0.3,
      minHeight: 36,
    },
    courseCode: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    courseFooter: {
      marginTop: 6,
      gap: 6,
    },
    courseAverage: {
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: -0.6,
    },
    courseProgressBg: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      overflow: 'hidden',
    },
    courseProgressFill: {
      height: '100%',
      borderRadius: 3,
    },
    agendaList: { gap: 12 },
    agendaCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 16,
    },
    agendaLine: { width: 4, height: 40, borderRadius: 2 },
    agendaInfo: { flex: 1 },
    agendaTitle: { fontSize: 16, fontWeight: '800', color: theme.text },
    agendaMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    agendaTime: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
    agendaRoom: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
    agendaAction: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.7)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.8)',
    },
    emptyDay: {
      padding: 30,
      alignItems: 'center',
    },
    emptyDayText: {
      color: Colors.textSecondary,
      fontWeight: '700',
    },
    glassTaskCard: {
      padding: 24,
      gap: 20,
      overflow: 'hidden',
    },
    cardEdgeGlow: {
      position: 'absolute',
      left: 0,
      borderTopRightRadius: 4,
      borderBottomRightRadius: 4,
    },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tagGroup: {
      flexDirection: 'row',
      gap: 8,
    },
    tagPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.6)',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
    },
    tagHigh: {
      backgroundColor: 'rgba(255,120,120,0.12)',
      borderColor: 'rgba(255,120,120,0.35)',
    },
    tagText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.isDark ? '#FFF' : '#000',
    },
    tagHighText: {
      color: '#C94848',
    },
    attachmentsTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 15,
      backgroundColor: 'rgba(255,255,255,0.6)',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
    },
    attachmentsText: {
      fontSize: 12,
      fontWeight: '700',
      color: Colors.textSecondary,
    },
    sarahTaskTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: -0.5,
    },
    sarahTaskDesc: {
      fontSize: 13,
      color: Colors.textSecondary,
      fontWeight: '500',
      lineHeight: 18,
      maxWidth: '90%',
    },
    cardBottomSarah: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginTop: 4,
    },
    sarahTime: { fontSize: 13, color: Colors.textSecondary, fontWeight: '700' },
    avatarStackSarah: { flexDirection: 'row' },
    miniAvatarSarah: { width: 28, height: 28, borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: '#fff' },
    fullModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    identityModalContent: {
      width: width * 0.85,
      padding: 30,
      alignItems: 'center',
      gap: 24,
      borderRadius: 30,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
    },
    qrHeaderSarah: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 10,
    },
    identityTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: theme.isDark ? '#FFF' : '#000',
      letterSpacing: 1,
    },
    qrContainerSarah: {
      padding: 24,
      backgroundColor: '#fff',
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
      ...Shadows.sm,
    },
    identityName: {
      fontSize: 22,
      fontWeight: '900',
      color: theme.isDark ? '#FFF' : '#000',
      letterSpacing: -0.5,
    },
    identityUni: {
      fontSize: 10,
      color: theme.textSecondary,
      fontWeight: '800',
      letterSpacing: 1,
    },
    modalCloseBtnSarah: {
      marginTop: 10,
      paddingVertical: 14,
      paddingHorizontal: 40,
      borderRadius: 15,
      backgroundColor: '#000',
    },
    modalCloseTextSarah: {
      fontSize: 12,
      fontWeight: '900',
      color: '#fff',
    },
    carnetModalContent: {
      width: width * 0.85,
      padding: 24,
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
      alignItems: 'center',
      gap: 20,
    },
    carnetHeader: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    carnetUniLogo: {
      width: 36,
      height: 36,
      borderRadius: 8,
    },
    carnetUniName: {
      fontSize: 14,
      fontWeight: '900',
      color: theme.isDark ? '#FFF' : '#000',
    },
    carnetStatus: {
      fontSize: 9,
      fontWeight: '900',
      color: theme.primary,
      letterSpacing: 1,
    },
    carnetPhotoContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 4,
      borderColor: '#fff',
      position: 'relative',
      ...Shadows.md,
    },
    carnetPhoto: {
      width: '100%',
      height: '100%',
      borderRadius: 60,
    },
    carnetQrBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#fff',
      padding: 6,
      borderRadius: 12,
      ...Shadows.sm,
    },
    carnetInfo: {
      alignItems: 'center',
      gap: 2,
    },
    carnetName: {
      fontSize: 20,
      fontWeight: '900',
      color: theme.isDark ? '#FFF' : '#000',
    },
    carnetCareer: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '700',
    },
    carnetDivider: {
      width: 40,
      height: 3,
      backgroundColor: theme.primary,
      borderRadius: 2,
      marginVertical: 8,
    },
    carnetId: {
      fontSize: 10,
      color: theme.textMuted,
      fontWeight: '900',
    },
    carnetFooter: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    chipSymbol: {
      width: 36,
      height: 28,
      borderRadius: 6,
      backgroundColor: '#D4AF37',
      opacity: 0.8,
    },
    carnetVaild: {
      fontSize: 10,
      fontWeight: '900',
      color: theme.textMuted,
    },
    nexusNote: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.primary,
      marginTop: 8,
      textAlign: 'center',
      opacity: 0.8,
    },
    legalAlertText: {
      fontSize: 8,
      fontWeight: '900',
      color: '#FF5A5F',
      marginTop: 2,
    },
  });
