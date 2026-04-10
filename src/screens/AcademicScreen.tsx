import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  TrendingUp, 
  Award, 
  Target, 
  ChevronRight, 
  Sparkles,
  ArrowLeft,
  GraduationCap,
  Plus,
  Zap
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { Spacing, Radius, Shadows } from '../constants/theme';
import CleanBackground from '../components/CleanBackground';
import { useData, resolveColor } from '../context/DataContext';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';
import { generateContextAwareText } from '../services/gemini';
import * as AcademicEngine from '../services/AcademicEngine';
import { MatteCard } from '../components/design-system/CortexMatte';
import CortySpeechBubble from '../components/CortySpeechBubble';
import { auth, db } from '../services/firebase';
import { doc, setDoc } from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');

export default function AcademicScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { isTablet, isLaptop } = useResponsive();
  const isWide = isTablet || isLaptop;
  const { courses, userProfile, addCourse } = useData();
  const styles = getStyles(theme, isWide);

  const [aiInsight, setAiInsight] = useState('Toca el icono para obtener un insight de Cortex IA.');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [simulatedAverages, setSimulatedAverages] = useState<{[key: string]: number}>({});
  const [showCortyHint, setShowCortyHint] = useState(false);
 
  useEffect(() => {
    const timer = setTimeout(() => setShowCortyHint(true), 1500);
    const hideTimer = setTimeout(() => setShowCortyHint(false), 12000); // 12 segundos para lectura cómoda
    return () => { clearTimeout(timer); clearTimeout(hideTimer); };
  }, []);

  const fetchAiInsight = async () => {
    if (courses.length === 0 || isAiLoading) return;
    
    setIsAiLoading(true);
    setAiInsight('Cortex está analizando tus registros...');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const prompt = "Genera un insight MUY BREVE (máximo 2 líneas cortas) sobre mi promedio general actual y destaca una materia donde voy excelente o una donde deba prestar atención urgentemente. Sé directo.";
      const result = await generateContextAwareText(prompt, { user: userProfile as any, courses, tasks: [], activeTab: 'Academic' });
      setAiInsight(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setAiInsight('Error al conectar con la red neuronal. Inténtalo de nuevo.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const semesters = Array.from(new Set(courses.map(c => c.semester || 1))).sort((a: any, b: any) => a - b);
  if (semesters.length === 0) semesters.push(1);
  const [selectedSemester, setSelectedSemester] = useState(semesters[semesters.length - 1]);

  useEffect(() => {
    if (!semesters.includes(selectedSemester)) {
      setSelectedSemester(semesters[semesters.length - 1] || 1);
    }
  }, [courses]);

  const filteredCourses = courses.filter(c => (c.semester || 1) === selectedSemester);

  // --- Proactive Data Sync (CortexCore 3.1) ---
  useEffect(() => {
    if (courses.length > 0) {
      let needsUpdate = false;
      const updatedCourses = courses.map(c => {
        const realGPA = AcademicEngine.calculateCourseGPA(c.cuts).toFixed(2);
        const realProgress = Math.round(AcademicEngine.calculateCourseProgress(c.cuts));
        // Solo actualizar si el cambio es significativo para evitar ciclos infinitos o jitters
        if (Math.abs(parseFloat(c.average) - parseFloat(realGPA)) > 0.01 || c.progress !== realProgress) {
          needsUpdate = true;
          return { ...c, average: realGPA, progress: realProgress };
        }
        return c;
      });

      if (needsUpdate && auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), { courses: updatedCourses }, { merge: true });
      }
    }
  }, [courses]); // Cambiar courses.length por courses para detectar cambios internos

  // Simulation Logic
  const getSimulatedScore = () => {
    const coursesToCalc = filteredCourses.map(c => {
        // En modo simulación, si el usuario cambió el promedio de una materia, 
        // afectamos el cálculo de puntos semestrales.
        if (isSandboxMode && simulatedAverages[c.id] !== undefined) {
             // Recreamos los cortes ficticiamente para la simulación de puntos si es necesario,
             // o usamos una aproximación proporcional.
             return { ...c, simulatedAvg: simulatedAverages[c.id] };
        }
        return c;
    });

    if (isSandboxMode) {
        // Cálculo aproximado para simulación: (Sum(SimAvg * Credits * (Weight/100)) / TotalCredits)
        // Por simplicidad en simulación, asumimos el progreso actual pero con la nueva nota.
        let totalPoints = 0;
        let totalCredits = 0;
        coursesToCalc.forEach((c: any) => {
            const progress = AcademicEngine.calculateCourseProgress(c.cuts);
            const avg = c.simulatedAvg || parseFloat(c.average);
            totalPoints += (avg * (progress / 100)) * (c.credits || 0);
            totalCredits += (c.credits || 0);
        });
        return totalCredits > 0 ? totalPoints / totalCredits : 0;
    }

    return AcademicEngine.calculateGlobalAccumulatedScore(filteredCourses);
  };

  const avgGradeNum = getSimulatedScore();
  const avgGrade = avgGradeNum.toFixed(2);
  const semesterProgress = filteredCourses.length > 0 ? Math.round(filteredCourses.reduce((acc, c) => acc + (c.progress || 0), 0) / filteredCourses.length) : 0;
  const totalCredits = filteredCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
  const target = userProfile?.targetGrade || 4.5;
  // El status lo seguimos basando en el GPA real para coherencia de color (Bueno/Malo)
  const realGPA = AcademicEngine.calculateGlobalWeightedGPA(filteredCourses);
  const status = AcademicEngine.getAcademicStatus(realGPA, target);

  const getStatusColor = (val: number) => {
    const max = userProfile?.maxGrade || 5.0;
    const ratio = val / max;
    if (val < 3.0) return theme.error;
    if (val < 4.0) return '#F59E0B';
    return '#10B981';
  };

  const handleAddCourse = async () => {
    if (!auth.currentUser) return;
    const prefs = userProfile?.preferences || {};
    const defaultCuts = [
      { id: Date.now() + 1, name: 'Corte 1', weight: prefs.cut1Weight || 30, grade: '0.0', activities: [], method: 'basic' },
      { id: Date.now() + 2, name: 'Corte 2', weight: prefs.cut2Weight || 30, grade: '0.0', activities: [], method: 'basic' },
      { id: Date.now() + 3, name: 'Corte 3', weight: prefs.cut3Weight || 40, grade: '0.0', activities: [], method: 'basic' },
    ];
    
    const newCourse = {
      id: Date.now().toString(),
      name: 'Nueva Materia',
      code: 'MT-00',
      professor: 'Profesor X',
      credits: 3,
      semester: selectedSemester,
      color: theme.primary,
      average: '0.00',
      progress: 0,
      cuts: defaultCuts,
      activities: [],
      resources: [],
      schedule: { day: 'Lunes', time: '08:00 - 10:00' }
    };
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addCourse(newCourse);
    // Navigate straight to detail so they can edit the name and cuts
    navigation.navigate('CourseDetail', { courseId: newCourse.id });
  };

  return (
    <CleanBackground>
      <MotiView 
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity 
          onPress={() => {
            if (navigation.canGoBack()) {
                navigation.goBack();
            }
          }}
          style={styles.backBtn}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Académico</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <TrendingUp size={24} color={theme.primary} />
        </TouchableOpacity>
      </MotiView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- GLOBAL GPA CARD --- */}
        <View style={styles.maxWidthWrapper}>
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 200 }}
            style={styles.gpaCard}
          >
            <View style={[StyleSheet.absoluteFill, styles.glassBase, { borderRadius: 35 }]} />
            <View style={[StyleSheet.absoluteFill, { borderRadius: 35, borderWidth: 2, borderColor: theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)' }]} />
            <LinearGradient
              colors={[status.color + '40', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 35 }]}
            />
            {/* Status Glow Aura */}
            <MotiView 
              animate={{ 
                opacity: status.label === 'SOBRESALIENTE' ? [0.05, 0.15, 0.05] : 0,
                scale: status.label === 'SOBRESALIENTE' ? [1, 1.02, 1] : 1
              }}
              transition={{ duration: 4000, loop: true, type: 'timing' }}
              style={[StyleSheet.absoluteFill, { backgroundColor: status.color, borderRadius: 35, opacity: 0.1 }]}
            />

            <View style={styles.gpaInfo}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.gpaLabel}>PROMEDIO PARCIAL</Text>
                  <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.icon} {status.label}</Text>
                  </View>
                </View>
                <Text style={styles.gpaValue}>{realGPA.toFixed(2)}</Text>
              </View>
              <View style={styles.creditsBadge}>
                <GraduationCap size={16} color={theme.isDark ? theme.primary : theme.textContrast} />
                <Text style={styles.creditsText}>{totalCredits} Créditos</Text>
              </View>
            </View>

            <View style={styles.gpaFooter}>
              <View style={styles.progressTrack}>
                 <View style={[styles.progressIndicator, { width: `${(avgGradeNum / (userProfile?.maxGrade || 5)) * 100}%`, backgroundColor: status.color }]} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.targetText}>PROMEDIO GLOBAL: {avgGrade}</Text>
                  
                  <TouchableOpacity 
                      onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setIsSandboxMode(!isSandboxMode);
                      }}
                      style={[styles.sandboxToggle, isSandboxMode && { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                  >
                      <Zap size={12} color={isSandboxMode ? theme.primary : theme.textMuted} />
                      <Text style={[styles.sandboxText, { color: isSandboxMode ? theme.primary : theme.textMuted }]}>
                          {isSandboxMode ? 'MODO SIMULACIÓN' : 'SIMULAR PROMEDIO'}
                      </Text>
                  </TouchableOpacity>

                  <Text style={styles.targetText}>Meta: {target}</Text>
              </View>
            </View>
          </MotiView>
          {showCortyHint && (
            <CortySpeechBubble 
               visible={showCortyHint} 
               message="¡Hola! Tu PROMEDIO PARCIAL es tu nota real ponderada actual, mientras que tu PROMEDIO GLOBAL es cuánto llevas acumulado del 5.0 total del semestre. 🧠📚" 
            />
          )}
        </View>

        {/* --- AI INSIGHT SECTION --- */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={fetchAiInsight}
          style={[styles.aiInsight, styles.maxWidthWrapper]}
        >
          <View style={[StyleSheet.absoluteFill, styles.glassBase, { borderRadius: 25 }]} />
          <MotiView 
            animate={{ 
              scale: isAiLoading ? [1, 1.2, 1] : 1,
              rotate: isAiLoading ? ['0deg', '180deg', '360deg'] : '0deg'
            }}
            transition={{ loop: true, type: 'timing', duration: 1500 }}
            style={styles.aiIconWrapper}
          >
            <Sparkles size={18} color={theme.primary} />
          </MotiView>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiTitle}>Cortex IA Insight</Text>
            <Text style={styles.aiText}>{aiInsight}</Text>
          </View>
        </TouchableOpacity>


        {/* --- SEMESTERS NAVIGATION --- */}
        <View style={styles.maxWidthWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 0, gap: 10, marginTop: 10, marginBottom: 5 }}
          >
            {semesters.map((sem, i) => (
               <MotiView 
                 key={sem}
                 from={{ opacity: 0, translateX: 20 }}
                 animate={{ opacity: 1, translateX: 0 }}
                 transition={{ delay: 300 + i * 50 }}
               >
                 <TouchableOpacity 
                   style={[styles.semPill, selectedSemester === sem && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                   onPress={() => {
                     Haptics.selectionAsync();
                     setSelectedSemester(sem as number);
                   }}
                 >
                   <Text style={[styles.semText, selectedSemester === sem && { color: '#fff' }]}>Semestre {sem}</Text>
                 </TouchableOpacity>
               </MotiView>
            ))}
            <TouchableOpacity 
               style={[styles.semPill, { borderStyle: 'dashed' }]}
               onPress={() => {
                  Haptics.selectionAsync();
                  const nextSem = (semesters[semesters.length - 1] as number) + 1;
                  setSelectedSemester(nextSem);
               }}
            >
               <Plus size={16} color={theme.textSecondary} />
               <Text style={styles.semText}>Nuevo Semestre</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* --- COURSE LIST --- */}
        <Text style={[styles.sectionTitle, styles.maxWidthWrapper]}>Desglose por Materia</Text>
        <View style={styles.coursesGrid}>
          {filteredCourses.map((course: any, i: number) => (
            <MotiView
              key={course.id}
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 400 + i * 100 }}
              style={styles.gridItem}
            >
            <MatteCard 
                onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
                style={[styles.courseCard, isSandboxMode && { paddingBottom: 20 }]}
                radius={25}
            >
                <View style={[styles.courseColorBar, { backgroundColor: resolveColor(course.color) }]} />

                {!isSandboxMode ? (
                  // --- CLASSIC DESIGN (MODO CONSULTA) ---
                  <View style={styles.courseMain}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.courseNameTop}>{course.name}</Text>
                        <Text style={styles.courseCredits}>{course.professor || 'Por asignar'}</Text>
                      </View>
                      <View style={styles.avgWrapper}>
                        <Text style={[styles.courseAvg, { color: resolveColor(course.color) }]}>
                          {AcademicEngine.calculateAccumulatedScore(course.cuts).toFixed(2)}
                        </Text>
                        <ChevronRight size={16} color={theme.textMuted} />
                      </View>
                  </View>
                ) : (
                  // --- ADVANCED DESIGN (MODO SIMULACIÓN) ---
                  <View style={{ flex: 1 }}>
                       <View style={styles.courseHeaderRow}>
                            <View style={{ flex: 1 }}>
                               <Text style={styles.courseNameTop}>{course.name}</Text>
                               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.8, marginTop: 4 }}>
                                   <Text style={styles.courseCredits}>{course.credits} Créditos</Text>
                                   <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.textMuted }} />
                                   <Text style={[styles.accumulatedLabel, { color: theme.primary, fontWeight: '700' }]}>
                                      PROMEDIO GLOBAL: {AcademicEngine.calculateAccumulatedScore(course.cuts).toFixed(2)} / 5.0
                                   </Text>
                                   <Text style={[styles.courseCredits, { color: theme.primary, fontWeight: '800' }]}>
                                       Impacto: {((course.credits / (totalCredits || 1)) * 100).toFixed(1)}%
                                   </Text>
                               </View>
                            </View>

                            <View style={[styles.courseGradeBox, { minWidth: 60, alignItems: 'flex-end', marginLeft: 10 }]}>
                               <Text style={[styles.courseAvg, { color: getStatusColor(simulatedAverages[course.id] ?? parseFloat(course.average)), fontSize: 26 }]}>
                                   {simulatedAverages[course.id] !== undefined 
                                       ? simulatedAverages[course.id].toFixed(1) 
                                       : parseFloat(course.average).toFixed(1)}
                               </Text>
                               {simulatedAverages[course.id] !== undefined && (
                                   <Text style={{ fontSize: 8, fontWeight: '900', color: theme.primary, position: 'absolute', top: -12, right: 0 }}>SIMULADO</Text>
                               )}
                            </View>
                       </View>

                       {/* REUBICADOS ABAJO (Fuera de la fila de cabecera pero alineados a la izq) */}
                       <View style={[styles.simulationControls, { marginTop: 15, justifyContent: 'flex-start', gap: 12 }]}>
                           <TouchableOpacity 
                               onPress={() => {
                                   const current = simulatedAverages[course.id] ?? parseFloat(course.average);
                                   setSimulatedAverages({...simulatedAverages, [course.id]: Math.max(0, current - 0.1)});
                                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                               }}
                               style={[styles.simBtn, { width: 32, height: 32 }]}
                           >
                               <Text style={[styles.simBtnText, { fontSize: 18 }]}>-</Text>
                           </TouchableOpacity>
                           
                           <View style={[styles.simSliderBg, { width: '60%', minWidth: 100, height: 6 }]}>
                               <View style={[styles.simSliderFill, { 
                                   width: `${((simulatedAverages[course.id] ?? parseFloat(course.average)) / (userProfile?.maxGrade || 5)) * 100}%`,
                                   backgroundColor: getStatusColor(simulatedAverages[course.id] ?? parseFloat(course.average))
                                 }]} />
                           </View>

                           <TouchableOpacity 
                               onPress={() => {
                                   const current = simulatedAverages[course.id] ?? parseFloat(course.average);
                                   setSimulatedAverages({...simulatedAverages, [course.id]: Math.min(userProfile?.maxGrade || 5, current + 0.1)});
                                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                               }}
                               style={[styles.simBtn, { width: 32, height: 32 }]}
                           >
                               <Text style={[styles.simBtnText, { fontSize: 18 }]}>+</Text>
                           </TouchableOpacity>
                       </View>
                  </View>
                )}

                {/* --- PROGRESS BAR ANIMATION (Solo en modo consulta para evitar ruido visual) --- */}
                {!isSandboxMode && (
                  <View style={styles.cardProgressContainer}>
                      <View style={styles.cardProgressBarTrack}>
                          <MotiView 
                            from={{ width: '0%' }}
                            animate={{ width: `${course.progress || 0}%` }}
                            transition={{ type: 'timing', duration: 1500, delay: 600 + i * 100 }}
                            style={[styles.cardProgressBarIndicator, { backgroundColor: getStatusColor(parseFloat(course.average)) }]}
                          />
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                          <View style={styles.lastCutInfo}>
                              <Text style={styles.progLabel}>PROGRESO: {course.progress}%  •  PROMEDIO GLOBAL: {AcademicEngine.calculateCourseGlobalScore(course).toFixed(2)}</Text>
                              {(() => {
                                const lastGratdedCut = [...course.cuts].reverse().find(c => parseFloat(c.grade) > 0);
                                if (!lastGratdedCut) return null;
                                return (
                                  <Text style={styles.lastCutLabel}> • {lastGratdedCut.name}: {lastGratdedCut.grade}</Text>
                                );
                              })()}
                          </View>
                      </View>
                  </View>
                )}

                {!isSandboxMode && (
                  <View style={styles.cutsContainer}>
                    {course.cuts.map((cut: any, idx: number) => (
                      <React.Fragment key={cut.id}>
                        <View style={styles.cutItem}>
                          <Text style={styles.cutName}>{cut.name.split(' ')[1] || cut.name}</Text>
                          <Text style={[styles.cutGrade, { color: parseFloat(cut.grade) >= 3.0 ? theme.primary : theme.textMuted }]}>
                            {parseFloat(cut.grade) > 0 ? cut.grade : '--'}
                          </Text>
                        </View>
                        {idx < course.cuts.length - 1 && <View style={styles.cutDivider} />}
                      </React.Fragment>
                    ))}
                  </View>
                )}

            </MatteCard>
          </MotiView>
        ))}
      </View>

      <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 800 }}
            style={styles.maxWidthWrapper}
        >
           <TouchableOpacity style={styles.addCourseBtn} onPress={handleAddCourse}>
              <Plus size={20} color={theme.text} />
              <Text style={styles.addCourseText}>Agregar Materia al Semestre {selectedSemester}</Text>
           </TouchableOpacity>
        </MotiView>

        <View style={{ height: 100 }} />
      </ScrollView>
    </CleanBackground>
  );
}

const getStyles = (theme: any, isWide: boolean = false) => StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: 60,
    paddingBottom: 100,
    gap: Spacing.xl,
    alignItems: 'center', // Center content on wide screens
  },
  maxWidthWrapper: {
      width: '100%',
      maxWidth: 1200,
      position: 'relative',
      zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  coursesGrid: {
    flexDirection: isWide ? 'row' : 'column',
    flexWrap: isWide ? 'wrap' : 'nowrap',
    width: '100%',
    maxWidth: 1200,
    gap: Spacing.lg,
    justifyContent: isWide ? 'flex-start' : 'center',
  },
  gridItem: {
    width: isWide ? '48%' : '100%', // 2 columns on tablet
    marginBottom: isWide ? 0 : 0,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -0.5,
  },
  headerIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassBase: {
    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.75)',
  },
  gpaCard: {
    padding: 24,
    borderRadius: 35,
    ...Shadows.lg,
  },
  gpaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  gpaLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  gpaValue: {
    fontSize: 48,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -2,
    marginTop: -5,
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : theme.text,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  creditsText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.isDark ? theme.text : theme.textContrast,
  },
  gpaFooter: {
    gap: 10,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    borderRadius: 4,
  },
  targetText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
    textAlign: 'right',
  },
  aiInsight: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 25,
    gap: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  aiIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.primary,
    marginBottom: 2,
  },
  aiText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -0.5,
    marginTop: 10,
  },
  courseCard: {
    borderRadius: 25,
    overflow: 'hidden',
    padding: 16,
    paddingLeft: 22,
    ...Shadows.sm,
  },
  courseColorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  courseMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  courseProfessor: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  avgWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseAvg: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.text,
  },
  cutsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    borderRadius: 15,
    padding: 10,
  },
  cutItem: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  cutName: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.textSecondary,
  },
  lastCutLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  progLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.textSecondary,
    letterSpacing: 0.5,
  },
  accumulatedLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cutGrade: {
    fontSize: 13,
    fontWeight: '900',
  },
  cutDivider: {
    width: 1,
    height: 15,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 5,
  },
  semPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  },
  semText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.textSecondary,
  },
  addCourseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.15)',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.2)',
    gap: 10,
    marginTop: 10,
  },
  addCourseText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
  },
  sandboxToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1.2,
    borderColor: 'transparent',
  },
  sandboxText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  courseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseGradeBox: {
    alignItems: 'flex-end',
    minWidth: 50,
  },
  courseCredits: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '600',
  },
  courseNameTop: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  simulationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 15,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 8,
    borderRadius: 15,
  },
  simBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.isDark ? '#333' : '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
  },
  simBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.primary,
    marginTop: -2,
  },
  simSliderBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  simSliderFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardProgressContainer: {
    paddingHorizontal: 0,
    marginTop: -5,
    marginBottom: 10,
  },
  cardProgressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  cardProgressBarIndicator: {
    height: '100%',
    borderRadius: 2,
  },
  lastCutInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)',
    paddingVertical: 4,
    borderRadius: 8,
  },
  lastCutValue: {
    fontSize: 10,
    fontWeight: '900',
  },
});
