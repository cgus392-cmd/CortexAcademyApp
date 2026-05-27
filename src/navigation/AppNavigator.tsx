import React, { useState } from 'react';
import { 
  StatusBar, 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Dimensions,
  ActivityIndicator,
  BackHandler,
  ToastAndroid,
  Platform
} from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { navigationRef } from './RootNavigation';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { DataProvider, useData } from '../context/DataContext';
import * as Haptics from 'expo-haptics';
import { MotiView, AnimatePresence } from 'moti';
import { 
  Home as HomeIcon, 
  Calendar, 
  Target, 
  Users,
  Plus,
  Timer,
  StickyNote,
  CheckSquare,
  ScanLine,
  Layout as LayoutIcon,
  LogOut,
  User,
  Brain,
  GraduationCap
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useResponsive } from '../hooks/useResponsive';
import { LAYOUT } from '../constants/layout';
import TutorialOverlay from '../components/TutorialOverlay';

type AuthState = 'LOCK' | 'LOBBY' | 'ONBOARDING' | 'APP';
import { Colors } from '../constants/theme';
import { useTutorial } from '../services/TutorialService';

import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import CoursesScreen from '../screens/CoursesScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import CronosScreen from '../screens/CronosScreen';
import NexusScreen from '../screens/NexusScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CommunicationsHub from '../screens/CommunicationsHub';
import AcademicScreen from '../screens/AcademicScreen';
import CalendarScreen from '../screens/CalendarScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PermissionsScreen from '../screens/PermissionsScreen';
import CortexCore from '../components/CortexCore';
import CortexModal, { ModalType } from '../components/CortexModal';
import { MatteUnderlay as GlassLayers } from '../components/design-system/CortexMatte';
import CotyGreeting from '../components/CotyGreeting';
import { auth, db } from '../services/firebase';
import { globalEmitter } from '../utils/EventEmitter';

const { width } = Dimensions.get('window');

const Tab = createBottomTabNavigator();
const CoursesStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

// --- CUSTOM TAB BAR COMPONENT ---
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { isTablet, isLaptop } = useResponsive();
  const isWide = isTablet || isLaptop;
  const { userProfile } = useData();
  const { performanceMode, compactMode, glassOpacity: prefOpacity } = theme;
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const { isActive: isTutorialActive } = useTutorial();
  const isDark = theme.isDark;
  const isLowPerf = performanceMode === 'eco' || performanceMode === 'ahorro';
  const [hasVisitedAI, setHasVisitedAI] = useState(false);
  
  const isGloballyVisible = isTabBarVisible && !isTutorialActive;
  const screenWidth = Dimensions.get('window').width;

  React.useEffect(() => {
    if (state.routes[state.index].name === 'Cortex IA') {
      setHasVisitedAI(true);
    }
  }, [state.index]);

  React.useEffect(() => {
    const unsubscribe = globalEmitter.on('toggleTabBar', (visible: boolean) => {
      setIsTabBarVisible(visible);
    });
    return unsubscribe;
  }, []);

  if (isWide) return null;

  return (
    <MotiView 
      style={[styles.tabBarContainer, { bottom: (insets?.bottom || 0) + (compactMode ? 8 : 16), zIndex: 100 }]}
      animate={{ translateY: isGloballyVisible ? 0 : 110, opacity: isGloballyVisible ? 1 : 0 }}
      transition={compactMode ? { type: 'timing', duration: 300 } : { type: 'spring', damping: 25, stiffness: 90, mass: 0.8 }}
      pointerEvents={isGloballyVisible ? 'auto' : 'none'}
    ><AnimatePresence></AnimatePresence><MotiView
        from={{ translateY: 100, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: 'timing', duration: 400, delay: 500 }}
        style={[styles.pillContainer, { 
                backgroundColor: isDark ? `rgba(15,15,18,${isLowPerf ? 0.95 : prefOpacity + 0.45})` : `rgba(255,255,255,${isLowPerf ? 0.95 : prefOpacity + 0.3})`,
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                overflow: 'hidden',
                height: compactMode ? 54 : 68,
            }
        ]}>{!isLowPerf && (<BlurView intensity={performanceMode === 'ultra' ? 95 : 70} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />)}<LinearGradient colors={isDark ? ['rgba(255,255,255,0.06)', 'transparent', 'rgba(0,0,0,0.3)'] : ['rgba(255,255,255,0.8)', 'transparent', 'rgba(0,0,0,0.05)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />{state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          const Icon = options.tabBarIcon as any;
          return (<MotiView key={route.key} animate={{ flex: isFocused ? 1.6 : 1 }} transition={{ type: 'timing', duration: 400 }} style={styles.tabItemContainer}><TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.tabItem}><MotiView animate={{ width: isFocused ? 100 : 44, backgroundColor: 'transparent' }} transition={{ type: 'timing', duration: 400 }} style={styles.tabPill}><GlassLayers radius={22} /><View style={styles.pillContent}><MotiView animate={route.name === 'Cortex IA' && !hasVisitedAI ? { opacity: [0.6, 1, 0.6], scale: [1, 1.2, 1] } : { opacity: 1, scale: 1 }} transition={route.name === 'Cortex IA' && !hasVisitedAI ? { loop: true, type: 'timing', duration: 1000 } : { type: 'timing', duration: 300 }}><Icon size={22} color={route.name === 'Cortex IA' && !hasVisitedAI && !isFocused ? theme.primary : isFocused ? (isDark ? '#FFF' : '#000') : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.75)')} strokeWidth={isFocused || (route.name === 'Cortex IA' && !hasVisitedAI) ? 2.8 : 2.2} /></MotiView>{!!isFocused && (<MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'timing', duration: 250 }} style={styles.labelWrapper}><Text numberOfLines={1} style={[styles.tabLabel, { color: isDark ? '#FFF' : '#000' }]}>{route.name}</Text></MotiView>)}</View></MotiView></TouchableOpacity></MotiView>);
        })}</MotiView>

      <View style={styles.fabWrapper}>
        <MotiView
          from={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={compactMode ? { type: 'timing', duration: 300, delay: 500 } : { type: 'spring', damping: 15, stiffness: 120, delay: 800 }}
        >
          {/* Pulsing Aura */}
          <MotiView
            from={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ type: 'timing', duration: 2500, loop: true }}
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.primary, borderRadius: 30 }]}
          />

          <TouchableOpacity
            style={styles.fabContainer}
            activeOpacity={0.8}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('Cortex IA');
            }}
          >
            <LinearGradient
              colors={[theme.primary, theme.primary + '90']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.fabGradient, { overflow: 'hidden' }]}
            >
              <View style={[StyleSheet.absoluteFill, { borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', zIndex: 2 }]} />
              
              {/* Sweeping Shine */}
              <MotiView
                from={{ translateX: -60, skewX: '-20deg' }}
                animate={{ translateX: 80, skewX: '-20deg' }}
                transition={{ type: 'timing', duration: 3000, loop: true, repeatReverse: false }}
                style={{ position: 'absolute', top: 0, bottom: 0, width: 25, backgroundColor: 'rgba(255,255,255,0.3)', zIndex: 1 }}
              />

              <MotiView
                 from={{ scale: 0.92 }}
                 animate={{ scale: 1.08 }}
                 transition={{ type: 'timing', duration: 1500, loop: true, direction: 'alternate' }}
                 style={{ zIndex: 3 }}
              >
                 <Brain color="#FFF" size={26} strokeWidth={2.2} />
              </MotiView>
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>
      </View>
    </MotiView>
  );
}

// --- NAVIGATORS ---

function CoursesNav() {
  const { theme } = useTheme();
  return (
    <CoursesStack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.bg },
        animation: 'slide_from_right',
        animationDuration: 260,
      }}
    >
      <CoursesStack.Screen
        name="CoursesList"
        component={CoursesScreen}
        options={{ headerShown: false }}
      />
    </CoursesStack.Navigator>
  );
}

function SettingsNav({ onLogout }: { onLogout: () => void }) {
  const { theme } = useTheme();
  const renderSettingsMenu = React.useCallback((props: any) => <SettingsScreen {...props} onLogout={onLogout} />, [onLogout]);
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.bg },
        animation: 'slide_from_right',
        animationDuration: 260,
      }}
    >
      <SettingsStack.Screen name="SettingsMain" children={renderSettingsMenu} />
      <SettingsStack.Screen
        name="Cortex IA"
        component={NexusScreen}
        options={{ title: 'Cortex IA' }}
      />
    </SettingsStack.Navigator>
  );
}

function Sidebar({ onLogout, navigation }: { onLogout: () => void; navigation: any }) {
  const { theme } = useTheme();
  const isDark = theme.isDark;
  const [activeIndex, setActiveIndex] = useState(0);

  const routes = [
    { name: 'Home', icon: HomeIcon },
    { name: 'Courses', icon: Calendar },
    { name: 'Cronos', icon: Timer },
    { name: 'Cortex IA', icon: Target },
    { name: 'Nexus', icon: Users },
  ];

  return (
    <View style={styles.sidebarContainer}>
      <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <GlassLayers radius={0} />
      
      <View style={styles.sidebarHeader}>
        <CortexCore size={60} expression="normal" theme={theme} />
        <Text style={styles.sidebarTitle}>CORTEX</Text>
      </View>

      <View style={styles.sidebarNav}>
        {routes.map((route, index) => {
          const isFocused = activeIndex === index;
          const onPress = () => {
             setActiveIndex(index);
             navigation.navigate('Main', { screen: route.name });
          };

          const Icon = route.icon;

          return (
            <TouchableOpacity
              key={route.name}
              onPress={onPress}
              style={[
                styles.sidebarItem,
                isFocused && { backgroundColor: theme.primary + '20', borderColor: theme.primary }
              ]}
            >
              <Icon size={22} color={isFocused ? theme.primary : theme.textSecondary} />
              <Text style={[styles.sidebarLabel, { color: isFocused ? theme.primary : theme.textSecondary }]}>
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sidebarFooter}>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Settings')}>
          <User size={22} color={theme.textSecondary} />
          <Text style={styles.sidebarLabel}>Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarItem} onPress={onLogout}>
          <LogOut size={22} color={theme.error} />
          <Text style={[styles.sidebarLabel, { color: theme.error }]}>Salir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MainTabs({ onLogout, navigation }: { onLogout: () => void; navigation: any }) {
  const { theme } = useTheme();
  const { tasks } = useData();
  const { isTablet, isLaptop } = useResponsive();
  const isWide = isTablet || isLaptop;
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);

  const openModal = (type: ModalType) => {
    setModalType(type);
    setModalVisible(true);
  };

  return (
    <View style={{ flex: 1, flexDirection: isWide ? 'row' : 'column', backgroundColor: theme.isDark ? '#000000' : '#F8F4F0' }}>
      {isWide && <Sidebar onLogout={onLogout} navigation={navigation} />}
      
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          tabBar={(props) => isWide ? null : <CustomTabBar {...props} navigation={{...props.navigation, resetModal: openModal} as any} />}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarIcon: ({ color, size }) => <HomeIcon size={size} color={color} fill={color === '#000000' ? '#000000' : 'transparent'} />,
            }}
          />
          <Tab.Screen
            name="Courses"
            component={CoursesNav}
            options={{
              tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
            }}
          />
          <Tab.Screen
            name="Cronos"
            component={CronosScreen}
            options={{
              tabBarIcon: ({ color, size }) => <Timer size={size} color={color} />,
            }}
          />
          <Tab.Screen
            name="Académico"
            component={AcademicScreen}
            options={{
              tabBarIcon: ({ color, size }) => <GraduationCap size={size} color={color} />,
            }}
          />
          <Tab.Screen
            name="Nexus"
            component={ChatScreen}
            options={{
              tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
            }}
          />
        </Tab.Navigator>
        
        <TutorialOverlay />
      </View>

      <CortexModal 
        isVisible={modalVisible} 
        type={modalType} 
        onClose={() => setModalVisible(false)} 
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
             const newTasks = [...tasks, newTask];
             await db.collection('users').doc(auth.currentUser.uid).set({ tasks: newTasks }, { merge: true });
          }
        }}
      />
    </View>
  );
}

function RootNavigator({ onLogout }: { onLogout: () => void }) {
  const { theme } = useTheme();
  
  const renderMainTabs = React.useCallback((props: any) => <MainTabs {...props} onLogout={onLogout} />, [onLogout]);
  const renderSettingsNav = React.useCallback((props: any) => <SettingsNav {...props} onLogout={onLogout} />, [onLogout]);

  return (
    <RootStack.Navigator screenOptions={{ 
      headerShown: false, 
      animation: 'fade', 
      animationDuration: 250,
      contentStyle: { backgroundColor: theme.bg } 
    }}>
      <RootStack.Screen name="Main" children={renderMainTabs} />
      <RootStack.Screen name="Settings" children={renderSettingsNav} />
      <RootStack.Screen name="Academic" component={AcademicScreen} />
      <RootStack.Screen name="CommunicationsHub" component={CommunicationsHub} />
      <RootStack.Screen name="Calendar" component={CalendarScreen} />
      <RootStack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <RootStack.Screen name="Permissions" component={PermissionsScreen} />
      <RootStack.Screen name="Cortex IA" component={NexusScreen} />
    </RootStack.Navigator>
  );
}

export default function AppNavigator() {
  const [authState, setAuthState] = useState<AuthState>('LOCK');
  const [showLobby, setShowLobby] = useState(false);
  const [lobbyMessage, setLobbyMessage] = useState('¡Iniciando núcleo de Cortex...');
  const [isGuest, setIsGuest] = useState(false);
  const { theme } = useTheme();
  const { userProfile, isLoading, authUser: user } = useData();

  const handleLogout = React.useCallback(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLobbyMessage('¡Ya te vas amix, nos vemos!!');
      setShowLobby(true);
      
      setTimeout(() => {
          setAuthState('LOCK');
          setIsGuest(false);
          setTimeout(() => setShowLobby(false), 1000);
      }, 5000);
  }, []);
  
  const lastPressRef = React.useRef(0);

  React.useEffect(() => {
    const handleBackPress = () => {
      if (authState !== 'APP') return false;

      const now = Date.now();
      if (now - lastPressRef.current < 2000) {
        BackHandler.exitApp();
        return true;
      }
      
      lastPressRef.current = now;
      if (Platform.OS === 'android') {
        ToastAndroid.show('Presiona de nuevo para salir de forma segura 🔒', ToastAndroid.SHORT);
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [authState]);

  React.useEffect(() => {
    if (userProfile && !isLoading && !isGuest && auth.currentUser) {
      const syncMeta = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const data = {
            uid: currentUser.uid,
            email: currentUser.email,
            name: userProfile.name || currentUser.displayName || 'Usuario de Cortex',
            photo: userProfile.photoURL || currentUser.photoURL,
            lastActive: Date.now()
          };
          await AsyncStorage.setItem('@last_user', JSON.stringify(data));
        } catch (e) {}
      };
      syncMeta();
    }
  }, [userProfile, isGuest]);

  React.useEffect(() => {
    if (isLoading && !isGuest) return;

    if (!user && !isGuest) {
      setAuthState('LOCK');
      if (!lobbyMessage.includes('vas')) {
        setShowLobby(false);
      }
    } else {
      const hasOnboarding = userProfile?.onboardingCompleted;
      const isLegacyUser = userProfile?.university || userProfile?.career;
      const next: AuthState = (hasOnboarding || isLegacyUser) && !isGuest ? 'APP' : 'ONBOARDING';

      if (authState === 'LOCK') {
          setLobbyMessage('¡Configurando tu experiencia inteligente! Preparando Cortex...');
          setShowLobby(true);
          setAuthState(next);
      } else if (authState === 'APP' && next === 'ONBOARDING') {
      } else if (authState !== next) {
          setAuthState(next);
      }
    }
  }, [userProfile, isLoading, user, isGuest, authState]);

  React.useEffect(() => {
    if (showLobby && (authState === 'APP' || authState === 'ONBOARDING')) {
      const duration = userProfile ? 1500 : 3500; 
      const timer = setTimeout(() => {
        setShowLobby(false);
      }, duration); 
      return () => clearTimeout(timer);
    }
  }, [showLobby, authState, !!userProfile]);

  if (isLoading && !userProfile) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <GlassLayers radius={0} />
        <CortexCore theme={theme} size={160} expression="happy" message="Iniciando núcleo..." />
        <MotiView 
          from={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          style={{ marginTop: 20 }}
        >
          <ActivityIndicator size="small" color={theme.primary} />
        </MotiView>
      </View>
    );
  }

  const navTheme = theme.isDark ? DarkTheme : DefaultTheme;
  const customNavTheme = {
    ...navTheme,
    colors: {
      ...navTheme.colors,
      background: theme.bg,
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      <AnimatePresence>
        {authState === 'LOCK' && (
          <MotiView 
            key="lock"
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ type: 'timing', duration: 400 }}
            style={{ flex: 1 }}
          >
            <AuthScreen 
              onLogin={() => {}} 
              onGuest={() => {
                setIsGuest(true);
              }}
            />
          </MotiView>
        )}

        {authState === 'ONBOARDING' && (
          <MotiView 
            key="onboarding"
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ type: 'timing', duration: 400 }}
            style={{ flex: 1 }}
          >
            <OnboardingScreen 
              onComplete={() => {
                setLobbyMessage('¡Configurando tu experiencia inteligente! Preparando Cortex...');
                setShowLobby(true);
                setAuthState('APP');
              }} 
              onBackToAuth={() => {
                setIsGuest(false);
                setAuthState('LOCK');
              }}
            />
          </MotiView>
        )}

        {authState === 'APP' && (
          <MotiView 
            key="app"
            from={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 500 }}
            style={{ flex: 1, backgroundColor: theme.bg }}
          >
            <NavigationContainer theme={customNavTheme} ref={navigationRef}>
              <RootNavigator onLogout={handleLogout} />
            </NavigationContainer>
          </MotiView>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showLobby && (
          <MotiView 
            key="lobby-overlay"
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 600 }}
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.isDark ? '#000' : '#F8F4F0', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }]}
          >
            <CortexCore theme={theme} size={160} expression={lobbyMessage.includes('vas') ? 'normal' : 'happy'} message={lobbyMessage} />
            <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 500 }} style={{ marginTop: 20 }}>
              <ActivityIndicator size="small" color={theme.primary} />
            </MotiView>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: width,
    paddingHorizontal: 20,
    gap: 12,
  },
  pillContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 35,
    height: 70,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  tabItemContainer: {
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItem: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
  },
  tabPill: {
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    paddingHorizontal: 8,
  },
  labelWrapper: {
    marginLeft: 6,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000',
  },
  fabContainer: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  fabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    position: 'absolute',
    width: width * 3,
    height: 3000,
    bottom: -1500,
    left: -width,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  actionBtnWrapper: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    right: 0,
    backgroundColor: 'transparent',
  },
  actionBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  actionLabel: {
    marginRight: 12,
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  // SIDEBAR STYLES
  sidebarContainer: {
    width: 240,
    height: '100%',
    backgroundColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  sidebarHeader: {
    alignItems: 'center',
    marginBottom: 50,
    gap: 15,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 4,
    color: Colors.primary,
  },
  sidebarNav: {
    flex: 1,
    gap: 10,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    gap: 15,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sidebarLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  sidebarFooter: {
    gap: 10,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
});
