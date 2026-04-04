import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Image,
  Linking,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../services/firebase';
import firestore from '@react-native-firebase/firestore';
import { 
  User, 
  Cpu, 
  Zap, 
  Layers, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  Bell, 
  Shield, 
  Info, 
  Palette, 
  Building2,
  CheckCircle2,
  Target,
  Lock,
  LifeBuoy,
  Trash2,
  Camera,
  Star,
  Trophy,
  Award,
  Sparkles,
  Brain
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { MotiView, AnimatePresence, MotiText } from 'moti';
import { Colors, Spacing, Radius, Shadows, PALETTES } from '../constants/theme';
import CleanBackground from '../components/CleanBackground';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import * as LocalAuthentication from 'expo-local-authentication';
import { findUniversityDomain, getUniversityLogo } from '../services/university';
import { LinearGradient } from 'expo-linear-gradient';
import { MatteCard } from '../components/design-system/CortexMatte';
import SettingCell from '../components/SettingCell';
import { NotificationService } from '../services/NotificationService';
import * as SecureStore from 'expo-secure-store';
import { ShieldCheck, BookOpen, Download, Upload } from 'lucide-react-native';
import UserManual from '../components/UserManual';
import BackupService from '../services/BackupService';
import AccountCenterCard from '../components/AccountCenterCard';

type SettingsView = 'menu' | 'profile' | 'appearance' | 'academic' | 'security' | 'ia' | 'support' | 'notifications' | 'account_hub' | 'backup';

export default function SettingsScreen({ navigation, onLogout }: { navigation: any; onLogout: () => void }) {
  const insets = useSafeAreaInsets();
  const { theme, themeId, setTheme, darkMode, setDarkMode, updateAppearance } = useTheme();
  const styles = getStyles(theme);
  const { userProfile, updateUserProfile } = useData();
  const profile = userProfile || {} as any;

  const [currentView, setCurrentView] = useState<SettingsView>('menu');
  const [showManual, setShowManual] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Estados locales para borrador
  const [name, setName] = useState(profile.name || '');
  const [model, setModel] = useState<'flash' | 'pro'>(profile.selectedModel || 'flash');
  const [personality, setPersonality] = useState<'friendly' | 'academic' | 'concise'>(profile.aiPersonality || 'friendly');
  const [isMemoryEnabled, setIsMemoryEnabled] = useState(profile.preferences?.contextMemory !== false);
  const [compactMode, setCompactMode] = useState(profile.preferences?.compactMode || false);
  const [notifications, setNotifications] = useState(profile.preferences?.notifications !== false);
  const [nebulaIntensity, setNebulaIntensity] = useState(profile.preferences?.nebulaIntensity || 0.8);
  const [glassOpacity, setGlassOpacity] = useState(profile.preferences?.glassOpacity || 0.15);
  const [glassBlur, setGlassBlur] = useState(profile.preferences?.glassBlur || 20);
  const [hapticStyle, setHapticStyle] = useState(profile.preferences?.hapticStyle || 'medium');
  const [uniDomain, setUniDomain] = useState(profile.universityDomain || profile.domain || '');
  const [career, setCareer] = useState(profile.career || '');
  const [semester, setSemester] = useState(profile.semester || 1);
  const [email, setEmail] = useState(profile.institutionalEmail || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [isPublic, setIsPublic] = useState(profile.isPublic !== false);
  const [photoURL, setLocalPhotoURL] = useState(profile.photoURL || '');
  const [modality, setModality] = useState(profile.modality || 'Presencial');
  const [linkedin, setLinkedin] = useState(profile.social?.linkedin || '');
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(profile.vaultEnabled || profile.preferences?.biometric || false);
  const [gradingMode, setGradingMode] = useState(profile.preferences?.gradingMode || 'basic');
  const [targetGrade, setTargetGrade] = useState(profile.targetGrade || 4.5);
  const [maxGrade, setMaxGrade] = useState(profile.maxGrade || 5.0);
  const [performanceMode, setPerformanceMode] = useState(profile.preferences?.performanceMode || 'balanced');
  const [cut1Weight, setCut1Weight] = useState(profile.preferences?.cut1Weight || 30);
  const [cut2Weight, setCut2Weight] = useState(profile.preferences?.cut2Weight || 30);
  const [cut3Weight, setCut3Weight] = useState(profile.preferences?.cut3Weight || 40);
  const [isOracleEnabled, setIsOracleEnabled] = useState(profile.preferences?.oracleEnabled !== false);
  const [oracleQuotesEnabled, setOracleQuotesEnabled] = useState(profile.preferences?.oracleQuotesEnabled !== false);
  const [gradeScale, setGradeScale] = useState(profile.preferences?.gradeScale || '5.0');
  const [alertThreshold, setAlertThreshold] = useState(profile.preferences?.alertThreshold || 3.0);
  const [isLoginSaved, setIsLoginSaved] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [confirmPass, setConfirmPass] = useState('');
   const [showAccountControlModal, setShowAccountControlModal] = useState(false);
   const [accountActionType, setAccountActionType] = useState<'format' | 'delete' | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);
   const [farewellStep, setFarewellStep] = useState(0); // 0: Normal, 1: Goodbye message

  const match = findUniversityDomain(uniDomain);

  useEffect(() => {
    if (userProfile) {
      setName(profile.name || '');
      setModel(profile.selectedModel || 'flash');
      setPersonality(profile.aiPersonality || 'friendly');
      setUniDomain(profile.universityDomain || profile.domain || '');
      setCareer(profile.career || '');
      setSemester(profile.semester || 1);
      setEmail(profile.institutionalEmail || '');
      setBio(profile.bio || '');
      setIsPublic(profile.isPublic !== false);
      setLocalPhotoURL(profile.photoURL || '');
      setModality(profile.modality || 'Presencial');
      setLinkedin(profile.social?.linkedin || '');
      if (profile.preferences) {
        setCompactMode(profile.preferences.compactMode || false);
        setNotifications(profile.preferences.notifications !== false);
        setNebulaIntensity(profile.preferences.nebulaIntensity || 0.8);
        setGlassOpacity(profile.preferences.glassOpacity || 0.15);
        setGlassBlur(profile.preferences.glassBlur || 20);
        setHapticStyle(profile.preferences.hapticStyle || 'medium');
        setIsMemoryEnabled(profile.preferences.contextMemory !== false);
        setIsBiometricEnabled(profile.vaultEnabled || profile.preferences.biometric || false);
        setGradingMode(profile.preferences.gradingMode || 'basic');
        setTargetGrade(profile.targetGrade || 4.5);
        setMaxGrade(profile.maxGrade || 5.0);
        setPerformanceMode(profile.preferences.performanceMode || 'balanced');
        setCut1Weight(profile.preferences.cut1Weight || 30);
        setCut2Weight(profile.preferences.cut2Weight || 30);
        setCut3Weight(profile.preferences.cut3Weight || 40);
        setIsOracleEnabled(profile.preferences.oracleEnabled !== false);
        setOracleQuotesEnabled(profile.preferences.oracleQuotesEnabled !== false);
        setGradeScale(profile.preferences.gradeScale || '5.0');
        setAlertThreshold(profile.preferences.alertThreshold || 3.0);
      }
      setIsModified(false);
    }
  }, [userProfile]);

  useEffect(() => {
    const checkLoginSaved = async () => {
        const saved = await SecureStore.getItemAsync('user_creds');
        setIsLoginSaved(!!saved);
    };
    checkLoginSaved();
  }, []);

  const handleSave = async () => {
    const totalWeights = (cut1Weight || 0) + (cut2Weight || 0) + (cut3Weight || 0);
    if (totalWeights !== 100) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Inconsistencia en Pesos', 'La suma de los pesos de los cortes debe ser exactamente 100% para garantizar cálculos precisos.');
        return;
    }

    setSaveStatus('saving');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const match = findUniversityDomain(uniDomain);
    const updates = {
        name: name,
        selectedModel: model,
        aiPersonality: personality,
        universityDomain: uniDomain,
        domain: uniDomain, // Mantener para compatibilidad
        career: career,
        semester: semester,
        institutionalEmail: email,
        bio: bio,
        isPublic: isPublic,
        photoURL: photoURL,
        modality: modality,
        social: { linkedin: linkedin },
        university: match ? match.name : profile.university,
        universityLogo: match ? match.logo : profile.universityLogo,
        universityColor: match ? match.color : profile.universityColor,
        vaultEnabled: isBiometricEnabled,
        preferences: {
            ...profile.preferences,
            compactMode,
            notifications,
            nebulaIntensity,
            glassOpacity,
            glassBlur,
            hapticStyle,
            biometric: isBiometricEnabled,
            gradingMode,
            performanceMode,
            contextMemory: isMemoryEnabled,
            cut1Weight,
            cut2Weight,
            cut3Weight,
            oracleEnabled: isOracleEnabled,
            oracleQuotesEnabled: oracleQuotesEnabled,
            gradeScale,
            alertThreshold
        },
        targetGrade,
        maxGrade
    };
    await updateUserProfile(updates);
    
    // Transición a Guardado (Verde)
    setSaveStatus('saved');
    setIsModified(false);
    
    // Esperar un momento antes de desaparecer
    setTimeout(() => {
        setSaveStatus('idle');
    }, 2000);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
      { text: 'Salir', style: 'destructive', onPress: async () => {
           try {
             const AsyncStorage = require('@react-native-async-storage/async-storage').default;
             await AsyncStorage.removeItem('@last_user');
             const SecureStore = require('expo-secure-store');
             await SecureStore.deleteItemAsync('user_creds');
             const { GoogleSignin } = require('@react-native-google-signin/google-signin');
             await GoogleSignin.signOut();
           } catch (e) {
             console.log('Error during extended logout:', e);
           }
           await auth.signOut();
           onLogout();
      }},
    ]);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setLocalPhotoURL(`data:image/jpeg;base64,${result.assets[0].base64}`);
      setIsModified(true);
    }
  };

  const handleFormatAccount = async () => {
    // 0. Biometric Shield
    const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirmar Formateo de Sistema',
    });
    if (!authResult.success) return;

    setIsDeleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    // Almacenamos el perfil básico para no perderlo
    const currentProfile = { 
        name: userProfile?.name, 
        institutionalEmail: userProfile?.institutionalEmail,
        university: userProfile?.university,
        universityLogo: userProfile?.universityLogo,
        universityColor: userProfile?.universityColor,
        domain: userProfile?.domain,
        universityDomain: userProfile?.universityDomain
    };

    const resetData = {
      courses: [],
      tasks: [],
      scheduleBlocks: [],
      notifications: [],
      notes: "",
      completedAchievements: [],
      userProfile: currentProfile // Mantenemos la identidad
    };

    try {
      await db.collection('users').doc(auth.currentUser?.uid).set(resetData, { merge: true });
      
      // Limpiar Caché Local para evitar inconsistencias
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.multiRemove([
          'CORTEX_COURSES', 'CORTEX_TASKS', 'CORTEX_SCHEDULE', 
          'CORTEX_NOTES', 'CORTEX_NOTIFICATIONS'
      ]);

      setIsDeleting(false);
      setShowAccountControlModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Cortex Formateado', 'Tu ecosistema ha sido reiniciado. Tu identidad se mantiene intacta.');
      navigation.replace('Home'); 
    } catch (e) {
      setIsDeleting(false);
      Alert.alert('Error', 'No se pudieron formatear los datos.');
    }
  };

  const handleDeleteAccount = async () => {
    // 0. Biometric Shield
    const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirmar Purga de Datos (Eliminar Cuenta)',
    });
    if (!authResult.success) return;

    setIsDeleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    try {
        setFarewellStep(1); // Activar pantalla de despedida
        await new Promise(r => setTimeout(r, 3000)); // Delay para que Corty se despida

        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error('No UID');

        // 1. Borrar de Firestore
        await db.collection('users').doc(uid).delete();
        
        // 2. Limpiar Caché Local
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem('@last_user');
        const SecureStore = require('expo-secure-store');
        await SecureStore.deleteItemAsync('user_creds');

        // 3. Borrar de Firebase Auth
        await auth.currentUser?.delete();
        
        setIsDeleting(false);
        onLogout();
    } catch (e: any) {
        setIsDeleting(false);
        setFarewellStep(0);
        if (e.code === 'auth/requires-recent-login') {
            Alert.alert(
                'Seguridad Cortex', 
                'Por seguridad, debes haber iniciado sesión recientemente para eliminar la cuenta. ¿Deseas re-autenticarte ahora?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Re-autenticar', onPress: async () => {
                        try {
                            const { GoogleSignin } = require('@react-native-google-signin/google-signin');
                            await GoogleSignin.signIn();
                            Alert.alert('Éxito', 'Sesión re-validada. Intenta borrar la cuenta de nuevo.');
                        } catch (err) {
                            Alert.alert('Error', 'No se pudo re-autenticar.');
                        }
                    }}
                ]
            );
        } else {
            Alert.alert('Error Crítico', 'No se pudo completar la purga: ' + e.message);
        }
    }
  };

  const handleExportBackup = async () => {
    if (saveStatus !== 'idle') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const backupData = {
        userProfile: profile,
        courses: courses,
        tasks: tasks,
        scheduleBlocks: scheduleBlocks,
        notes: notes,
        notifications: appNotifications,
        completedAchievements: profile.completedAchievements || []
    };
    
    await BackupService.exportData(backupData);
  };

  const { courses, tasks, scheduleBlocks, notes, notifications: appNotifications, restoreData, isSyncing: dataSyncing } = useData();

  const handleImportBackup = async () => {
    Alert.alert(
        'Importar Respaldo',
        'Al importar un respaldo se sobrescribirán de forma permanente todos tus datos actuales de materias y tareas. ¿Deseas continuar?',
        [
            { text: 'Cancelar', style: 'cancel' },
            { 
                text: 'Importar y Sobrescribir', 
                style: 'destructive',
                onPress: async () => {
                    const backup = await BackupService.importData();
                    if (backup) {
                        await restoreData(backup);
                    }
                }
            }
        ]
    );
  };

  const SubHeader = ({ title }: { title: string }) => (
    <View style={styles.subHeader}>
      <TouchableOpacity onPress={() => setCurrentView('menu')} style={styles.backBtn}>
        <ChevronLeft size={24} color={theme.primary} />
      </TouchableOpacity>
      <Text style={styles.subTitle}>{title}</Text>
    </View>
  );

  return (
    <CleanBackground overrideIntensity={nebulaIntensity}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
        <AnimatePresence exitBeforeEnter>
          {currentView === 'menu' && (
            <MotiView 
                key="menu" 
                from={{ opacity: 0, translateY: 10 }} 
                animate={{ opacity: 1, translateY: 0 }} 
                exit={{ opacity: 0, translateY: -10 }}
            >
                {/* Profile Hero Section */}
                <MotiView 
                    from={{ opacity: 0, translateY: 15 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 600 }}
                    style={styles.heroContainer}
                >
                    <TouchableOpacity 
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setCurrentView('profile');
                        }}
                        style={styles.heroAvatarContainer}
                    >
                        {photoURL ? (
                            <Image source={{ uri: photoURL }} style={styles.heroAvatar} />
                        ) : (
                            <LinearGradient
                                colors={[theme.primary, theme.accent]}
                                style={styles.heroAvatar}
                            >
                                <User size={40} color="#FFF" />
                            </LinearGradient>
                        )}
                        <View style={styles.heroEditBadge}>
                            <Camera size={12} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    
                    <View style={styles.heroTextContainer}>
                        <Text style={styles.heroGreeting}>Hola, {profile.name?.split(' ')[0] || 'Estudiante'}</Text>
                        <Text style={styles.heroEmail}>{profile.institutionalEmail || 'Cortex Academy User'}</Text>
                    </View>
                </MotiView>
                
                <AccountCenterCard 
                    theme={theme} 
                    onPress={() => {
                        Haptics.selectionAsync();
                        setCurrentView('account_hub');
                    }}
                />

                <MatteCard radius={30} style={{ padding: 4, marginBottom: 20 }}>
                    <SettingCell 
                        label="Perfil y Universidad" 
                        subLabel={profile.institutionalEmail || 'unireformada.edu.co'}
                        icon={<User size={20} strokeWidth={1.5} color={theme.text} />}
                        onPress={() => setCurrentView('profile')}
                    />
                    <SettingCell 
                        label="Apariencia Nebula" 
                        subLabel="Temas y Cristales"
                        icon={<Palette size={20} strokeWidth={1.5} color={theme.text} />}
                        onPress={() => setCurrentView('appearance')}
                    />
                    <SettingCell 
                        label="Asistente IA" 
                        subLabel="Modelos y Voz"
                        icon={<Zap size={20} strokeWidth={1.5} color={theme.text} />}
                        onPress={() => setCurrentView('ia')}
                    />
                    <SettingCell 
                        label="Motor Académico" 
                        subLabel="Metas Semestrales"
                        icon={<Layers size={20} strokeWidth={1.5} color={theme.text} />}
                        onPress={() => setCurrentView('academic')}
                    />
                    <SettingCell 
                        label="Seguridad Vault" 
                        subLabel="Biometría Cortex"
                        icon={<Shield size={20} strokeWidth={1.5} color={theme.text} />}
                        onPress={() => setCurrentView('security')}
                    />
                    <SettingCell 
                        label="Notificaciones" 
                        subLabel="Alertas Inteligentes"
                        icon={<Bell size={20} strokeWidth={1.5} color={theme.text} />}
                        onPress={() => setCurrentView('notifications')}
                    />
                    <SettingCell 
                        label="Centro de Control" 
                        subLabel="Gestión de Permisos"
                        icon={<ShieldCheck size={20} strokeWidth={1.5} color={theme.text} />}
                        onPress={() => navigation.navigate('Permissions')}
                        isLast
                    />
                </MatteCard>

                <MatteCard radius={30} style={{ padding: 4, marginBottom: 20 }}>
                    <SettingCell 
                        label="Manual de Usuario" 
                        subLabel="Guía Cortex 3.0"
                        icon={<BookOpen size={20} strokeWidth={1.5} color={theme.text} />} 
                        onPress={() => {
                            Haptics.selectionAsync();
                            setShowManual(true);
                        }} 
                    />
                    <SettingCell 
                        label="Cuenta y Ayuda" 
                        icon={<Info size={20} strokeWidth={1.5} color={theme.text} />} 
                        onPress={() => setCurrentView('support')} 
                    />
                    <SettingCell 
                        label="Explorar Nexus" 
                        icon={<Target size={20} strokeWidth={1.5} color={theme.text} />} 
                        onPress={() => navigation.navigate('Nexus')} 
                        isLast 
                    />
                </MatteCard>

                <TouchableOpacity 
                    style={[styles.logoutBtnSarah, { backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]} 
                    onPress={handleLogout}
                >
                    <LogOut size={20} color="#EF4444" />
                    <Text style={styles.logoutTextSarah}>Cerrar Sesión</Text>
                </TouchableOpacity>
            </MotiView>
          )}

          {currentView === 'profile' && (
            <MotiView 
                key="profile" 
                from={{ opacity: 0, translateY: 20 }} 
                animate={{ opacity: 1, translateY: 0 }} 
                exit={{ opacity: 0, translateY: -20 }}
                transition={{ type: 'timing', duration: 500 }}
            >
                <SubHeader title="Mi Identidad Cortex" />
                
                {/* --- STUDENT ID CARD (REFINED DESIGN with FLOW MOTION) --- */}
                <MotiView 
                    from={{ translateY: 0 }}
                    animate={{ translateY: -5 }}
                    transition={{
                        type: 'timing',
                        duration: 2500,
                        loop: true,
                        repeatReverse: true,
                    }}
                    style={[styles.studentCard, { borderColor: (match?.color || profile.universityColor || theme.primary) + '40' }]}
                >
                    <MatteCard radius={30} style={StyleSheet.absoluteFill} />
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: (match?.color || profile.universityColor || theme.primary) + '05', borderRadius: 30 }]} />
                    
                    {/* Premium Shimmer Effect Overlay */}
                    <MotiView
                        from={{ translateX: -300 }}
                        animate={{ translateX: 600 }}
                        transition={{
                            type: 'timing',
                            duration: 4000,
                            loop: true,
                            repeatReverse: false,
                            delay: 2000
                        }}
                        style={[StyleSheet.absoluteFill, { zIndex: 1, opacity: 0.15 }]}
                    >
                        <LinearGradient
                            colors={['transparent', 'rgba(255,255,255,0.8)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ width: 150, height: '150%', transform: [{ rotate: '45deg' }] }}
                        />
                    </MotiView>

                    {/* Top Section: Status Badge Only */}
                    <View style={[styles.cardHeader, { justifyContent: 'flex-end', zIndex: 2 }]}>
                        <View style={[styles.cardBadge, { backgroundColor: (match?.color || profile.universityColor || theme.primary) }]}>
                             <CheckCircle2 size={10} color="#FFF" />
                             <Text style={styles.cardBadgeText}>CORTEX VERIFIED</Text>
                        </View>
                        <Text style={[styles.legalAlert, { color: '#FF5A5F' }]}>CARNÉ ILUSTRATIVO - FICTICIO (Sin validez oficial universitaria)</Text>
                    </View>

                    {/* Main Content: Avatar, Identity Details & Logo on Right */}
                    <View style={[styles.cardMain, { zIndex: 2 }]}>
                        <TouchableOpacity style={styles.cardAvatarBox} onPress={pickImage}>
                            {photoURL ? (
                                <Image source={{ uri: photoURL }} style={styles.cardAvatar} />
                            ) : (
                                <Text style={styles.cardInitial}>{name?.[0] || 'C'}</Text>
                            )}
                            <View style={[styles.cardCameraBadge, { backgroundColor: (match?.color || profile.universityColor || theme.primary) }]}>
                                <Camera size={10} color="#FFF" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.cardInfo}>
                            <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
                            <Text style={styles.cardCareer} numberOfLines={1}>{career || 'Carrera no definida'}</Text>
                            
                            <View style={styles.cardMeta}>
                                <View style={[styles.metaPill, { backgroundColor: (match?.color || profile.universityColor || theme.primary) + '20' }]}>
                                    <Text style={[styles.metaPillText, { color: (match?.color || profile.universityColor || theme.primary) }]}>
                                        Semestre {semester}
                                    </Text>
                                </View>
                                <Text style={styles.hubOSText}>HubOS 3.1</Text>
                            </View>
                        </View>

                        {/* Logo on the right side as requested */}
                        <View style={styles.univLogoBoxRight}>
                             <Image 
                                source={{ uri: match ? match.logo : (profile.universityLogo || getUniversityLogo(uniDomain)) }} 
                                style={styles.cardUnivLogoRight}
                                resizeMode="contain" 
                             />
                             {/* Digital ID QR Marker (Decorative) */}
                             <View style={styles.qrMarker}>
                                <View style={[styles.qrDot, { backgroundColor: (match?.color || profile.universityColor || theme.primary) }]} />
                                <View style={[styles.qrLine, { backgroundColor: (match?.color || profile.universityColor || theme.primary) }]} />
                             </View>
                             <View style={styles.nexusNoteBox}>
                                <Text style={styles.nexusNote}>QR Ecosistema: Team Nexus</Text>
                                <Text style={styles.nexusSubNote}>Próximamente funcional con equipos Nexus</Text>
                             </View>
                        </View>
                    </View>
                </MotiView>

                {/* --- EDITABLE FIELDS --- */}
                <Text style={styles.viewLabel}>INFORMACIÓN PERSONAL</Text>
                <MatteCard radius={Radius.lg}>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>Nombre Completo</Text>
                            <Text style={styles.rowDesc}>Tu identidad oficial en Cortex.</Text>
                        </View>
                        <TextInput 
                          style={styles.uniInput} 
                          value={name} 
                          onChangeText={(t) => { setName(t); setIsModified(true); }}
                          placeholder="Tu nombre"
                        />
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Carrera / Facultad</Text>
                        <TextInput 
                          style={styles.uniInput} 
                          value={career} 
                          onChangeText={(t) => { setCareer(t); setIsModified(true); }}
                          placeholder="Ingeniería..."
                        />
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Semestre Actual</Text>
                        <View style={styles.semesterStepper}>
                            <TouchableOpacity onPress={() => { setSemester(Math.max(1, semester - 1)); setIsModified(true); }}>
                                <ChevronLeft size={20} color={theme.primary} />
                            </TouchableOpacity>
                            <Text style={styles.semesterNum}>{semester}</Text>
                            <TouchableOpacity onPress={() => { setSemester(semester + 1); setIsModified(true); }}>
                                <ChevronRight size={20} color={theme.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Email Institucional</Text>
                        <TextInput 
                          style={styles.uniInput} 
                          value={email} 
                          onChangeText={(t) => { setEmail(t); setIsModified(true); }}
                          placeholder="usuario@univ.edu.co"
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Biografía</Text>
                        <TextInput 
                          style={[styles.uniInput, { textAlign: 'right', height: '100%', paddingTop: 8 }]} 
                          value={bio} 
                          onChangeText={(t) => { setBio(t); setIsModified(true); }}
                          placeholder="Sobre ti..."
                          multiline
                        />
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>Modalidad</Text>
                            <Text style={styles.rowDesc}>Tu formato de asistencia principal.</Text>
                        </View>
                        <View style={styles.toggleRow}>
                            {['Presencial', 'Virtual'].map(m => (
                                <TouchableOpacity key={m} onPress={() => { setModality(m); setIsModified(true); }} style={[styles.miniToggle, modality === m && styles.miniToggleActive]}>
                                    <Text style={[styles.miniToggleText, modality === m && styles.miniToggleTextActive]}>{m}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>LinkedIn</Text>
                        <TextInput 
                          style={styles.uniInput} 
                          value={linkedin} 
                          onChangeText={(t) => { setLinkedin(t); setIsModified(true); }}
                          placeholder="linkedin.com/..."
                          autoCapitalize="none"
                        />
                    </View>
                </MatteCard>

                <Text style={styles.viewLabel}>INSTITUCIÓN</Text>
                <MatteCard radius={Radius.lg}>
                    <View style={styles.row}>
                        <View style={styles.rowLabelGroup}>
                            <Building2 size={18} color={theme.primary} />
                            <Text style={styles.rowLabel}>Dominio Univ.</Text>
                        </View>
                        <TextInput 
                          style={styles.uniInput} 
                          value={uniDomain} 
                          onChangeText={(t) => { setUniDomain(t); setIsModified(true); }}
                          placeholder="ej. unal.edu.co"
                        />
                    </View>
                </MatteCard>

                <Text style={styles.viewLabel}>PRIVACIDAD Y VISIBILIDAD</Text>
                <MatteCard radius={Radius.lg}>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.rowLabelGroup}>
                                <Shield size={18} color={theme.primary} />
                                <Text style={styles.rowLabel}>Perfil Público en Nexus</Text>
                            </View>
                            <Text style={styles.rowDesc}>Hazte visible para otros estudiantes en la red global.</Text>
                        </View>
                        <Switch value={isPublic} onValueChange={(val) => { setIsPublic(val); setIsModified(true); }} />
                    </View>
                </MatteCard>

                <Text style={styles.viewLabel}>LOGROS ACADÉMICOS</Text>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.achievementsWrapper}
                >
                    {[
                        { id: 'init', label: 'Cortex Iniciado', icon: Star, color: Colors.primary },
                        { id: 'strat', label: 'Estratega', icon: Trophy, color: '#F59E0B' },
                        { id: 'master', label: 'Maestro IA', icon: Zap, color: '#00C9A7' },
                        { id: 'scholar', label: 'Erudito', icon: Award, color: '#6C63FF' }
                    ].map((ach) => {
                        const isCompleted = profile.completedAchievements?.includes(ach.id) || false;
                        return (
                            <View key={ach.id} style={styles.achievementCard}>
                                <View style={[StyleSheet.absoluteFill, styles.glassCard, { borderRadius: 20 }]} />
                                <View style={[styles.achIconSarah, { backgroundColor: isCompleted ? ach.color + '15' : 'rgba(0,0,0,0.05)' }]}>
                                    <ach.icon size={20} color={isCompleted ? ach.color : Colors.textMuted} />
                                </View>
                                <Text style={[styles.achLabelSarah, { color: isCompleted ? theme.text : theme.textMuted }]}>{ach.label}</Text>
                                {isCompleted && <CheckCircle2 size={10} color={ach.color} style={{ position: 'absolute', top: 12, right: 12 }} />}
                            </View>
                        );
                    })}
                </ScrollView>
            </MotiView>
          )}

          {currentView === 'appearance' && (
            <MotiView 
                key="appearance" 
                from={{ opacity: 0, translateX: 50 }} 
                animate={{ opacity: 1, translateX: 0 }} 
                exit={{ opacity: 0, translateX: -50 }}
            >
                <SubHeader title="Apariencia" />
                
                <Text style={styles.viewLabel}>MODO DE INTERFAZ</Text>
                <MatteCard radius={Radius.lg} style={{ marginBottom: 15, padding: 16 }}>
                    <Text style={styles.rowDescSarah}>Sincroniza Cortex con tu sistema o elige tu modo preferido.</Text>
                    <View style={[styles.toggleRow, { marginTop: 12 }]}>
                        {[
                            { id: 'auto', label: 'Sistema', icon: Cpu },
                            { id: 'light', label: 'Claro', icon: Sparkles },
                            { id: 'dark', label: 'Oscuro', icon: Lock }
                        ].map((opt) => (
                            <TouchableOpacity 
                                key={opt.id} 
                                onPress={() => { 
                                    setDarkMode(opt.id as any); 
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); 
                                }} 
                                style={[styles.miniToggleSarah, darkMode === opt.id && styles.miniToggleActiveSarah, { flex: 1 }]}
                            >
                                <opt.icon size={14} color={darkMode === opt.id ? "#FFF" : theme.textSecondary} />
                                <Text style={[styles.miniToggleTextSarah, darkMode === opt.id && styles.miniToggleTextActiveSarah]}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </MatteCard>

                <Text style={styles.viewLabel}>PALETA DE COLORES</Text>
                <MatteCard radius={Radius.lg} style={{ marginBottom: 15, padding: 16 }}>
                    <Text style={styles.rowDescSarah}>Personaliza el color global de tu sistema Cortex.</Text>
                    <View style={styles.colorRowSarah}>
                        {(Object.entries(PALETTES) as [keyof typeof PALETTES, any][]).map(([id, p]) => (
                            <TouchableOpacity 
                                key={id} 
                                onPress={() => { 
                                    setTheme(id); 
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); 
                                }} 
                                style={[
                                    styles.colorDotSarah, 
                                    { backgroundColor: p.primary }, 
                                    themeId === id && { borderWidth: 3, borderColor: theme.isDark ? '#FFF' : '#000', transform: [{ scale: 1.25 }] }
                                ]}
                            >
                                {themeId === id && <MotiView from={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={12} color="#FFF" /></MotiView>}
                            </TouchableOpacity>
                        ))}
                    </View>
                </MatteCard>

                <Text style={styles.viewLabel}>PERSONALIZACIÓN CORTEX</Text>
                <MatteCard radius={Radius.xl} style={{ padding: 16 }}>
                    <View style={styles.sliderBoxSarah}>
                        <View style={styles.rowLabelBetween}>
                            <Text style={styles.sliderLabelSarah}>Intensidad Nebula</Text>
                            <Text style={styles.sliderValueSarah}>{Math.round(theme.nebulaIntensity * 100)}%</Text>
                        </View>
                        <View style={styles.toggleRowSarah}>
                            {[{l:'Mínima', v:0.2}, {l:'Media', v:0.6}, {l:'Máxima', v:1.0}].map((opt) => (
                                <TouchableOpacity 
                                    key={opt.l} 
                                    onPress={() => { 
                                        updateAppearance({ intensity: opt.v });
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); 
                                    }} 
                                    style={[styles.miniToggleSarah, theme.nebulaIntensity === opt.v && styles.miniToggleActiveSarah]}
                                >
                                    <Text style={[styles.miniToggleTextSarah, theme.nebulaIntensity === opt.v && styles.miniToggleTextActiveSarah]}>{opt.l}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.sliderBoxSarah}>
                        <View style={styles.rowLabelBetween}>
                            <Text style={styles.sliderLabelSarah}>Opacidad Cristal</Text>
                            <Text style={styles.sliderValueSarah}>{Math.round(theme.glassOpacity * 100)}%</Text>
                        </View>
                        <View style={styles.toggleRowSarah}>
                            {[{l:'Fino', v:0.1}, {l:'Cristal', v:0.35}, {l:'Sólido', v:0.7}].map((opt) => (
                                <TouchableOpacity 
                                    key={opt.l} 
                                    onPress={() => { 
                                        updateAppearance({ opacity: opt.v });
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); 
                                    }} 
                                    style={[styles.miniToggleSarah, theme.glassOpacity === opt.v && styles.miniToggleActiveSarah]}
                                >
                                    <Text style={[styles.miniToggleTextSarah, theme.glassOpacity === opt.v && styles.miniToggleTextActiveSarah]}>{opt.l}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.sliderBoxSarah}>
                        <View style={styles.rowLabelBetween}>
                            <Text style={styles.sliderLabelSarah}>Desenfoque (Blur)</Text>
                            <Text style={styles.sliderValueSarah}>{theme.glassBlur}</Text>
                        </View>
                        <View style={styles.toggleRowSarah}>
                            {[{l:'Clear', v:0}, {l:'Standard', v:45}, {l:'Deep', v:90}].map((opt) => (
                                <TouchableOpacity 
                                    key={opt.l} 
                                    onPress={() => { 
                                        updateAppearance({ blur: opt.v });
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); 
                                    }} 
                                    style={[styles.miniToggleSarah, theme.glassBlur === opt.v && styles.miniToggleActiveSarah]}
                                >
                                    <Text style={[styles.miniToggleTextSarah, theme.glassBlur === opt.v && styles.miniToggleTextActiveSarah]}>{opt.l}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </MatteCard>

                <Text style={styles.viewLabel}>RESPUESTA HÁPTICA</Text>
                <MatteCard radius={Radius.lg}>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>Intensidad de Vibración</Text>
                            <Text style={styles.rowDesc}>Feedback táctil al interactuar con cristales.</Text>
                        </View>
                        <View style={styles.toggleRow}>
                            {['light', 'medium', 'heavy'].map((s) => (
                                <TouchableOpacity 
                                    key={s} 
                                    onPress={() => { setHapticStyle(s as any); setIsModified(true); Haptics.impactAsync(s === 'light' ? Haptics.ImpactFeedbackStyle.Light : s === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium); }} 
                                    style={[styles.miniToggle, hapticStyle === s && styles.miniToggleActive]}
                                >
                                    <Text style={[styles.miniToggleText, hapticStyle === s && styles.miniToggleTextActive]}>
                                        {s === 'light' ? 'Suave' : s === 'heavy' ? 'Fuerte' : 'Media'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={styles.testHapticBtn} 
                        onPress={() => Haptics.impactAsync(hapticStyle === 'light' ? Haptics.ImpactFeedbackStyle.Light : hapticStyle === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : hapticStyle === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Medium)}
                    >
                        <Text style={styles.testHapticText}>PROBAR RESPUESTA</Text>
                        <Zap size={14} color={theme.primary} />
                    </TouchableOpacity>
                </MatteCard>

                <Text style={styles.viewLabel}>CONFIGURACIÓN DE INTERFAZ</Text>
                <MatteCard radius={Radius.lg}>
                    <View style={styles.sliderBox}>
                        <Text style={styles.sliderLabel}>Modo de Rendimiento</Text>
                        <Text style={styles.rowDesc}>Optimiza animaciones según la potencia de tu CPU.</Text>
                        <View style={styles.toggleRow}>
                            {[
                                {l:'Eco', v:'eco'}, 
                                {l:'Ahorro', v:'ahorro'}, 
                                {l:'Standard', v:'balanced'}, 
                                {l:'Ultra', v:'ultra'}
                            ].map((opt) => (
                                <TouchableOpacity 
                                    key={opt.l} 
                                    onPress={() => { 
                                        setPerformanceMode(opt.v as any); 
                                        setIsModified(true); 
                                        updateAppearance({ performanceMode: opt.v as any });
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
                                    }} 
                                    style={[styles.miniToggle, performanceMode === opt.v && styles.miniToggleActive]}
                                >
                                    <Text style={[styles.miniToggleText, performanceMode === opt.v && styles.miniToggleTextActive]}>{opt.l}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.rowLabelGroup}>
                                <Layers size={18} color={theme.primary} />
                                <Text style={styles.rowLabel}>Modo Compacto</Text>
                            </View>
                            <Text style={styles.rowDesc}>Interfaz más densa para pantallas pequeñas.</Text>
                        </View>
                        <Switch 
                            value={compactMode} 
                            onValueChange={(v) => { 
                                setCompactMode(v); 
                                setIsModified(true); 
                                updateAppearance({ compactMode: v });
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }} 
                            thumbColor={compactMode ? theme.primary : '#ccc'} 
                        />
                    </View>
                </MatteCard>
            </MotiView>
          )}

          {currentView === 'notifications' && (
            <MotiView key="notifications" from={{ opacity: 0, translateX: 50 }} animate={{ opacity: 1, translateX: 0 }} exit={{ opacity: 0, translateX: -50 }}>
                <SubHeader title="Notificaciones" />
                <Text style={styles.viewLabel}>CONTROL DE ALERTAS</Text>
                <MatteCard radius={Radius.lg}>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.rowLabelGroup}>
                                <Bell size={18} color={theme.primary} />
                                <Text style={styles.rowLabel}>Alertas Inteligentes</Text>
                            </View>
                            <Text style={styles.rowDesc}>Recibe recordatorios proactivos de tareas y clases.</Text>
                        </View>
                        <Switch 
                            value={notifications} 
                            onValueChange={(v) => { setNotifications(v); setIsModified(true); }} 
                            thumbColor={notifications ? theme.primary : '#ccc'} 
                        />
                    </View>
                    <View style={[styles.divider, { opacity: 0.1 }]} />
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.rowLabelGroup}>
                                <Brain size={18} color={theme.primary} />
                                <Text style={styles.rowLabel}>Motivación Oracle</Text>
                            </View>
                            <Text style={styles.rowDesc}>Recibe frases diarias de Corty en el Dashboard.</Text>
                        </View>
                        <Switch 
                            value={oracleQuotesEnabled} 
                            onValueChange={(v) => { setOracleQuotesEnabled(v); setIsModified(true); }} 
                            thumbColor={oracleQuotesEnabled ? theme.primary : '#ccc'} 
                        />
                    </View>
                    <TouchableOpacity 
                        style={styles.testHapticBtn} 
                        onPress={() => NotificationService.sendTestNotification()}
                    >
                        <Text style={styles.testHapticText}>ENVIAR NOTIFICACIÓN DE PRUEBA</Text>
                        <Bell size={14} color={theme.primary} />
                    </TouchableOpacity>
                </MatteCard>
                <Text style={[styles.rowDesc, { padding: 15, textAlign: 'center' }]}>
                    Las notificaciones inteligentes analizan tus fechas de entrega y horarios para avisarte en el momento justo.
                </Text>
            </MotiView>
          )}

          {currentView === 'ia' && (
            <MotiView key="ia" from={{ opacity: 0, translateX: 50 }} animate={{ opacity: 1, translateX: 0 }} exit={{ opacity: 0, translateX: -50 }}>
                <SubHeader title="Asistente IA" />
                <MatteCard radius={Radius.lg}>
                    <View style={styles.sliderBox}>
                        <Text style={styles.rowLabel}>Modelo Cortex</Text>
                        <Text style={styles.rowDesc}>Flash para velocidad instantánea, Pro para razonamiento profundo.</Text>
                        <View style={[styles.toggleRow, { marginTop: 10 }]}>
                            <TouchableOpacity onPress={() => { setModel('flash'); setIsModified(true); }} style={[styles.miniToggle, model === 'flash' && styles.miniToggleActive, { flex: 1 }]}>
                                <Text style={[styles.miniToggleText, model === 'flash' && styles.miniToggleTextActive]}>Flash</Text>
                                <Text style={{ fontSize: 8, color: model === 'flash' ? theme.primary : theme.textMuted, fontWeight: '700' }}>Velocidad</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setModel('pro'); setIsModified(true); }} style={[styles.miniToggle, model === 'pro' && styles.miniToggleActive, { flex: 1 }]}>
                                <Text style={[styles.miniToggleText, model === 'pro' && styles.miniToggleTextActive]}>Pro</Text>
                                <Text style={{ fontSize: 8, color: model === 'pro' ? theme.primary : theme.textMuted, fontWeight: '700' }}>Inteligencia</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.sliderBox}>
                        <Text style={styles.rowLabel}>Personalidad (Voz)</Text>
                        <Text style={styles.rowDesc}>Ajusta el tono de los consejos y proyecciones del Oráculo.</Text>
                        <View style={[styles.toggleRow, { marginTop: 10 }]}>
                            {['friendly', 'academic', 'concise'].map((p) => (
                                <TouchableOpacity 
                                    key={p} 
                                    onPress={() => { setPersonality(p as any); setIsModified(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} 
                                    style={[styles.miniToggle, personality === p && styles.miniToggleActive, { flex: 1 }]}
                                >
                                    <Text style={[styles.miniToggleText, personality === p && styles.miniToggleTextActive]}>
                                        {p === 'friendly' ? 'Relajado' : p === 'academic' ? 'Académico' : 'Directo'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.rowLabelGroup}>
                            <Cpu size={18} color={theme.primary} />
                            <Text style={styles.rowLabel}>Memoria de Sesión</Text>
                        </View>
                        <Switch value={isMemoryEnabled} onValueChange={(v) => { setIsMemoryEnabled(v); setIsModified(true); }} thumbColor={isMemoryEnabled ? theme.primary : '#ccc'} />
                    </View>

                    <TouchableOpacity 
                        style={[styles.logoutBtn, { margin: 15, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.02)' }]} 
                        onPress={() => {
                            Alert.alert('Limpiar Cortex IA', '¿Deseas borrar permanentemente todo el historial de chat con la IA?', [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Borrar todo', style: 'destructive', onPress: async () => {
                                    try {
                                        await updateUserProfile({ chatHistory: [] });
                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        Alert.alert('Historial Limpio', 'El historial de Cortex IA ha sido eliminado de la nube.');
                                    } catch (e) {
                                        Alert.alert('Error', 'No se pudo limpiar el historial.');
                                    }
                                }}
                            ]);
                        }}
                    >
                        <Trash2 size={18} color={theme.textMuted} />
                        <Text style={[styles.logoutText, { color: theme.textMuted, fontSize: 13 }]}>Borrar Historial de Vault</Text>
                    </TouchableOpacity>
                </MatteCard>
            </MotiView>
          )}

          {currentView === 'security' && (
            <MotiView key="security" from={{ opacity: 0, translateX: 50 }} animate={{ opacity: 1, translateX: 0 }} exit={{ opacity: 0, translateX: -50 }}>
                <SubHeader title="Seguridad" />
                <View style={styles.glassCard}>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>Cortex Vault (Biometría)</Text>
                            <Text style={styles.rowDesc}>Protección extra con huella dactilar o FaceID.</Text>
                        </View>
                        <Switch 
                            value={isBiometricEnabled} 
                            onValueChange={async (val) => {
                                if (val) {
                                    const result = await LocalAuthentication.authenticateAsync({
                                        promptMessage: 'Activar Bóveda Cortex',
                                    });
                                    if (result.success) {
                                        setIsBiometricEnabled(true);
                                        setIsModified(true);
                                    }
                                } else {
                                    setIsBiometricEnabled(false);
                                    setIsModified(true);
                                }
                            }} 
                            thumbColor={isBiometricEnabled ? theme.primary : '#ccc'}
                        />
                    </View>

                    <View style={[styles.divider, { marginVertical: 1, opacity: 0.1, backgroundColor: 'rgba(255,255,255,0.1)', height: 1 }]} />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.rowLabelGroup}>
                                <ShieldCheck size={18} color={theme.primary} />
                                <Text style={styles.rowLabel}>Guardar Inicio de Sesión</Text>
                            </View>
                            <Text style={styles.rowDesc}>Acceso rápido sin volver a pedir credenciales.</Text>
                        </View>
                        <Switch 
                            value={isLoginSaved} 
                            onValueChange={async (val) => { 
                                if (val) {
                                    setShowPassModal(true);
                                } else {
                                    await SecureStore.deleteItemAsync('user_creds');
                                    setIsLoginSaved(false);
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                }
                            }} 
                            thumbColor={isLoginSaved ? theme.primary : '#ccc'}
                        />
                    </View>
                </View>
            </MotiView>
          )}

          {currentView === 'academic' && (
            <MotiView key="academic" from={{ opacity: 0, translateX: 50 }} animate={{ opacity: 1, translateX: 0 }} exit={{ opacity: 0, translateX: -50 }}>
                <SubHeader title="Académico" />
                <View style={styles.glassCard}>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>Modo de Calificación</Text>
                            <Text style={styles.rowDesc}>Detallado permite ver notas por actividad.</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => {
                                const next = gradingMode === 'basic' ? 'detailed' : 'basic';
                                setGradingMode(next);
                                setIsModified(true);
                            }}
                            style={styles.miniToggleActive}
                        >
                             <Text style={styles.valText}>{gradingMode === 'basic' ? 'Básico' : 'Detallado'}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.rowLabelGroup}>
                                <Target size={18} color={theme.primary} />
                                <Text style={styles.rowLabel}>Meta Semestral</Text>
                            </View>
                            <Text style={styles.rowDesc}>Tu objetivo de GPA para este periodo.</Text>
                        </View>
                        <TextInput 
                          style={styles.uniInput} 
                          value={targetGrade?.toString()} 
                          onChangeText={(t) => { setTargetGrade(parseFloat(t)); setIsModified(true); }}
                          keyboardType="decimal-pad"
                          placeholder="4.0"
                        />
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.rowLabelGroup}>
                                <Sparkles size={18} color={theme.accent} />
                                <Text style={styles.rowLabel}>Escala Máxima</Text>
                            </View>
                            <Text style={styles.rowDesc}>Nota más alta posible (ej. 5.0 o 10.0).</Text>
                        </View>
                        <TextInput 
                          style={styles.uniInput} 
                          value={maxGrade?.toString()} 
                          onChangeText={(t) => { setMaxGrade(parseFloat(t)); setIsModified(true); }}
                          keyboardType="decimal-pad"
                          placeholder="5.0"
                        />
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.rowLabelGroup}>
                                <Award size={18} color={theme.primary} />
                                <Text style={styles.rowLabel}>Sistema Escolástico</Text>
                            </View>
                            <Text style={styles.rowDesc}>Adapta el entorno al estándar de tu universidad.</Text>
                        </View>
                        <View style={styles.toggleRow}>
                            {['5.0', '10.0', '100'].map(s => (
                                <TouchableOpacity 
                                    key={s} 
                                    onPress={() => { setGradeScale(s as any); setMaxGrade(parseFloat(s)); setIsModified(true); }} 
                                    style={[styles.miniToggle, gradeScale === s && styles.miniToggleActive]}
                                >
                                    <Text style={[styles.miniToggleText, gradeScale === s && styles.miniToggleTextActive]}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={styles.rowLabelGroup}>
                            <Bell size={18} color={theme.error} />
                            <Text style={styles.rowLabel}>Umbral de Riesgo</Text>
                        </View>
                        <TextInput 
                          style={styles.uniInput} 
                          value={alertThreshold?.toString()} 
                          onChangeText={(t) => { setAlertThreshold(parseFloat(t)); setIsModified(true); }}
                          keyboardType="decimal-pad"
                          placeholder="3.0"
                        />
                    </View>
                </View>

                <Text style={styles.viewLabel}>DISTRIBUCIÓN DE CORTES (%)</Text>
                <MatteCard radius={Radius.lg}>
                    {(() => {
                        const total = (cut1Weight || 0) + (cut2Weight || 0) + (cut3Weight || 0);
                        const isError = total !== 100;
                        return (
                            <View style={[styles.totalLabelBox, { backgroundColor: isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
                                <Text style={[styles.totalLabelText, { color: isError ? '#EF4444' : '#10B981' }]}>
                                    TOTAL: {total}% {isError ? '⚠️ DEBE SER 100%' : '✅'}
                                </Text>
                            </View>
                        );
                    })()}
                    <View style={styles.cutRows}>
                        <View style={styles.cutParameter}>
                            <Text style={styles.cutLabel}>Corte 1</Text>
                            <TextInput 
                                style={styles.cutInput} 
                                value={cut1Weight.toString()} 
                                onChangeText={(v) => { setCut1Weight(parseInt(v) || 0); setIsModified(true); }}
                                keyboardType="numeric"
                                maxLength={2}
                            />
                        </View>
                        <View style={styles.cutParameter}>
                            <Text style={styles.cutLabel}>Corte 2</Text>
                            <TextInput 
                                style={styles.cutInput} 
                                value={cut2Weight.toString()} 
                                onChangeText={(v) => { setCut2Weight(parseInt(v) || 0); setIsModified(true); }}
                                keyboardType="numeric"
                                maxLength={2}
                            />
                        </View>
                        <View style={styles.cutParameter}>
                            <Text style={styles.cutLabel}>Corte 3</Text>
                            <TextInput 
                                style={styles.cutInput} 
                                value={cut3Weight.toString()} 
                                onChangeText={(v) => { setCut3Weight(parseInt(v) || 0); setIsModified(true); }}
                                keyboardType="numeric"
                                maxLength={2}
                            />
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabel}>Oráculo Predictivo</Text>
                            <Text style={styles.rowDesc}>Habilita el cálculo avanzado de notas necesarias (IA).</Text>
                        </View>
                        <Switch 
                            value={isOracleEnabled} 
                            onValueChange={(v) => { setIsOracleEnabled(v); setIsModified(true); }}
                            thumbColor={isOracleEnabled ? theme.primary : '#ccc'}
                        />
                    </View>
                </MatteCard>
            </MotiView>
          )}

          {currentView === 'support' && (
            <MotiView key="support" from={{ opacity: 0, translateX: 50 }} animate={{ opacity: 1, translateX: 0 }} exit={{ opacity: 0, translateX: -50 }}>
                <SubHeader title="Ayuda" />
                <View style={styles.glassCard}>
                    <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('mailto:soporte@cortex.edu.co')}>
                        <Text style={styles.rowLabel}>Contactar Soporte</Text>
                        <ChevronRight size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.viewLabel}>CONTROL DE CUENTA</Text>
                <MatteCard radius={20} style={{ padding: 4 }}>
                    <TouchableOpacity 
                        style={styles.row} 
                        onPress={() => {
                            setAccountActionType('format');
                            setShowAccountControlModal(true);
                        }}
                    >
                        <View style={styles.rowLabelGroup}>
                            <Zap size={18} color="#F59E0B" />
                            <Text style={styles.rowLabel}>Formatear Datos Cortex</Text>
                        </View>
                        <ChevronRight size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.row, { borderBottomWidth: 0 }]} 
                        onPress={() => {
                            setAccountActionType('delete');
                            setShowAccountControlModal(true);
                        }}
                    >
                        <View style={styles.rowLabelGroup}>
                            <Trash2 size={18} color="#EF4444" />
                            <Text style={[styles.rowLabel, { color: '#EF4444' }]}>Eliminar Cuenta de Raíz</Text>
                        </View>
                        <ChevronRight size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                </MatteCard>
            </MotiView>
          )}

          {currentView === 'account_hub' && (
            <MotiView 
                key="account_hub" 
                from={{ opacity: 0, translateY: 20 }} 
                animate={{ opacity: 1, translateY: 0 }} 
                exit={{ opacity: 0, translateY: -20 }}
                transition={{ type: 'timing', duration: 500 }}
            >
                <SubHeader title="Centro de cuentas" />
                <Text style={styles.viewLabel}>CONFIGURACIÓN DE CUENTA</Text>
                <MatteCard radius={30} style={{ padding: 4, marginBottom: 20 }}>
                    <SettingCell 
                        label="Datos Personales" 
                        subLabel="Nombre, carrera y biografía"
                        icon={<User size={18} strokeWidth={1.5} color={theme.text} />}
                        onPress={() => setCurrentView('profile')}
                    />
                    <SettingCell 
                        label="Password y Seguridad" 
                        subLabel="Cortex Vault y biometría"
                        icon={<Shield size={18} strokeWidth={1.5} color={theme.text} />}
                        onPress={() => setCurrentView('security')}
                    />
                    <SettingCell 
                        label="Respaldo de Información" 
                        subLabel="Exportar e importar ecosistema"
                        icon={<Download size={18} strokeWidth={1.5} color={theme.text} />}
                        onPress={() => setCurrentView('backup')}
                        isLast
                    />
                </MatteCard>

                <Text style={styles.viewLabel}>CONTROL DE CUENTA</Text>
                <MatteCard radius={20} style={{ padding: 4 }}>
                    <TouchableOpacity 
                        style={styles.row} 
                        onPress={() => {
                            setAccountActionType('format');
                            setShowAccountControlModal(true);
                        }}
                    >
                        <View style={styles.rowLabelGroup}>
                            <Zap size={18} color="#F59E0B" />
                            <Text style={styles.rowLabel}>Formatear Datos Cortex</Text>
                        </View>
                        <ChevronRight size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.row, { borderBottomWidth: 0 }]} 
                        onPress={() => {
                            setAccountActionType('delete');
                            setShowAccountControlModal(true);
                        }}
                    >
                        <View style={styles.rowLabelGroup}>
                            <Trash2 size={18} color="#EF4444" />
                            <Text style={[styles.rowLabel, { color: '#EF4444' }]}>Eliminar Cuenta de Raíz</Text>
                        </View>
                        <ChevronRight size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                </MatteCard>
                <Text style={[styles.rowDesc, { marginTop: 20, textAlign: 'center', opacity: 0.5 }]}>
                   Cortex Academy Account Center v1.0 • Nexus Network
                </Text>
            </MotiView>
          )}

          {currentView === 'backup' && (
            <MotiView key="backup" from={{ opacity: 0, translateX: 50 }} animate={{ opacity: 1, translateX: 0 }} exit={{ opacity: 0, translateX: -50 }}>
                <SubHeader title="Respaldo" />
                <Text style={styles.viewLabel}>CORTEX BACKUP & RECOVERY</Text>
                <MatteCard radius={20} style={{ padding: 4 }}>
                    <TouchableOpacity 
                        style={styles.row} 
                        onPress={handleExportBackup}
                    >
                        <View style={styles.rowLabelGroup}>
                            <Download size={18} color={theme.primary} />
                            <View>
                                <Text style={styles.rowLabel}>Realizar Respaldo Local</Text>
                                <Text style={styles.rowDesc}>Exporta tu ecosistema a un archivo JSON.</Text>
                            </View>
                        </View>
                        <ChevronRight size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.row, { borderBottomWidth: 0 }]} 
                        onPress={handleImportBackup}
                    >
                        <View style={styles.rowLabelGroup}>
                            <Upload size={18} color={theme.accent} />
                            <View>
                                <Text style={styles.rowLabel}>Restaurar Copia de Seguridad</Text>
                                <Text style={styles.rowDesc}>Importa datos desde un archivo .json externo.</Text>
                            </View>
                        </View>
                        <ChevronRight size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                </MatteCard>
                <Text style={[styles.rowDesc, { padding: 20, textAlign: 'center' }]}>
                    Los archivos de respaldo son la única forma de recuperar tu ecosistema si pierdes acceso a la red de sincronización de Cortex.
                </Text>
            </MotiView>
          )}
        </AnimatePresence>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* MODAL DE CONFIRMACIÓN DE CONTRASEÑA (Para guardado de datos) */}
      <Modal
        visible={showAccountControlModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAccountControlModal(false)}
      >
        <View style={styles.modalOverlay}>
          {farewellStep === 0 ? (
            <MotiView
               from={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               style={styles.modalContainer}
            >
              <MatteCard 
                radius={32} 
                style={styles.modalGlass}
                baseColor={theme.isDark ? "rgba(30,30,40,0.95)" : "rgba(255,255,255,0.98)"}
              >
                <View style={[styles.avatarCircle, { backgroundColor: (accountActionType === 'delete' ? '#EF4444' : '#F59E0B') + '15', marginBottom: 20 }]}>
                    <ShieldCheck size={32} color={accountActionType === 'delete' ? '#EF4444' : '#F59E0B'} />
                </View>
                
                <Text style={styles.modalTitle}>
                    {accountActionType === 'delete' ? 'Purga Definitiva' : 'Reinicio de Sistema'}
                </Text>
                <Text style={styles.modalMsg}>
                    {accountActionType === 'delete' 
                        ? 'Estás a punto de borrar tu cuenta de raíz de los servidores de Firebase. Esta acción es IRREVERSIBLE y perderás todo tu progreso en Cortex Academy.' 
                        : 'Se eliminarán todas tus materias, horarios y tareas, pero conservaremos tu nombre y universidad para que empieces de cero.'
                    }
                </Text>

                <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 20 }}>
                    <TouchableOpacity 
                        disabled={isDeleting}
                        style={[styles.modalBtn, { backgroundColor: 'rgba(0,0,0,0.05)', flex: 1 }]} 
                        onPress={() => setShowAccountControlModal(false)}
                    >
                        <Text style={[styles.modalBtnText, { color: theme.textMuted }]}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        disabled={isDeleting}
                        style={[styles.modalBtn, { backgroundColor: accountActionType === 'delete' ? '#EF4444' : '#F59E0B', flex: 1.5 }]} 
                        onPress={accountActionType === 'delete' ? handleDeleteAccount : handleFormatAccount}
                    >
                        <Text style={[styles.modalBtnText, { color: '#FFF' }]}>
                            {isDeleting ? 'Procesando...' : (accountActionType === 'delete' ? 'Eliminar Todo' : 'Formatear')}
                        </Text>
                    </TouchableOpacity>
                </View>
              </MatteCard>
            </MotiView>
          ) : (
            <MotiView 
                from={{ opacity: 0, translateY: 30 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={{ alignItems: 'center', gap: 20 }}
            >
                <Brain size={80} color={theme.primary} />
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFF', textAlign: 'center' }}>
                    Fue un honor ser tu copiloto, {name}.
                </Text>
                <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', paddingHorizontal: 40 }}>
                    Cortex Academy se está desconectando. Tus datos han sido purgados exitosamente de la red Nexus.
                </Text>
                <View style={{ height: 4, width: 200, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginTop: 20 }}>
                    <MotiView 
                        from={{ width: 0 }} 
                        animate={{ width: 200 }} 
                        transition={{ duration: 3000 }} 
                        style={{ height: '100%', backgroundColor: theme.primary }} 
                    />
                </View>
            </MotiView>
          )}
        </View>
      </Modal>

      <Modal
        visible={showPassModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPassModal(false)}
      >
        <View style={styles.modalOverlay}>
          <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            style={styles.modalContainer}
          >
            <MatteCard
                radius={32}
                style={styles.modalGlass}
                baseColor={theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.92)"}
               
            >
                <View style={[styles.avatarCircle, { backgroundColor: theme.primary + '15', marginBottom: 15 }]}>
                    <Lock size={24} color={theme.primary} />
                </View>
                
                <Text style={styles.modalTitle}>Confirmar Acceso</Text>
                <Text style={styles.modalMsg}>
                    Ingresa tu contraseña actual para encriptar y guardar tus credenciales en este dispositivo de forma segura.
                </Text>

                <View style={[styles.inputContainer, { width: '100%', marginBottom: 20 }]}>
                    <TextInput
                        style={styles.passInput}
                        placeholder="Contraseña"
                        placeholderTextColor={theme.textMuted}
                        secureTextEntry
                        value={confirmPass}
                        onChangeText={setConfirmPass}
                        autoFocus
                    />
                </View>

                <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                    <TouchableOpacity 
                        style={[styles.modalBtn, { backgroundColor: 'rgba(0,0,0,0.05)' }]} 
                        onPress={() => {
                            setShowPassModal(false);
                            setConfirmPass('');
                            setIsLoginSaved(false);
                        }}
                    >
                        <Text style={[styles.modalBtnText, { color: theme.textMuted }]}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.modalBtn, { backgroundColor: theme.primary }]} 
                        onPress={async () => {
                            if (confirmPass.length < 6) {
                                Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
                                return;
                            }
                            try {
                                await SecureStore.setItemAsync('user_creds', JSON.stringify({ 
                                    email: auth.currentUser?.email, 
                                    password: confirmPass 
                                }));
                                setIsLoginSaved(true);
                                setShowPassModal(false);
                                setConfirmPass('');
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                Alert.alert('Éxito', 'Tus datos de acceso han sido guardados de forma segura.');
                            } catch (e) {
                                Alert.alert('Error', 'No se pudieron guardar las credenciales.');
                            }
                        }}
                    >
                        <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Confirmar</Text>
                    </TouchableOpacity>
                </View>
            </MatteCard>
          </MotiView>
        </View>
      </Modal>
      <UserManual 
        visible={showManual} 
        onClose={() => setShowManual(false)} 
      />
    </CleanBackground>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  achievementsWrapper: { paddingHorizontal: 4, gap: 12, marginBottom: 20 },
  achievementCard: { width: 110, height: 100, padding: 12, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'transparent' },
  achIconSarah: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  achLabelSarah: { fontSize: 10, fontWeight: '800', textAlign: 'center' },

  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: theme.compactMode ? 12 : 16,
    paddingVertical: theme.compactMode ? 10 : 14, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.05)' 
  },
  rowLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { fontSize: 14, fontWeight: '800', color: theme.text, letterSpacing: -0.3 },
  rowDesc: { fontSize: 11, color: theme.textMuted, fontWeight: '500', marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 10 },

  scroll: { flex: 1 },
  content: { padding: 20 },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '900', color: theme.text, letterSpacing: -1 },
  saveBtnSarah: { backgroundColor: theme.primary, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, ...Shadows.sm },
  saveBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  categorySection: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20, marginTop: 20, borderRadius: 20, backgroundColor: theme.error + '10' },
  logoutText: { fontSize: 16, fontWeight: '800', color: theme.error },
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 25 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  subTitle: { fontSize: 24, fontWeight: '900', color: theme.text, letterSpacing: -0.5 },
  profileHeaderCenter: { alignItems: 'center', marginBottom: 30 },
  avatarLargeContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.md },
  avatarLarge: { width: '100%', height: '100%', borderRadius: 50 },
  avatarLargeInitial: { fontSize: 44, fontWeight: '900', color: theme.primary },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.primary, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  mainName: { fontSize: 22, fontWeight: '900', color: theme.text, marginTop: 15 },
  subCareer: { fontSize: 14, color: theme.textSecondary, fontWeight: '600' },
  studentCard: { 
    padding: 20, 
    borderRadius: 30, 
    borderWidth: 1.5,
    marginBottom: 20,
    minHeight: 160,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  univLogoBoxRight: { 
    width: 70, 
    height: 70, 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative', // Added for absolute positioning of children
  },
  cardUnivLogoRight: { width: 50, height: 50 },
  qrMarker: { position: 'absolute', bottom: -5, right: -5, gap: 2, opacity: 0.4 },
  qrDot: { width: 4, height: 4, borderRadius: 1 },
  qrLine: { width: 15, height: 2, borderRadius: 1 },
  cardBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 10 },
  cardAvatarBox: { width: 75, height: 75, borderRadius: 22, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  cardAvatar: { width: '100%', height: '100%', borderRadius: 22 },
  cardInitial: { fontSize: 32, fontWeight: '900', color: theme.primary },
  cardCameraBadge: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontSize: 22, fontWeight: '900', color: theme.text, letterSpacing: -0.5 },
  cardCareer: { fontSize: 13, color: theme.textSecondary, fontWeight: '700', marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 5 },
  metaPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  metaPillText: { fontSize: 10, fontWeight: '900' },
  hubOSText: {
    fontSize: 10,
    fontWeight: '800',
    opacity: 0.6,
    color: '#FFF',
  },
  legalAlert: {
    fontSize: 8,
    fontWeight: '900',
    position: 'absolute',
    top: 15,
    left: 20,
    opacity: 0.9,
  },
  nexusNoteBox: {
    position: 'absolute',
    bottom: -5,
    right: 0,
    alignItems: 'flex-end',
  },
  nexusNote: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFF',
    opacity: 0.7,
  },
  nexusSubNote: {
    fontSize: 6,
    fontWeight: '700',
    color: '#FFF',
    opacity: 0.5,
  },
  semesterStepper: { flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  semesterNum: { fontSize: 16, fontWeight: '900', color: theme.primary, width: 25, textAlign: 'center' },
  glassCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  uniInput: { flex: 1, textAlign: 'right', color: theme.primary, fontWeight: '700', fontSize: 15 },
  viewLabel: { fontSize: 11, fontWeight: '900', color: theme.textMuted, letterSpacing: 1.5, marginBottom: 15, marginTop: 5 },
  themePill: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'transparent' },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  themeText: { fontSize: 14, fontWeight: '700', color: theme.text },
  sliderBox: { padding: 20, gap: 10 },
  sliderLabel: { fontSize: 14, fontWeight: '700', color: theme.text },
  toggleRow: { 
    flexDirection: 'row', 
    gap: 4, 
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', 
    padding: 4, 
    borderRadius: 14 
  },
  miniToggle: { 
    paddingHorizontal: 12,
    paddingVertical: 8, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: 10 
  },
  miniToggleActive: { 
    backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  },
  miniToggleText: { fontSize: 12, fontWeight: '800', color: theme.textMuted },
  miniToggleTextActive: { color: theme.text },
  valText: { fontSize: 14, fontWeight: '800', color: theme.primary },
  testHapticBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    padding: 10, 
    margin: 12,
    marginTop: 0,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', 
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
  },
  testHapticText: { fontSize: 9, fontWeight: '900', color: theme.textSecondary, letterSpacing: 0.8 },
  cutRows: {
      flexDirection: 'row',
      padding: 15,
      gap: 15,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  cutParameter: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.03)',
      padding: 12,
      borderRadius: 15,
      alignItems: 'center',
      gap: 8,
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
  },
  modalContainer: {
      width: '100%',
      maxWidth: 400,
  },
  modalGlass: {
      padding: 24,
      alignItems: 'center'
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 10
  },
  modalMsg: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 20
  },
  inputContainer: {
      backgroundColor: 'rgba(0,0,0,0.05)',
      borderRadius: 15,
      paddingHorizontal: 15,
      height: 50,
      justifyContent: 'center'
  },
  passInput: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600'
  },
  modalBtn: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center'
  },
  modalBtnText: {
      fontSize: 15,
      fontWeight: '700'
  },
  avatarCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center'
  },
  cutLabel: {
      fontSize: 10,
      fontWeight: '900',
      color: theme.textMuted,
      textTransform: 'uppercase',
  },
  cutInput: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.primary,
    width: '100%',
    textAlign: 'center',
  },
  totalLabelBox: {
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  totalLabelText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  mainTitleSarah: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.text,
    marginBottom: 20,
    letterSpacing: -1,
  },
  logoutBtnSarah: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: Radius.lg,
    gap: 12,
    marginTop: 10,
  },
  logoutTextSarah: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  rowDescSarah: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  miniToggleSarah: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 6,
  },
  miniToggleActiveSarah: {
    backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
  },
  miniToggleTextSarah: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.textMuted,
  },
  miniToggleTextActiveSarah: {
    color: theme.text,
  },
  sliderBoxSarah: {
    marginBottom: 15,
  },
  rowLabelBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderLabelSarah: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
  },
  sliderValueSarah: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.primary,
  },
  toggleRowSarah: {
    flexDirection: 'row',
    gap: 5,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    padding: 6,
    borderRadius: 16,
  },
  colorRowSarah: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 10,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    padding: 12,
    borderRadius: 20,
  },
  colorDotSarah: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  // Profile Hero Styles
  heroContainer: {
      alignItems: 'center',
      paddingVertical: 30,
      marginBottom: 10,
  },
  heroAvatarContainer: {
      position: 'relative',
      marginBottom: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 10,
  },
  heroAvatar: {
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 4,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  heroEditBadge: {
      position: 'absolute',
      bottom: 5,
      right: 5,
      backgroundColor: theme.primary,
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.isDark ? '#1C1C1E' : '#F2F2F7',
  },
  heroTextContainer: {
      alignItems: 'center',
  },
  heroGreeting: {
      fontSize: 30,
      fontWeight: '900',
      color: theme.text,
      letterSpacing: -0.8,
  },
  heroEmail: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
      fontWeight: '600',
      opacity: 0.8,
  },
});
