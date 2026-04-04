import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { Brain, Mail, Lock, User as UserIcon, Eye, EyeOff, ShieldCheck, Fingerprint, AlertCircle, CheckCircle, ArrowRight, UserPlus, LogIn } from 'lucide-react-native';
import Svg, { Path, Circle, G, Line } from 'react-native-svg';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import NetInfo from '@react-native-community/netinfo';
import { Spacing, Radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { MatteCard } from '../components/design-system/CortexMatte';
import CortexCore from '../components/CortexCore';
import CortexPrompt from '../components/CortexPrompt';
import { auth, db } from '../services/firebase';
import firestore from '@react-native-firebase/firestore';
import auth_native from '@react-native-firebase/auth';
import { useResponsive } from '../hooks/useResponsive';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// ─── Google OAuth Client IDs ─────────────────────────────────────────────────
const GOOGLE_WEB_CLIENT_ID = '299757536536-rib4p4ui126co33nkt15n4cofpnpo6dt.apps.googleusercontent.com';

type AuthView = 'login' | 'register' | 'reset';

const getFirebaseError = (code: string): string => {
  const errors: Record<string, string> = {
    'auth/user-not-found':        'No existe ninguna cuenta con este correo.',
    'auth/wrong-password':        'La contraseña es incorrecta. Inténtalo de nuevo.',
    'auth/invalid-credential':    'Las credenciales son incorrectas. Verifica tu correo y contraseña.',
    'auth/invalid-email':         'El correo electrónico no tiene un formato válido.',
    'auth/email-already-in-use':  'Este correo ya está registrado. Intenta iniciar sesión.',
    'auth/weak-password':         'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests':     'Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.',
    'auth/network-request-failed':'Sin conexión a internet. Verifica tu red.',
    'auth/user-disabled':         'Esta cuenta ha sido deshabilitada. Contacta soporte.',
    'auth/operation-not-allowed': 'Este método de inicio de sesión no está habilitado.',
  };
  return errors[code] || 'Ocurrió un error inesperado. Inténtalo de nuevo.';
};

// CortexCore component is now imported from ../components/CortexCore

// PulsingWaves is now defined inside AuthScreen to access styles correctly

// ─── ErrorBanner ─────────────────────────────────────────────────────────────
const ErrorBanner = ({ message, type = 'error' }: { message: string; type?: 'error' | 'success' }) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (type === 'error') {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [message]);

  const isSuccess = type === 'success';
  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: 12,
          backgroundColor: isSuccess ? '#F0FDF4' : '#FFF1F2',
          borderWidth: 1,
          borderColor: isSuccess ? '#BBF7D0' : '#FECDD3',
        },
        { transform: [{ translateX: shakeAnim }] },
      ]}
    >
      {isSuccess
        ? <CheckCircle size={16} color="#16A34A" />
        : <AlertCircle  size={16} color="#E11D48" />
      }
      <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: isSuccess ? '#15803D' : '#BE123C', lineHeight: 17 }}>
        {message}
      </Text>
    </Animated.View>
  );
};

// ─── Main AuthScreen ──────────────────────────────────────────────────────────
export default function AuthScreen({ onLogin, onGuest }: { onLogin: () => void; onGuest?: () => void }) {
  const { theme } = useTheme();
  const { isTablet, isLaptop, width: screenWidth, height: screenHeight } = useResponsive();
  const isWide = isTablet || isLaptop;
  const styles = getStyles(theme, isWide, screenHeight);

  // ─── PulsingWaves 🌊 ─────────────────────────────────────────────────────────
  const PulsingWaves = ({ theme }: { theme: any }) => {
    return (
      <View style={styles.wavesAbsolute}>
        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            from={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{
              loop: true,
              duration: 4000,
              delay: i * 1000,
              type: 'timing',
            }}
            style={[
              styles.waveCircle,
              { borderColor: theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }
            ]}
          />
        ))}
      </View>
    );
  };

  const [view, setView]                 = useState<AuthView>('login');
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess]       = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');

  const [errorMsg, setErrorMsg]     = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [recentAccount, setRecentAccount] = useState<any>(null);
  const [showRecentAccount, setShowRecentAccount] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const saved = await AsyncStorage.getItem('@last_user');
        if (saved) {
          const data = JSON.parse(saved);
          setRecentAccount(data);
          setShowRecentAccount(true);
          setEmail(data.email || '');
        }
      } catch (e) {
        console.log("Error loading recent account", e);
      }
    };
    loadRecent();
  }, []);

  const saveRecentAccount = async (u: any) => {
    if (!u || u.isAnonymous) return; // Ignorar invitados o nulos

    try {
      // Intentar obtener el nombre real de Firestore primero
      const userRef = db.collection('users').doc(u.uid);
      const userSnap = await userRef.get();
      const userData = userSnap.exists() ? userSnap.data() : null;

      const data = {
        uid: u.uid,
        email: u.email,
        name: userData?.name || u.displayName || name || 'Usuario de Cortex',
        photo: u.photoURL || userData?.photoURL,
        lastActive: Date.now()
      };
      await AsyncStorage.setItem('@last_user', JSON.stringify(data));
    } catch (e) {
      console.error("Error saving recent account:", e);
    }
  };

  const isRegister = view === 'register';
  const isReset    = view === 'reset';

  const clearMessages = () => { setErrorMsg(''); setSuccessMsg(''); };

  const [cortyMessage, setCortyMessage] = useState('¡Hola! Soy Corty, tu asistente.');
  const [cortyExpression, setCortyExpression] = useState<'normal' | 'happy' | 'thinking' | 'wink'>('normal');

  const loginPhrases = [
    "¡Qué bueno verte de nuevo!",
    "¿Listo para conquistar el semestre?",
    "CortexHub OS 3.1: Sistema Iniciado.",
    "Ingresa tus credenciales para acceder."
  ];

  const registerPhrases = [
    "¡Únete a la nueva era académica!",
    "Crea tu cuenta en pocos segundos.",
    "Te ayudaré a organizar tu vida.",
    "Cortex es mejor con amigos."
  ];

  useEffect(() => {
    let interval: any;
    if (!loading && !isSuccess && !errorMsg) {
       interval = setInterval(() => {
          const phrases = isRegister ? registerPhrases : loginPhrases;
          const randomIdx = Math.floor(Math.random() * phrases.length);
          setCortyMessage(phrases[randomIdx]);
          // Occasionally change expression
          if (Math.random() > 0.7) setCortyExpression('happy');
          else if (Math.random() > 0.4) setCortyExpression('thinking');
          else setCortyExpression('normal');
       }, 5000);
    }
    return () => clearInterval(interval);
  }, [view, loading, isSuccess, errorMsg]);

  useEffect(() => {
    if (loading) {
      setCortyMessage('Sincronizando con el núcleo...');
      setCortyExpression('thinking');
    }
  }, [loading]);

  useEffect(() => {
    if (isSuccess) {
      setCortyMessage('¡Acceso concedido! Bienvendo.');
      setCortyExpression('happy');
    }
  }, [isSuccess]);

  useEffect(() => {
    if (errorMsg) {
      setCortyMessage('Ups, algo salió mal. Revisa los datos.');
      setCortyExpression('normal');
    }
  }, [errorMsg]);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const handleGoogleSignIn = async () => {
    clearMessages();
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      
      if (!idToken) throw new Error('No se recibió el ID Token de Google.');

      setLoading(true);
      const credential = auth_native.GoogleAuthProvider.credential(idToken);
      await auth.signInWithCredential(credential);
      
      setTimeout(async () => { 
        setLoading(false); 
        if (auth.currentUser) {
            saveRecentAccount(auth.currentUser);
        }
        onLogin(); 
      }, 1200);
    } catch (error: any) {
      setLoading(false);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
      setErrorMsg('Error al conectar con Google. Revisa tu conexión.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleBiometricPress = async () => {
    const attempt = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autenticación biométrica',
      fallbackLabel: 'Usar contraseña',
    });
    if (attempt.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onLogin();
    }
  };

  const handleAuth = async () => {
    clearMessages();
    if (isReset) {
      if (!email.trim()) {
        setErrorMsg('Por favor ingresa tu correo electrónico.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      setLoading(true);
      try {
        await auth.sendPasswordResetEmail(email.trim());
        setSuccessMsg('¡Correo enviado! Revisa tu bandeja de entrada.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e: any) {
        setErrorMsg(getFirebaseError(e.code));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        if (!email.trim() || !password || !name.trim()) {
            setLoading(false);
            return;
        }
        await auth.createUserWithEmailAndPassword(email.trim(), password);
      } else if (isReset) {
        // ... handled above already ...
      } else {
        // LOGIN FLOW
        let authEmail = email.trim();
        let authPass = password;

        // Si estamos en RecentAccount pero no hay password, intentar recuperarla de SecureStore
        if (showRecentAccount && !password && recentAccount) {
            try {
                const credsRaw = await SecureStore.getItemAsync('user_creds');
                if (credsRaw) {
                    const creds = JSON.parse(credsRaw);
                    authEmail = creds.email;
                    authPass = creds.password;
                    // Actualizar estados para que los inputs (si se muestran luego) tengan la info
                    setEmail(authEmail);
                    setPassword(authPass);
                } else {
                    setErrorMsg('No se encontraron credenciales guardadas. Ingresa tu contraseña.');
                    setShowRecentAccount(false);
                    setLoading(false);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    return;
                }
            } catch (err) {
                setErrorMsg('Error al recuperar datos seguros.');
                setLoading(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }
        }

        if (!authEmail || !authPass) {
            setErrorMsg('Por favor completa todos los campos.');
            setLoading(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        await auth.signInWithEmailAndPassword(authEmail, authPass);
      }
      setIsSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(async () => { 
        setLoading(false); 
        if (auth.currentUser) {
            saveRecentAccount(auth.currentUser);
            
            // Si es login normal (no auto-sign) y no tenemos credenciales guardadas, preguntar
            const hasCreds = await SecureStore.getItemAsync('user_creds');
            if (!hasCreds && !isRegister) {
                setShowSaveModal(true);
            } else {
                onLogin(); 
            }
        } else {
            onLogin();
        }
      }, 1500);
    } catch (e: any) {
      setErrorMsg(getFirebaseError(e.code));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      <LinearGradient
        colors={theme.isDark ? ['#050505', '#080808', '#000000'] : ['#F2EEE9', '#EBE5DF', '#E5DDD4']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <View style={[styles.logoBadge, theme.isDark && { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Brain size={14} color={theme.isDark ? "#fff" : "#000"} />
          </View>
          <Text style={[styles.logoText, theme.isDark && { color: "#fff" }]}>CortexHub OS</Text>
        </View>

        <View style={styles.mainLayout}>
          {isOffline && (
            <MotiView 
              from={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              style={styles.offlineWarning}
            >
              <AlertCircle size={14} color="#F59E0B" />
              <Text style={styles.offlineWarningText}>Modo Offline activa. Se requiere red para iniciar sesión.</Text>
            </MotiView>
          )}
          <View style={styles.sideCorty}>
            <View style={styles.robotWrap}>
              <CortexCore
                isPasswordFocused={isPasswordFocused}
                isSuccess={isSuccess}
                showPassword={showPassword}
                theme={theme}
                message={cortyMessage}
                expression={cortyExpression}
                size={isWide ? 220 : (screenHeight < 800 ? 100 : 118)}
              />
            </View>
          </View>

          <View style={styles.sideForm}>
            <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} style={styles.header}>
              <Text style={[styles.title, theme.isDark && { color: '#fff' }]}>
                {isRegister ? 'Crear una cuenta' : isReset ? 'Recuperar contraseña' : 'Bienvenido de nuevo'}
              </Text>
              <Text style={[styles.subtitle, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>
                {isRegister
                  ? 'Ingresa tus datos para crear tu cuenta en Cortex.'
                  : isReset
                  ? 'Te enviaremos un correo para restablecer tu contraseña.'
                  : 'Ingresa tus datos para iniciar sesión.'}
              </Text>
            </MotiView>

            {showRecentAccount && view === 'login' ? (
              <MotiView 
                from={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ type: 'spring', damping: 20 }}
                style={styles.cardWrap}
              >
                <BlurView 
                  intensity={theme.isDark ? 40 : 60}
                  style={[
                    styles.formCard, 
                    { borderRadius: 40, borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)' },
                    theme.isDark ? { backgroundColor: 'rgba(30,30,30,0.5)' } : { backgroundColor: 'rgba(255,255,255,0.4)' }
                  ]}
                >
                  <View style={styles.recentProfileHeader}>
                    <View style={[styles.avatarCircle, { backgroundColor: theme.primary + '20' }]}>
                      <UserIcon size={32} color={theme.primary} />
                    </View>
                    <View>
                      <Text style={[styles.welcomeSmall, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>Bienvenido de nuevo,</Text>
                      <Text style={[styles.recentName, theme.isDark && { color: '#fff' }]}>{recentAccount?.name}</Text>
                    </View>
                  </View>

                  <View style={styles.btnWrapper}>
                    <PulsingWaves theme={theme} />
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        loading && styles.primaryButtonDisabled,
                        theme.isDark ? { backgroundColor: '#fff' } : { backgroundColor: '#111' }
                      ]}
                      onPress={handleAuth}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={[styles.primaryText, theme.isDark ? { color: '#000' } : { color: '#fff' }]}>Continuar como {recentAccount?.name.split(' ')[0]}</Text>
                        <ArrowRight size={16} color={theme.isDark ? '#000' : '#fff'} />
                      </View>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    style={[styles.socialButton, theme.isDark ? { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' } : { backgroundColor: '#fff' }]} 
                    onPress={handleBiometricPress}
                  >
                    <Fingerprint size={18} color={theme.isDark ? "#fff" : "#111"} />
                    <Text style={[styles.socialText, theme.isDark && { color: "#fff" }]}>Usar Biometría</Text>
                  </TouchableOpacity>

                  <View style={styles.recentActions}>
                    <TouchableOpacity 
                        onPress={() => { clearMessages(); setShowRecentAccount(false); }}
                        style={styles.recentActionBtn}
                    >
                        <UserPlus size={14} color={theme.textSecondary} />
                        <Text style={styles.recentActionText}>Usar otra cuenta</Text>
                    </TouchableOpacity>
                  </View>
                </BlurView>
              </MotiView>
            ) : (
              <MotiView from={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={styles.cardWrap}>
                <BlurView 
                  intensity={theme.isDark ? 50 : 80}
                  style={[
                    styles.formCard, 
                    { borderRadius: 40, borderBottomLeftRadius: 35, borderBottomRightRadius: 35, overflow: 'hidden', borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.02)' },
                    theme.isDark ? { backgroundColor: 'rgba(20,20,20,0.4)' } : { backgroundColor: 'rgba(255,255,255,0.4)' }
                  ]}
                >
                  {!!errorMsg   && <ErrorBanner message={errorMsg}   type="error"   />}
                  {!!successMsg && <ErrorBanner message={successMsg} type="success" />}

                  {isRegister && (
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>Nombre completo</Text>
                      <View style={[styles.inputRow, theme.isDark ? { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' } : { backgroundColor: '#fff', borderColor: 'rgba(0,0,0,0.05)' }]}>
                        <UserIcon size={16} color={theme.isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)"} />
                        <TextInput
                          placeholder="Escribe tu nombre completo"
                          placeholderTextColor={theme.isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)"}
                          style={[styles.input, theme.isDark && { color: '#fff' }]}
                          value={name}
                          onChangeText={t => { clearMessages(); setName(t); }}
                        />
                      </View>
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>Correo electrónico</Text>
                    <View style={[styles.inputRow, theme.isDark ? { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' } : { backgroundColor: '#fff', borderColor: 'rgba(0,0,0,0.05)' }]}>
                      <Mail size={16} color={theme.isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)"} />
                      <TextInput
                        placeholder="Ingresa tu correo"
                        placeholderTextColor={theme.isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)"}
                        style={[styles.input, theme.isDark && { color: '#fff' }]}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={t => { clearMessages(); setEmail(t); }}
                      />
                    </View>
                  </View>

                  {!isReset && (
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>Contraseña</Text>
                      <View style={[styles.inputRow, theme.isDark ? { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' } : { backgroundColor: '#fff', borderColor: 'rgba(0,0,0,0.05)' }]}>
                        <Lock size={16} color={theme.isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)"} />
                        <TextInput
                          placeholder="Ingresa tu contraseña"
                          placeholderTextColor={theme.isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)"}
                          style={[styles.input, theme.isDark && { color: '#fff' }]}
                          secureTextEntry={!showPassword}
                          onFocus={() => setIsPasswordFocused(true)}
                          onBlur={() => setIsPasswordFocused(false)}
                          value={password}
                          onChangeText={t => { clearMessages(); setPassword(t); }}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                          {showPassword
                            ? <EyeOff size={16} color={theme.isDark ? "#fff" : "rgba(0,0,0,0.4)"} />
                            : <Eye    size={16} color={theme.isDark ? "#fff" : "rgba(0,0,0,0.4)"} />}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <View style={styles.btnWrapper}>
                    {view === 'login' && <PulsingWaves theme={theme} />}
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        loading && styles.primaryButtonDisabled,
                        theme.isDark ? { backgroundColor: '#fff' } : { backgroundColor: '#111' }
                      ]}
                      onPress={handleAuth}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.primaryText, theme.isDark ? { color: '#000' } : { color: '#fff' }]}>
                        {loading
                          ? 'Procesando...'
                          : isReset
                          ? 'Enviar correo de recuperación'
                          : isRegister
                          ? 'Crear cuenta'
                          : 'Iniciar sesión'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {!isReset && (
                    <TouchableOpacity
                      onPress={() => { clearMessages(); setView('reset'); }}
                      style={styles.forgotLink}
                    >
                      <Text style={[styles.forgotText, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>¿Olvidaste tu contraseña?</Text>
                    </TouchableOpacity>
                  )}

                  {isReset && (
                    <TouchableOpacity
                      onPress={() => { clearMessages(); setView('login'); }}
                      style={styles.forgotLink}
                    >
                      <Text style={[styles.forgotText, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>← Volver al inicio de sesión</Text>
                    </TouchableOpacity>
                  )}

                  <View style={[styles.divider, theme.isDark ? { backgroundColor: 'rgba(255,255,255,0.08)' } : { backgroundColor: 'rgba(0,0,0,0.06)' }]} />

                  <TouchableOpacity style={[styles.socialButton, theme.isDark ? { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' } : { backgroundColor: '#fff', borderColor: 'rgba(0,0,0,0.05)' }]} onPress={handleBiometricPress}>
                    <Fingerprint size={18} color={theme.isDark ? "#fff" : "#111"} />
                    <Text style={[styles.socialText, theme.isDark && { color: "#fff" }]}>Ingreso Biométrico</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.socialButton, styles.googleButton, theme.isDark ? { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' } : { backgroundColor: '#fff', borderColor: 'rgba(0,0,0,0.05)' }]}
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <Svg width={18} height={18} viewBox="0 0 24 24">
                      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </Svg>
                    <Text style={[styles.socialText, theme.isDark && { color: "#fff" }]}>Continuar con Google</Text>
                  </TouchableOpacity>
                </BlurView>
              </MotiView>
            )}
          </View>
        </View>

        <CortexPrompt
            isVisible={showSaveModal}
            onClose={() => { setShowSaveModal(false); onLogin(); }}
            title="¿Guardar inicio de sesión?"
            description="Cortex recordará tus credenciales de forma encriptada localmente. No tendrás que volver a pedirlas en este dispositivo."
            icon={<ShieldCheck size={48} color={theme.primary} />}
            primaryAction={{
                label: 'Guardar datos',
                onPress: async () => {
                   try {
                       await SecureStore.setItemAsync('user_creds', JSON.stringify({ email: email.trim(), password }));
                   } catch {}
                   setShowSaveModal(false);
                   onLogin();
                }
            }}
            secondaryAction={{
                label: 'Ahora no',
                onPress: () => { setShowSaveModal(false); onLogin(); }
            }}
        />

        <TouchableOpacity
          onPress={() => { clearMessages(); setView(isRegister ? 'login' : 'register'); }}
          style={styles.switchRow}
        >
          <Text style={[styles.switchText, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>
            {isRegister ? '¿Ya tienes una cuenta? ' : '¿No tienes una cuenta? '}
            <Text style={[styles.switchHighlight, theme.isDark && { color: '#fff' }]}>{isRegister ? 'Inicia sesión' : 'Regístrate'}</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onGuest || onLogin} style={styles.guestRow}>
          <Text style={[styles.guestText, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>Continuar como invitado</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: any, isWide: boolean = false, height: number = 800) => {
  const isShort = height < 820;
  return StyleSheet.create({
    container:     { flex: 1, backgroundColor: theme.bg },
    scrollContent: { 
      flexGrow: 1, 
      padding: Spacing.xl, 
      paddingTop: isWide ? 60 : (isShort ? 25 : 40), 
      alignItems: 'center', 
      justifyContent: isWide ? 'center' : 'flex-start',
      gap: isWide ? Spacing.md : (isShort ? 8 : 12) 
    },
    logoRow:       { 
      width: '100%', 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'flex-start',
      gap: 10, 
      marginBottom: isWide ? 40 : 0,
      paddingHorizontal: 10,
    },
    logoBadge:     { 
      width: 28, 
      height: 28, 
      alignItems: 'center', 
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: 'rgba(0,0,0,0.03)',
    },
    logoText:      { fontSize: 13, fontWeight: '800', color: '#000', letterSpacing: 0.2 },
    mainLayout: {
      flexDirection: isWide ? 'row' : 'column',
      width: '100%',
      maxWidth: isWide ? 1000 : 500,
      alignItems: isWide ? 'center' : 'stretch',
      gap: isWide ? 60 : 0,
    },
    sideCorty: {
      flex: isWide ? 0.4 : 0,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: isWide ? 0 : (isShort ? 8 : 18),
    },
    sideForm: {
      flex: isWide ? 0.6 : 0,
    },
    robotWrap:     { alignItems: 'center', marginBottom: 0 },
    header:        { alignItems: 'flex-start', width: '100%', gap: 4, marginBottom: isShort ? 8 : Spacing.md, paddingHorizontal: 10 },
    title:         { fontSize: isShort ? 20 : 24, fontWeight: '900', color: '#000', letterSpacing: -0.8 },
    subtitle:      { fontSize: 13, color: 'rgba(0,0,0,0.4)', fontWeight: '600', lineHeight: 20 },
    cardWrap:      { width: '100%' },
    formCard:      { 
      width: '100%', 
      padding: isShort ? 15 : 22,
      paddingBottom: isShort ? 12 : 25,
      gap: isShort ? 8 : 14 
    },
    inputGroup:    { gap: isShort ? 4 : 8 },
    inputLabel:    { fontSize: 10, color: 'rgba(0,0,0,0.5)', fontWeight: '800', textTransform: 'uppercase', paddingHorizontal: 4 },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 16,
      paddingHorizontal: 16,
      height: isShort ? 46 : 50,
      borderWidth: 1.5,
    },
    input: { flex: 1, color: '#000', fontSize: 14, fontWeight: '600' },
    primaryButton: {
      height: isShort ? 46 : 50,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    primaryButtonDisabled: { opacity: 0.7 },
    btnWrapper: {
        width: '100%',
        position: 'relative',
        height: isShort ? 46 : 50,
        marginTop: isShort ? 0 : 8,
        justifyContent: 'center',
    },
    wavesAbsolute: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 0,
    },
    waveCircle: {
        position: 'absolute',
        width: '100%',
        height: isShort ? 46 : 50,
        borderRadius: 16,
        borderWidth: 1.5,
    },
    primaryText:   { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
    forgotLink:    { alignSelf: 'center', marginTop: 8 },
    forgotText:    { fontSize: 12, color: 'rgba(0,0,0,0.5)', fontWeight: '700' },
    divider:       { height: 1.5, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: isShort ? 6 : 10 },
    socialButton: {
      height: isShort ? 42 : 46,
      borderRadius: 16,
      borderWidth: 1.5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    googleButton: {
    },
    socialText:      { fontSize: 12, fontWeight: '800', color: '#000' },
    switchRow:       { paddingTop: isShort ? 4 : 10, alignSelf: 'center' },
    switchText:      { fontSize: 13, color: theme.textSecondary, fontWeight: '600' },
    switchHighlight: { color: '#000', fontWeight: '900' },
    guestRow:        { paddingTop: 8, alignSelf: 'center' },
    guestText:       { fontSize: 12, color: 'rgba(0,0,0,0.4)', fontWeight: '800', textDecorationLine: 'underline' },

    offlineWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#FDE68A',
    },
    offlineWarningText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#92400E',
    },

    // Recent Account Styles
    recentProfileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 20,
    },
    avatarCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    welcomeSmall: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.5)',
        fontWeight: '600',
    },
    recentName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#000',
    },
    recentActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
    },
    recentActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 8,
    },
    recentActionText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.textSecondary,
    },
  });
}
