import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';
import { 
  Brain, 
  School, 
  GraduationCap, 
  Target, 
  Zap, 
  Sun, 
  Moon, 
  Check, 
  ArrowLeft, 
  ChevronLeft,
  ShieldCheck,
  MessageSquare,
  Wand2,
  User as UserIcon,
  Maximize2,
  Minimize2,
  Globe,
  AlertCircle,
  Smartphone,
  Bell
} from 'lucide-react-native';
import { NotificationService } from '../services/NotificationService';
import NotificationPermissionModal from '../components/NotificationPermissionModal';
import Svg, { Path, Circle, G, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { MatteCard } from '../components/design-system/CortexMatte';
import CortexCore from '../components/CortexCore';
import { findUniversityDomain, findUniversityWithAI, getUniversityLogo, UniversityMatch } from '../services/university';

const { width, height } = Dimensions.get('window');

// CortyMascot is now handled by the shared CortexCore component

const TERMS_AND_CONDITIONS = `
# Términos y Condiciones de Uso
**Última actualización: 27 de Febrero de 2026**

Bienvenido a Cortex Hub, un producto operado por CG LABS.

Al utilizar Cortex, usted acepta estar legalmente vinculado por estos Términos.

### 1. Descripción del Servicio
Cortex es un "Sistema Operativo Académico" basado en IA diseñado para estudiantes para gestión de tareas, cálculo de promedios y asistencia inteligente.

### 2. Privacidad y Datos
Sus datos se almacenan de forma segura en Firebase e IA local. Usted conserva la propiedad de su contenido académico. No vendemos sus datos a terceros.

### 3. Propiedad Intelectual
Todo el diseño, código y elementos visuales de Cortex son propiedad de CG LABS o se usan bajo licencia. No está permitida la ingeniería inversa ni la redistribución.

### 4. Uso Prohibido
Usted acepta no utilizar el servicio para actividades ilegales, acoso, o para intentar comprometer la seguridad de otros usuarios o del servidor.

### 5. Limitación de Responsabilidad
Cortex es una herramienta de asistencia. No somos responsables por errores en el cálculo de promedios si los datos ingresados son incorrectos. El éxito académico depende del usuario.

### 6. Modificaciones
Nos reservamos el derecho de actualizar estos términos en cualquier momento. El uso continuo de la aplicación constituye la aceptación de los nuevos términos.

### 7. Terminación
Usted puede dejar de usar el servicio en cualquier momento. CG LABS puede suspender el acceso si se detectan violaciones graves a estos términos.

---
Con amor,
**El equipo de CG LABS**
`;

const THEME_OPTIONS = [
  { id: 'cortex_classic', color: '#06B6D4', name: 'Cortex' },
  { id: 'esmeralda', color: '#10B981', name: 'Esmeralda' },
  { id: 'nebula_violeta', color: '#8B5CF6', name: 'Violeta' },
  { id: 'neon_rose', color: '#F43F5E', name: 'Rose' },
  { id: 'academic_gold', color: '#F59E0B', name: 'Gold' },
] as const;

export default function OnboardingScreen({ onComplete, onBackToAuth }: { onComplete: () => void; onBackToAuth: () => void }) {
  const { theme, themeId, setTheme, toggleTheme, darkMode, setDarkMode } = useTheme();
  const { userProfile, updateUserProfile } = useData();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [fullName, setFullName] = useState(userProfile?.name || '');
  const [uniInput, setUniInput] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [uniResults, setUniResults] = useState<UniversityMatch | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [career, setCareer] = useState('');
  const [semester, setSemester] = useState(1);
  const [targetGrade, setTargetGrade] = useState(4.0);
  const [aiPersonality, setAiPersonality] = useState('friendly');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsExpanded, setIsTermsExpanded] = useState(false);
  const [showPermsModal, setShowPermsModal] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);

  const totalSteps = 7;

  // Pre-fill name
  useEffect(() => {
    if (userProfile?.name && !fullName) {
      setFullName(userProfile.name);
    }
  }, [userProfile]);

  // Reactive Uni Search (Domain detection)
  useEffect(() => {
    if (uniInput.includes('.') && !uniInput.includes(' ')) {
        const domainMatch = findUniversityDomain(uniInput);
        if (domainMatch) {
            setUniResults(domainMatch);
            setSearchError(null);
        }
    }
  }, [uniInput]);

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < totalSteps) {
      if (step === 6 && !hasPermissions) {
          setShowPermsModal(true);
          return;
      }
      setStep(step + 1);
    } else {
      if (!acceptedTerms) return;
      setLoading(true);
      try {
        await updateUserProfile({
          name: fullName,
          university: uniResults?.name || uniInput,
          universityLogo: uniResults?.logo || '',
          universityDomain: uniResults?.domain || '',
          career,
          semester,
          targetGrade,
          aiPersonality,
          theme: themeId,
          onboardingCompleted: true,
          setupDate: new Date().toISOString()
        });
        onComplete();
      } catch (error) {
        console.error("Error saving onboarding:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBackToAuth();
    }
  };

  const handleUniSearch = async () => {
    if (uniInput.length < 3) return;
    setIsResolving(true);
    setSearchError(null);
    setUniResults(null);

    const local = findUniversityDomain(uniInput);
    if (local) {
      setUniResults(local);
      setIsResolving(false);
      return;
    }

    try {
      const ai = await findUniversityWithAI(uniInput);
      if (ai) {
        setUniResults(ai);
      } else {
        setSearchError("No encontramos tu institución. Puedes continuar así.");
      }
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('quota') || error?.message?.includes('429')) {
          setSearchError("Sistema en mantenimiento. Puedes configurarlo más tarde.");
      } else {
          setSearchError("Hubo un problema. Puedes continuar con el nombre actual.");
      }
    } finally {
      setIsResolving(false);
    }
  };

  const onboardingPhrases: Record<number, string> = {
    1: `¡Bienvenido, ${fullName.split(' ')[0] || 'estudiante'}! Soy Corty, tu asistente.`,
    2: "Excelente carrera. ¿En qué semestre vas?",
    3: "Apuntar alto es la clave del éxito. ¡Vamos!",
    4: "Dime cómo quieres que te hable hoy.",
    5: "Ese color se ve increíble con tu estilo.",
    6: "Conecta tu Hub para no perderte nada.",
    7: "Casi terminamos. Revisa los términos finales."
  };

  const getCortyExpression = () => {
    if (step === 6) return 'success';
    if (isResolving) return 'thinking';
    if (step === 5) return 'happy';
    return 'normal';
  };

  const ThemePreview = () => (
    <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={styles.previewContainer}>
        <MatteCard radius={20} baseColor={theme.isDark ? 'rgba(30,30,40,0.95)' : 'rgba(255,255,255,0.95)'} style={styles.previewCard}>
            <View style={styles.previewHeader}>
                <View style={[styles.avatarMini, { backgroundColor: theme.primary + '20' }]}>
                    <Brain size={14} color={theme.primary} />
                </View>
                <View>
                    <Text style={[styles.previewUser, { color: theme.isDark ? 'white' : '#111' }]}>{fullName || 'Tu Nombre'}</Text>
                    <Text style={[styles.previewMeta, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>Cortex Premium</Text>
                </View>
            </View>
            <View style={styles.previewStats}>
                <View style={[styles.statDot, { backgroundColor: theme.primary }]} />
                <View style={[styles.statBar, { backgroundColor: theme.primary + '20' }]}>
                    <MotiView from={{ width: '0%' }} animate={{ width: '75%' }} transition={{ duration: 1000, type: 'timing' }} style={[styles.statFill, { backgroundColor: theme.primary }]} />
                </View>
            </View>
        </MatteCard>
    </MotiView>
  );

  return (
    <View style={[styles.container, theme.isDark && { backgroundColor: '#000' }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      <LinearGradient 
        colors={theme.isDark ? ['#000000', '#0A0A0A', '#111111'] : ['#F8F4F0', '#F1ECE7', '#EEE8E2']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={StyleSheet.absoluteFill} 
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.headerRow}>
             <TouchableOpacity onPress={handleBack} style={styles.backBtnWrapper}>
                <ArrowLeft size={22} color={theme.isDark ? "#fff" : "#111"} />
             </TouchableOpacity>
             <View style={styles.logoBadgeRow}>
                <MatteCard radius={8} baseColor={theme.isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.8)"} style={styles.miniLogo}>
                  <Brain size={10} color={theme.isDark ? "#fff" : "#111"} />
                </MatteCard>
                <Text style={[styles.logoText, theme.isDark && { color: "#fff" }]}>CORTEX ONBOARDING</Text>
             </View>
             <View style={styles.headerRight}>
                <Text style={[styles.stepIndicator, theme.isDark && { color: 'rgba(255,255,255,0.2)' }]}>{step}/{totalSteps}</Text>
             </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" scrollEnabled={!isTermsExpanded}>
            
            <CortexCore 
                theme={theme} 
                message={onboardingPhrases[step]} 
                expression={getCortyExpression() as any}
                size={140}
            />

            <AnimatePresence exitBeforeEnter>
                <MotiView
                  key={`step-${step}`}
                  from={{ opacity: 0, scale: 0.95, translateX: 50 }}
                  animate={{ opacity: 1, scale: 1, translateX: 0 }}
                  exit={{ opacity: 0, scale: 0.95, translateX: -50 }}
                  transition={{ type: 'timing', duration: 350 }}
                  style={styles.stepWrapper}
                >
                {/* STEP 1: IDENTITY */}
                {step === 1 && (
                    <>
                        <View style={styles.titleSection}>
                            <Text style={[styles.title, theme.isDark && { color: '#fff' }]}>¡Hola! Soy Corty.</Text>
                            <Text style={[styles.subtitle, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>Comencemos conociéndote. ¿Cómo te llamas?</Text>
                        </View>
                        <MatteCard radius={26} style={styles.card} baseColor={theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.92)"}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>Nombre completo</Text>
                                <View style={[styles.inputRow, theme.isDark && { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                                    <UserIcon size={16} color={theme.isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.5)"} />
                                    <TextInput placeholder="Escribe tu nombre" placeholderTextColor={theme.isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)"} style={[styles.input, theme.isDark && { color: '#fff' }]} value={fullName} onChangeText={setFullName} />
                                </View>
                            </View>

                            <View style={[styles.inputGroup, { marginTop: 15 }]}>
                                <Text style={[styles.inputLabel, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>Tu Universidad (Nombre / URL)</Text>
                                <View style={[styles.inputRow, theme.isDark && { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                                    <School size={16} color={theme.isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.5)"} />
                                    <TextInput placeholder="ej: unisimón.edu.co" placeholderTextColor={theme.isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)"} style={[styles.input, theme.isDark && { color: '#fff' }]} value={uniInput} onChangeText={setUniInput} onSubmitEditing={handleUniSearch} />
                                    <TouchableOpacity onPress={handleUniSearch} style={styles.magicBtn}>
                                        {isResolving ? <ActivityIndicator size="small" color={theme.primary} /> : <Wand2 size={16} color={theme.primary} />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {searchError && (
                                <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }} style={[styles.errorBanner, theme.isDark && { backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                    <AlertCircle size={14} color="#F59E0B" />
                                    <Text style={styles.errorText}>{searchError}</Text>
                                </MotiView>
                            )}

                            {uniResults && (
                                <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={[styles.uniResult, theme.isDark && { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                                    <View style={[styles.uniLogo, theme.isDark && { backgroundColor: '#111' }]}>
                                        <Image source={{ uri: uniResults.logo }} style={styles.logoImg} resizeMode="contain" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.uniName, theme.isDark && { color: '#fff' }]} numberOfLines={1}>{uniResults.name}</Text>
                                        <View style={styles.domainRow}>
                                            <Globe size={10} color={theme.isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)"} />
                                            <Text style={[styles.uniLink, theme.isDark && { color: 'rgba(255,255,255,0.3)' }]}>{uniResults.domain}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.checkCircle, { backgroundColor: '#10B98120' }]}>
                                        <Check size={14} color="#10B981" />
                                    </View>
                                </MotiView>
                            )}

                            <TouchableOpacity style={[styles.primaryButton, (!fullName || !uniInput) && styles.disabledBtn, theme.isDark && { backgroundColor: '#fff' }]} onPress={handleNext} disabled={!fullName || !uniInput || loading}>
                                <Text style={[styles.primaryText, theme.isDark && { color: '#000' }]}>Continuar</Text>
                            </TouchableOpacity>
                        </MatteCard>
                    </>
                )}

                {step === 2 && (
                    <>
                        <View style={styles.titleSection}>
                            <Text style={[styles.title, theme.isDark && { color: '#fff' }]}>Perfil Académico</Text>
                            <Text style={[styles.subtitle, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>Cuéntale a Corty qué estás estudiando.</Text>
                        </View>
                        <MatteCard radius={26} style={styles.card} baseColor={theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.92)"}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>Carrera</Text>
                                <View style={[styles.inputRow, theme.isDark && { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                                    <GraduationCap size={16} color={theme.isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.5)"} />
                                    <TextInput placeholder="Ej: Ingeniería Multimedia" placeholderTextColor={theme.isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)"} style={[styles.input, theme.isDark && { color: '#fff' }]} value={career} onChangeText={setCareer} />
                                </View>
                            </View>
                            <View style={[styles.inputGroup, { marginTop: 15 }]}>
                                <Text style={[styles.inputLabel, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>Semestre Actual</Text>
                                <View style={styles.semesterGrid}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                                        <TouchableOpacity key={s} onPress={() => setSemester(s)} style={[styles.semBtn, theme.isDark && { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }, semester === s && { backgroundColor: theme.isDark ? '#fff' : '#111', borderColor: theme.isDark ? '#fff' : '#111' }]}>
                                            <Text style={[styles.semText, theme.isDark && { color: 'rgba(255,255,255,0.4)' }, semester === s && { color: theme.isDark ? '#000' : 'white' }]}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                            <TouchableOpacity style={[styles.primaryButton, !career && styles.disabledBtn, theme.isDark && { backgroundColor: '#fff' }]} onPress={handleNext} disabled={!career || loading}><Text style={[styles.primaryText, theme.isDark && { color: '#000' }]}>Vincular carrera</Text></TouchableOpacity>
                        </MatteCard>
                    </>
                )}

                {step === 3 && (
                    <>
                        <View style={styles.titleSection}>
                            <Text style={[styles.title, theme.isDark && { color: '#fff' }]}>Metas de Éxito</Text>
                            <Text style={[styles.subtitle, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>Define tu estándar para que Corty te guíe.</Text>
                        </View>
                        <MatteCard radius={26} style={styles.card} baseColor={theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.92)"}>
                            <View style={styles.gradeBox}>
                                <Text style={[styles.gradeValue, { color: theme.primary }]}>{targetGrade.toFixed(1)}</Text>
                                <View style={styles.gradeGrid}>
                                    {[3.0, 3.5, 4.0, 4.5, 5.0].map(g => (
                                        <TouchableOpacity key={g} onPress={() => setTargetGrade(g)} style={[styles.gBtn, theme.isDark && { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }, targetGrade === g && { backgroundColor: theme.isDark ? '#fff' : '#111', borderColor: theme.isDark ? '#fff' : '#111' }]}><Text style={[styles.gText, theme.isDark && { color: 'rgba(255,255,255,0.4)' }, targetGrade === g && { color: theme.isDark ? '#000' : 'white' }]}>{g.toFixed(1)}</Text></TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                            <TouchableOpacity style={[styles.primaryButton, theme.isDark && { backgroundColor: '#fff' }]} onPress={handleNext} disabled={loading}><Text style={[styles.primaryText, theme.isDark && { color: '#000' }]}>Continuar</Text></TouchableOpacity>
                        </MatteCard>
                    </>
                )}

                {step === 4 && (
                    <>
                        <View style={styles.titleSection}>
                            <Text style={[styles.title, theme.isDark && { color: '#fff' }]}>Mi Personalidad</Text>
                            <Text style={[styles.subtitle, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>¿Cómo quieres que te hable?</Text>
                        </View>
                        <MatteCard radius={26} style={styles.card} baseColor={theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.92)"}>
                           <View style={styles.personalityStack}>
                                {[
                                    { id: 'friendly', name: 'Amigable', desc: 'Motivador y cercano.', icon: '😊' },
                                    { id: 'technical', name: 'Técnico', desc: 'Analítico y preciso.', icon: '🧠' },
                                    { id: 'stoic', name: 'Estoico', desc: 'Disciplinado y serio.', icon: '🗿' }
                                ].map(p => (
                                    <TouchableOpacity key={p.id} onPress={() => setAiPersonality(p.id)} style={[styles.pCard, theme.isDark && { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }, aiPersonality === p.id && { borderLeftWidth: 4, borderColor: theme.isDark ? '#fff' : '#111' }]}>
                                        <Text style={styles.pIcon}>{p.icon}</Text>
                                        <View style={{ flex: 1 }}><Text style={[styles.pName, theme.isDark && { color: '#fff' }]}>{p.name}</Text><Text style={[styles.pDesc, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>{p.desc}</Text></View>
                                        {aiPersonality === p.id && <Check size={16} color={theme.isDark ? "#fff" : "#111"} />}
                                    </TouchableOpacity>
                                ))}
                           </View>
                            <TouchableOpacity style={[styles.primaryButton, theme.isDark && { backgroundColor: '#fff' }]} onPress={handleNext} disabled={loading}><Text style={[styles.primaryText, theme.isDark && { color: '#000' }]}>Siguiente</Text></TouchableOpacity>
                        </MatteCard>
                    </>
                )}

                {step === 5 && (
                    <>
                        <View style={styles.titleSection}>
                            <Text style={[styles.title, theme.isDark && { color: '#fff' }]}>Tu Estilo</Text>
                            <Text style={[styles.subtitle, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>Personaliza el look de tu sistema.</Text>
                        </View>
                        <ThemePreview />
                        <MatteCard radius={26} style={styles.card} baseColor={theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.92)"}>
                            <View style={styles.themeRow}>
                                <TouchableOpacity onPress={() => setDarkMode('dark')} style={[styles.themeBtn, darkMode === 'dark' && styles.themeBtnActive, theme.isDark && { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                    <Moon size={16} color={darkMode === 'dark' ? (theme.isDark ? "#fff" : "#000") : "rgba(128,128,128,0.5)"} />
                                    <Text style={[styles.themeLabel, darkMode === 'dark' && { fontWeight: '900' }, theme.isDark && { color: '#fff' }]}>Oscuro</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setDarkMode('light')} style={[styles.themeBtn, darkMode === 'light' && styles.themeBtnActive, theme.isDark && { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                    <Sun size={16} color={darkMode === 'light' ? (theme.isDark ? "#fff" : "#000") : "rgba(128,128,128,0.5)"} />
                                    <Text style={[styles.themeLabel, darkMode === 'light' && { fontWeight: '900' }, theme.isDark && { color: '#fff' }]}>Claro</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setDarkMode('auto')} style={[styles.themeBtn, darkMode === 'auto' && styles.themeBtnActive, theme.isDark && { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                    <Smartphone size={16} color={darkMode === 'auto' ? (theme.isDark ? "#fff" : "#000") : "rgba(128,128,128,0.5)"} />
                                    <Text style={[styles.themeLabel, darkMode === 'auto' && { fontWeight: '900' }, theme.isDark && { color: '#fff' }]}>Auto</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.colorRow}>
                                 {THEME_OPTIONS.map(opt => (
                                     <TouchableOpacity 
                                        key={opt.id} 
                                        onPress={() => setTheme(opt.id as any)} 
                                        style={[
                                            styles.colorDot, 
                                            { backgroundColor: opt.color }, 
                                            themeId === opt.id && { borderWidth: 3, borderColor: theme.isDark ? '#fff' : '#111', transform: [{ scale: 1.15 }] }
                                        ]} 
                                     />
                                 ))}
                            </View>
                            <TouchableOpacity style={[styles.primaryButton, theme.isDark && { backgroundColor: '#fff' }]} onPress={handleNext} disabled={loading}><Text style={[styles.primaryText, theme.isDark && { color: '#000' }]}>Refinar Detalles</Text></TouchableOpacity>
                        </MatteCard>
                    </>
                )}

                {/* STEP 6: PERMISSIONS */}
                {step === 6 && (
                    <>
                        <View style={styles.titleSection}>
                            <Text style={[styles.title, theme.isDark && { color: '#fff' }]}>Conecta tu Hub</Text>
                            <Text style={[styles.subtitle, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>Habilita las notificaciones para sincronización y Oracle AI.</Text>
                        </View>
                        <MatteCard radius={26} style={styles.card} baseColor={theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.92)"}>
                            <View style={styles.permsContent}>
                                <MotiView 
                                    from={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    style={[styles.permsIconCircle, { backgroundColor: theme.primary + '20' }]}
                                >
                                    <Bell size={48} color={theme.primary} />
                                </MotiView>
                                <Text style={[styles.permsTitle, theme.isDark && { color: '#fff' }]}>Ecosistema Cortex</Text>
                                <Text style={[styles.permsDesc, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>
                                    Necesitamos tu permiso para enviarte recordatorios de tareas, metas de promedio y actualizaciones de sincronización.
                                </Text>
                            </View>
                            <TouchableOpacity 
                                style={[styles.primaryButton, theme.isDark && { backgroundColor: '#fff' }]} 
                                onPress={async () => {
                                    const granted = await NotificationService.requestPermissions();
                                    setHasPermissions(granted);
                                    if (granted) handleNext();
                                    else handleNext(); // Continuar aunque no acepte, pero ya se le pidió
                                }}
                            >
                                <Text style={[styles.primaryText, theme.isDark && { color: '#000' }]}>Activar Notificaciones</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleNext()} style={styles.skipBtn}>
                                <Text style={[styles.skipText, { color: theme.textMuted }]}>Configurar después en Ajustes</Text>
                            </TouchableOpacity>
                        </MatteCard>
                    </>
                )}

                {/* STEP 7: TERMS */}
                {step === 7 && (
                    <>
                        {!isTermsExpanded && (
                            <View style={styles.titleSection}>
                                <Text style={[styles.title, theme.isDark && { color: '#fff' }]}>Casi terminamos</Text>
                                <Text style={[styles.subtitle, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>Corty está inyectando tus datos en el núcleo.</Text>
                            </View>
                        )}
                        <MatteCard radius={26} style={[styles.card, isTermsExpanded && styles.cardExpanded, theme.isDark && { backgroundColor: 'rgba(255,255,255,0.08)' }]} baseColor={theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.92)"}>
                            <View style={[styles.termsBox, isTermsExpanded && styles.termsBoxExpanded, theme.isDark && { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                <View style={styles.termsHeader}>
                                    <Text style={[styles.termsBadge, theme.isDark && { color: 'rgba(255,255,255,0.3)' }]}>Acuerdo Legal 2026</Text>
                                    <TouchableOpacity onPress={() => setIsTermsExpanded(!isTermsExpanded)} style={styles.expandIcon}>
                                        {isTermsExpanded ? <Minimize2 size={16} color={theme.isDark ? "#fff" : "#111"} /> : <Maximize2 size={16} color={theme.isDark ? "#fff" : "#111"} />}
                                    </TouchableOpacity>
                                </View>
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                                    <Text style={[styles.termsText, theme.isDark && { color: 'rgba(255,255,255,0.4)' }]}>{TERMS_AND_CONDITIONS}</Text>
                                </ScrollView>
                            </View>
                            {!isTermsExpanded && (
                                <>
                                    <TouchableOpacity onPress={() => setAcceptedTerms(!acceptedTerms)} style={styles.acceptRow}>
                                        <View style={[styles.checkbox, theme.isDark && { borderColor: 'rgba(255,255,255,0.1)' }, acceptedTerms && { backgroundColor: theme.isDark ? '#fff' : '#111', borderColor: theme.isDark ? '#fff' : '#111' }]}>{acceptedTerms && <Check size={12} color={theme.isDark ? "#000" : "white"} />}</View>
                                        <Text style={[styles.acceptLabel, theme.isDark && { color: 'rgba(255,255,255,0.5)' }]}>Acepto los Términos y Condiciones</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.primaryButton, !acceptedTerms && styles.disabledBtn, theme.isDark && { backgroundColor: '#fff' }]} onPress={handleNext} disabled={!acceptedTerms || loading}>
                                        {loading ? <ActivityIndicator color={theme.isDark ? "black" : "white"} /> : <Text style={[styles.primaryText, theme.isDark && { color: '#000' }]}>Iniciar Sistema</Text>}
                                    </TouchableOpacity>
                                </>
                            )}
                        </MatteCard>
                    </>
                )}
              </MotiView>
            </AnimatePresence>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F4F0' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 60, alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, height: 60, marginTop: Platform.OS === 'ios' ? 10 : 35 },
  backBtnWrapper: { padding: 8, borderRadius: 12 },
  logoBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center', marginLeft: -40 },
  miniLogo: { padding: 4 },
  logoText: { fontSize: 10, fontWeight: '800', color: '#111', letterSpacing: 0.5 },
  headerRight: { width: 40, alignItems: 'flex-end' },
  stepIndicator: { fontSize: 10, fontWeight: '900', color: 'rgba(0,0,0,0.3)', letterSpacing: 0.5 },
  mascotContainer: { alignItems: 'center', marginVertical: 10 },
  stepWrapper: { width: '100%', gap: 20 },
  titleSection: { gap: 6, alignItems: 'center', marginBottom: 5 },
  title: { fontSize: 24, fontWeight: '900', color: '#111', letterSpacing: -0.8, textAlign: 'center' },
  subtitle: { fontSize: 13, color: 'rgba(0,0,0,0.5)', fontWeight: '500', lineHeight: 20, textAlign: 'center' },
  card: { width: '100%', padding: 24, gap: 18, elevation: 0, shadowOpacity: 0, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  cardExpanded: { marginTop: -80, height: height * 0.82 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 11, color: 'rgba(0,0,0,0.5)', fontWeight: '700', textTransform: 'uppercase' },
  inputRow: { flexDirection: 'row', alignItems: 'center', height: 48, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  input: { flex: 1, fontSize: 14, color: '#111', fontWeight: '600' },
  magicBtn: { padding: 8 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F59E0B10', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F59E0B20' },
  errorText: { fontSize: 12, color: '#D97706', fontWeight: '600', flex: 1 },
  uniResult: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', padding: 12, borderRadius: 18, gap: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  uniLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  logoImg: { width: '100%', height: '100%' },
  uniName: { fontSize: 14, fontWeight: '800', color: '#111' },
  domainRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  uniLink: { fontSize: 11, color: 'rgba(0,0,0,0.4)', fontWeight: '600' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { height: 48, backgroundColor: '#111', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  disabledBtn: { opacity: 0.5 },
  primaryText: { color: '#fff', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  semesterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  semBtn: { width: (width - 120) / 5, height: 40, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  semText: { fontSize: 13, fontWeight: '700', color: 'rgba(0,0,0,0.4)' },
  gradeBox: { alignItems: 'center', gap: 12 },
  gradeValue: { fontSize: 72, fontWeight: '900' },
  gradeGrid: { flexDirection: 'row', gap: 6, width: '100%' },
  gBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' },
  gText: { fontSize: 13, fontWeight: '800', color: '#111' },
  personalityStack: { gap: 12 },
  pCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', backgroundColor: '#fff', gap: 16 },
  pIcon: { fontSize: 24 },
  pName: { fontSize: 15, fontWeight: '800', color: '#111' },
  pDesc: { fontSize: 12, color: 'rgba(0,0,0,0.4)', fontWeight: '500' },
  themeRow: { flexDirection: 'row', gap: 8, width: '100%', backgroundColor: 'rgba(0,0,0,0.03)', padding: 6, borderRadius: 16 },
  themeBtn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  themeBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  themeLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: '#111' },
  colorRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10 },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 3, borderColor: 'transparent' },
  termsBox: { height: 200, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 18, padding: 16 },
  termsBoxExpanded: { height: height * 0.68 },
  termsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  termsBadge: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', flex: 1 },
  expandIcon: { padding: 4 },
  termsText: { fontSize: 11, color: 'rgba(0,0,0,0.4)', lineHeight: 18 },
  acceptRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  acceptLabel: { fontSize: 12, color: 'rgba(0,0,0,0.6)', fontWeight: '600' },
  previewContainer: { width: '100%', marginBottom: 10 },
  previewCard: { padding: 16, elevation: 0, shadowOpacity: 0, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  avatarMini: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  previewUser: { fontSize: 13, fontWeight: '800' },
  previewMeta: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  previewStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  statFill: { height: '100%', borderRadius: 3 },
  permsContent: {
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
    width: '100%',
  },
  permsIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  permsTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  permsDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.7,
    paddingHorizontal: 10,
  },
  skipBtn: {
    padding: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.6,
  },
});
