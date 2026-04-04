import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Link,
  Calendar,
  Brain,
  X,
  Database,
  Info,
  Trash2,
  Edit3,
  Palette,
  Clock
} from 'lucide-react-native';
import { auth, db } from '../services/firebase';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, Radius } from '../constants/theme';
import { Course } from '../types';
import CleanBackground from '../components/CleanBackground';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { MatteCard, MatteUnderlay, MatteIconButton } from '../components/design-system/CortexMatte';
import * as AcademicEngine from '../services/AcademicEngine';

interface Props {
  route: { params: { courseId: number | Course } };
  navigation: any;
}

// ─── Marquee: auto-scrolls horizontally when text > container ───
function MarqueeText({ text, style }: { text: string; style: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [containerW, setContainerW] = useState(0);
  const [textW, setTextW] = useState(0);

  useEffect(() => {
    if (textW > 0 && containerW > 0 && textW > containerW) {
      const dist = textW - containerW + 16;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(1200),
          Animated.timing(anim, { toValue: -dist, duration: dist * 28, useNativeDriver: true }),
          Animated.delay(800),
          Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [textW, containerW]);

  return (
    <View
      style={{ overflow: 'hidden' }}
      onLayout={e => setContainerW(e.nativeEvent.layout.width)}
    >
      {/* Hidden ghost — measures real text width without clipping */}
      <Text
        style={[style, { position: 'absolute', opacity: 0, width: 9999 }]}
        numberOfLines={1}
        onLayout={e => setTextW(e.nativeEvent.layout.width)}
      >
        {text}
      </Text>
      <Animated.Text
        style={[style, { transform: [{ translateX: anim }] }]}
        numberOfLines={1}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

const AI_STRATEGY = `Estrategia IA para esta materia

Basado en tus calificaciones actuales, este es tu plan personalizado:

Puntos fuertes: Tienes buen rendimiento en las actividades practicas.

Areas de mejora: Enfocate en el componente teorico del Corte 3.

Plan de estudio recomendado:
- Dedica 2 horas diarias esta semana
- Usa la tecnica Pomodoro (25 min estudio / 5 min descanso)
- Revisa los apuntes de clase antes del examen
- Practica con ejercicios anteriores

Proyeccion: Con este ritmo puedes cerrar el semestre con un 4.5.

Quieres que te genere un plan de estudio detallado para los proximos dias?`;


export default function CourseDetailScreen({ route, navigation }: Props) {
  const { courseId } = route.params;
  const { theme } = useTheme();
  const { 
    courses, 
    updateCourse, 
    scheduleBlocks, 
    addScheduleBlock, 
    deleteScheduleBlock, 
    batchUpdateScheduleBySubject 
  } = useData();
  const styles = getStyles(theme);

  const course = typeof courseId === 'object' ? courseId : courses.find((c: any) => c.id === courseId);

  const insets = useSafeAreaInsets();
  const [expandedCuts, setExpandedCuts] = useState<number[]>([]);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [editingGrade, setEditingGrade] = useState<{ cutId: number, actId?: number | null, name: string, weight: string, grade: string } | null>(null);
  
  const [cutModalVisible, setCutModalVisible] = useState(false);
  const [editingCut, setEditingCut] = useState<{ id?: number, name: string, weight: string, method?: 'basic' | 'detailed', grade?: string } | null>(null);

  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<{ name: string, code: string, professor: string, credits: string, color: string } | null>(null);
  

  const [editingSchedule, setEditingSchedule] = useState<any[]>([]);
  const [newBlock, setNewBlock] = useState({ day: 'Lunes', startTime: '08:00', endTime: '10:00' });

  useEffect(() => {
    if (course) {
      const realGPA = AcademicEngine.calculateCourseGPA(course.cuts).toFixed(2);
      const realProgress = Math.round(AcademicEngine.calculateCourseProgress(course.cuts));
      
      if (course.average !== realGPA || course.progress !== realProgress) {
        // Auto-fix stale data silently
        updateCourse({
          ...course,
          average: realGPA,
          progress: realProgress
        });
      }
    }
  }, [course?.id]);

  const toggleCut = (cutId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCuts(prev =>
      prev.includes(cutId) ? prev.filter(id => id !== cutId) : [...prev, cutId]
    );
  };

  const recalcCourse = (updatedCourse: any) => {
    updatedCourse.cuts.forEach((cut: any) => {
        if (!cut.method || cut.method === 'detailed') {
            cut.grade = AcademicEngine.calculateCutGrade(cut.activities).toFixed(2);
        }
        // If basic, we don't overwrite cut.grade as it's manual
    });
     
    // NEW: Real normalized performance
    updatedCourse.average = AcademicEngine.calculateCourseGPA(updatedCourse.cuts).toFixed(2);
    
    // NEW: Real semester/course progress based on graded activities
    updatedCourse.progress = Math.round(AcademicEngine.calculateCourseProgress(updatedCourse.cuts));
    
    updateCourse(updatedCourse);
  };

  const saveGrade = () => {
    if (!editingGrade || !course) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updatedCourse = JSON.parse(JSON.stringify(course));
    const cut = updatedCourse.cuts.find((c: any) => c.id === editingGrade.cutId);
    if (!cut) return;

    if (editingGrade.actId) {
      // Edit
      const actIndex = cut.activities.findIndex((a: any) => a.id === editingGrade.actId);
      if (actIndex > -1) {
        cut.activities[actIndex] = {
           ...cut.activities[actIndex],
           name: editingGrade.name,
           weight: parseFloat(editingGrade.weight) || 0,
           grade: parseFloat(editingGrade.grade).toFixed(1) || '0.0',
        };
      }
    } else {
      // Add
      cut.activities = cut.activities || [];
      cut.activities.push({
        id: Date.now(),
        name: editingGrade.name || 'Nueva Actividad',
        weight: parseFloat(editingGrade.weight) || 0,
        grade: parseFloat(editingGrade.grade).toFixed(1) || '0.0',
      });
    }

    recalcCourse(updatedCourse);
    setGradeModalVisible(false);
  };

  const saveCut = () => {
    if (!editingCut || !course) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updatedCourse = JSON.parse(JSON.stringify(course));

    if (editingCut.id) {
       const idx = updatedCourse.cuts.findIndex((c: any) => c.id === editingCut.id);
       if (idx > -1) {
           const oldMethod = updatedCourse.cuts[idx].method || 'detailed';
           const newMethod = editingCut.method || 'basic';
           
           // TRANSITION LOGIC: Basic -> Detailed
           if (oldMethod === 'basic' && newMethod === 'detailed') {
               const baseGrade = parseFloat(updatedCourse.cuts[idx].grade) || 0;
               if (baseGrade > 0) {
                   updatedCourse.cuts[idx].activities = [{
                       id: Date.now(),
                       name: 'Nota Base (Anterior)',
                       weight: 100,
                       grade: baseGrade.toFixed(1)
                   }];
               }
           }

           updatedCourse.cuts[idx].name = editingCut.name;
           updatedCourse.cuts[idx].weight = parseFloat(editingCut.weight) || 0;
           updatedCourse.cuts[idx].method = newMethod;
           
           if (newMethod === 'basic') {
               updatedCourse.cuts[idx].grade = parseFloat(editingCut.grade || '0').toFixed(2);
               updatedCourse.cuts[idx].activities = []; // Clear activities in basic mode
           }
       }
    } else {
       updatedCourse.cuts = updatedCourse.cuts || [];
       const method = editingCut.method || 'basic';
       updatedCourse.cuts.push({
           id: Date.now(),
           name: editingCut.name || 'Nuevo Corte',
           weight: parseFloat(editingCut.weight) || 0,
           grade: method === 'basic' ? parseFloat(editingCut.grade || '0').toFixed(2) : '0.0',
           activities: [],
           method: method
       });
    }

    recalcCourse(updatedCourse);
    setCutModalVisible(false);
  };

  const saveCourseDetails = async () => {
    if (!editingCourse || !course) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const nameChanged = editingCourse.name !== course.name;
    const colorChanged = editingCourse.color !== course.color;

    // 1. Batch update existing blocks if name or color changed
    if (nameChanged || colorChanged) {
        await batchUpdateScheduleBySubject(course.name, editingCourse.name, editingCourse.color);
    }

    // 2. Handle schedule mutations (Additions/Deletions)
    // For simplicity, we compare local editingSchedule with the ones already in DataContext
    const currentCourseBlocks = scheduleBlocks.filter(b => b.subject === course.name);
    
    // Find blocks to delete
    for (const b of currentCourseBlocks) {
        if (!editingSchedule.find(eb => eb.id === b.id)) {
            await deleteScheduleBlock(b.id);
        }
    }

    // Find blocks to add (those without string IDs or new ones)
    for (const eb of editingSchedule) {
        if (typeof eb.id === 'number') { // Temporary numeric ID
            await addScheduleBlock({
                ...eb,
                id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                subject: editingCourse.name,
                color: editingCourse.color
            });
        }
    }

    const updatedCourse = {
        ...course,
        name: editingCourse.name || 'Sin Nombre',
        code: editingCourse.code || 'S/N',
        professor: editingCourse.professor || 'Sin Profesor',
        credits: parseInt(editingCourse.credits) || 0,
        color: editingCourse.color || theme.primary
    };
    
    updateCourse(updatedCourse);
    setCourseModalVisible(false);
  };

  const { userProfile } = useData();
  const uniColor = userProfile?.universityColor || theme.primary;

  const getStatusColor = (avg: number) => {
    if (avg >= (userProfile?.targetGrade || 4.0)) return '#10B981';
    if (avg >= 3.0) return '#F59E0B';
    return '#EF4444';
  };

  const deleteCut = () => {
    if (!editingCut?.id || !course) return;
    Alert.alert('Eliminar Corte', '¿Estás seguro que deseas eliminar todo este corte y sus notas?', [
       { text: 'Cancelar', style: 'cancel' },
       { text: 'Eliminar', style: 'destructive', onPress: () => {
           const updatedCourse = JSON.parse(JSON.stringify(course));
           updatedCourse.cuts = updatedCourse.cuts.filter((c: any) => c.id !== editingCut.id);
           recalcCourse(updatedCourse);
           setCutModalVisible(false);
       }}
    ]);
  };

  const deleteGrade = () => {
    if (!editingGrade?.actId || !course) return;
    Alert.alert('Eliminar Nota', '¿Estás seguro que deseas eliminar esta calificación? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
          const updatedCourse = JSON.parse(JSON.stringify(course));
          const cut = updatedCourse.cuts.find((c: any) => c.id === editingGrade.cutId);
          cut.activities = cut.activities.filter((a: any) => a.id !== editingGrade.actId);
          recalcCourse(updatedCourse);
          setGradeModalVisible(false);
      }}
    ]);
  };

  return (
    <CleanBackground>
      <View style={[styles.header, { paddingTop: insets.top + 15, paddingBottom: 15 }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: course.color }]} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.2)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerGlass} pointerEvents="none">
          <LinearGradient
            colors={['rgba(255,255,255,0.4)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.headerRim} />
        </View>
        
        <View style={styles.headerContent}>
          <MatteIconButton 
            icon={ChevronLeft}
            onPress={() => navigation.goBack()} 
            size={44} 
            radius={22}
            iconSize={20}
            iconColor="#FFF"
            style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
          />
          
          <View style={styles.headerTitles}>
            <Text style={styles.courseName} numberOfLines={1}>{course.name}</Text>
            <Text style={[styles.courseCode, { color: 'rgba(255,255,255,0.9)' }]}>
              {course.code} · {course.credits} Cr.
            </Text>
          </View>

          <MatteIconButton 
            icon={Edit3}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEditingCourse({ 
                name: course.name, 
                code: course.code, 
                professor: course.professor || '', 
                credits: String(course.credits), 
                color: course.color 
              });
              setEditingSchedule(scheduleBlocks.filter(b => b.subject === course.name));
              setCourseModalVisible(true);
            }} 
            size={44} 
            radius={22}
            iconSize={20}
            iconColor="#FFF"
            style={{ marginRight: 8, backgroundColor: 'rgba(255,255,255,0.25)' }}
          />

          <MatteIconButton
            icon={Brain}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setAiModalVisible(true);
            }}
            size={44}
            radius={22}
            iconSize={20}
            iconColor="#FFF"
            style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
          />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <MotiView
            from={{ opacity: 0, scale: 0.95, translateY: 10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            style={styles.averageCard}
          >
            <MatteUnderlay radius={Radius.xl} />

            <View style={{ alignItems: 'center' }}>
                <Text style={[styles.averageLabel, { color: theme.text, opacity: 0.6, letterSpacing: 1.5, fontSize: 9, marginBottom: 5 }]}>
                PROMEDIO PROPORCIONAL (RP)
                </Text>
                <Text
                style={[
                    styles.averageValue,
                    { color: course.color, textShadowColor: 'rgba(255,255,255,0.4)', textShadowRadius: 10 },
                ]}
                >
                {AcademicEngine.calculateCourseGPA(course.cuts).toFixed(2)}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -5 }}>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.primary, opacity: 0.5 }} />
                    <Text style={{ fontSize: 8, fontWeight: '800', color: theme.textMuted }}>METRICA DE RENDIMIENTO ACTUAL</Text>
                </View>
            </View>

            <View style={styles.progressContainer}>
                <View style={[styles.progressBg, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
                <MotiView
                    from={{ width: '0%' }}
                    animate={{ width: `${course.progress || 0}%` }}
                    transition={{ type: 'spring', delay: 500, damping: 20 }}
                    style={[styles.progressFill, { backgroundColor: course.color, minWidth: (course.progress || 0) > 0 ? 4 : 0 }]}
                />
                </View>
                <View style={{ gap: 4 }}>
                    <Text style={[styles.progressText, { color: theme.textSecondary, letterSpacing: 0.5, fontSize: 10, fontWeight: '800' }]}>
                        PROGRESO ACADEMICO: {course.progress || 0}%
                    </Text>
                    <Text style={{ fontSize: 9, color: theme.textMuted, fontStyle: 'italic', maxWidth: '90%' }}>
                        *Este promedio refleja las notas registradas hasta hoy y no corresponde al 100% del semestre.
                    </Text>
                </View>
            </View>
          </MotiView>

        {/* --- ORACLE INSIGHT SECTION --- */}
        <MotiView
           from={{ opacity: 0, translateY: 15 }}
           animate={{ opacity: 1, translateY: 0 }}
           transition={{ delay: 350 }}
        >
            <MatteCard radius={Radius.lg} style={styles.oracleCard}>
                <View style={[styles.oracleIcon, { backgroundColor: `${course.color}15` }]}>
                    <MotiView
                        animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.6, 1, 0.6],
                            shadowOpacity: [0.1, 0.4, 0.1]
                        }}
                        transition={{ duration: 2500, loop: true, type: 'timing' }}
                    >
                        <Brain size={18} color={course.color} />
                    </MotiView>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.oracleTitle, { color: course.color }]}>ORÁCULO ACADÉMICO</Text>
                    {(() => {
                        const target = userProfile?.targetGrade || 4.5;
                        const remainingWeight = 100 - (course.cuts.reduce((sum: number, c: any) => sum + (parseFloat(c.grade) > 0 ? c.weight : 0), 0));
                        const neededForMin = AcademicEngine.calculateOraclePrediction(3.0, course.cuts.filter((c:any) => parseFloat(c.grade) > 0), remainingWeight);
                        const neededForTarget = AcademicEngine.calculateOraclePrediction(target, course.cuts.filter((c:any) => parseFloat(c.grade) > 0), remainingWeight);
                        
                        if (remainingWeight <= 0) return <Text style={styles.oracleText}>Materia terminada. ¡Buen trabajo!</Text>;

                        const renderNeeded = (needed: number | null, label: string, accents: string) => {
                            if (needed === null) return null;
                            const maxGrade = userProfile?.maxGrade || 5.0;
                            const isImpossible = needed > maxGrade;
                            const isReached = needed <= 0;
                            
                            if (isImpossible) return <Text style={styles.oracleText}>Para {label}: <Text style={{ color: theme.error, fontWeight: '900' }}>Inalcanzable 🚨</Text></Text>;
                            if (isReached) return <Text style={styles.oracleText}>Para {label}: <Text style={{ color: '#10B981', fontWeight: '900' }}>Meta Asegurada ✅</Text></Text>;
                            
                            return (
                                <Text style={styles.oracleText}>
                                    Para <Text style={{ fontWeight: '800' }}>{label}</Text> necesitas un promedio de <Text style={{ color: accents, fontWeight: '900' }}>{needed.toFixed(2)}</Text> en lo que falta del semestre.
                                </Text>
                            );
                        };

                        return (
                            <View style={{ gap: 4, marginTop: 4 }}>
                                {renderNeeded(neededForMin, 'aprobar con 3.0', theme.primary)}
                                {renderNeeded(neededForTarget, `tu meta de ${target}`, theme.accent)}
                            </View>
                        );
                    })()}
                </View>
            </MatteCard>
        </MotiView>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Calificaciones</Text>
        {(course.cuts || []).map((cut: any, index: number) => (
          <MotiView
            key={cut.id}
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 + index * 100 }}
            style={styles.cutCard}
          >
            <MatteUnderlay
              radius={Radius.lg}
             
             
             
            />
            <TouchableOpacity 
               style={styles.cutHeader} 
               onPress={() => toggleCut(cut.id)} 
               onLongPress={() => {
                 Haptics.selectionAsync();
                 setEditingCut({ 
                   id: cut.id, 
                   name: cut.name, 
                   weight: String(cut.weight),
                   method: cut.method || 'detailed',
                   grade: cut.grade
                 });
                 setCutModalVisible(true);
               }}
               activeOpacity={0.7}
            >
              <View style={[styles.cutWeight, { backgroundColor: `${course.color}15` }]}>
                <Text style={[styles.cutWeightText, { color: course.color }]}>{cut.weight}%</Text>
              </View>
              <View style={styles.cutInfo}>
                <Text style={[styles.cutName, { color: theme.text }]}>{cut.name}</Text>
                <Text style={[styles.cutSubLabel, { color: theme.textMuted }]}>Peso en nota final</Text>
              </View>
              <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                <Text style={[styles.cutGrade, { color: course.color }]}>{cut.grade}</Text>
              </View>
              {(cut.method === 'detailed' && (cut.activities?.length ?? 0) > 0) &&
                (expandedCuts.includes(cut.id) ? (
                  <ChevronUp size={16} color={theme.textMuted} />
                ) : (
                  <ChevronDown size={16} color={theme.textMuted} />
                ))}
            </TouchableOpacity>

            {expandedCuts.includes(cut.id) && cut.method === 'detailed' && (
              <View style={[styles.activitiesList, { borderTopColor: 'rgba(255,255,255,0.2)' }]}>
                {cut.activities?.map((act: any) => (
                  <TouchableOpacity 
                    key={act.id} 
                    style={styles.activityRow}
                    activeOpacity={0.7}
                    onPress={() => {
                       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                       setEditingGrade({ cutId: cut.id, actId: act.id, name: act.name, weight: String(act.weight), grade: String(act.grade) });
                       setGradeModalVisible(true);
                    }}
                  >
                    <View style={[styles.actDot, { backgroundColor: course.color }]} />
                    <Text style={[styles.actName, { color: theme.textSecondary }]}>{act.name}</Text>
                    <Text style={[styles.actWeight, { color: theme.textMuted }]}>{act.weight}%</Text>
                    <Text style={[styles.actGrade, { color: course.color }]}>{parseFloat(act.grade).toFixed(1)}</Text>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginTop: 4, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.03)' }}
                    onPress={() => {
                       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                       setEditingGrade({ cutId: cut.id, name: '', weight: '', grade: '' });
                       setGradeModalVisible(true);
                    }}
                >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: course.color }}>+ Agregar Nota</Text>
                </TouchableOpacity>
              </View>
            )}
          </MotiView>
        ))}

        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: Radius.lg, marginBottom: Spacing.xl, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', borderStyle: 'dashed' }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setEditingCut({ name: '', weight: '30', method: 'basic', grade: '0.0' });
            setCutModalVisible(true);
          }}
        >
          <Text style={{ fontWeight: '800', fontSize: 14, color: course.color }}>+ Agregar Nuevo Corte</Text>
        </TouchableOpacity>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 600 }}
          style={styles.bigDataCard}
        >
          <MatteUnderlay radius={Radius.lg} />
          <View style={[styles.bigDataIcon, { backgroundColor: `${course.color}20` }]}>
            <Database size={20} color={course.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bigDataTitle, { color: theme.text }]}>Big Data Academico</Text>
            <Text style={[styles.bigDataDesc, { color: theme.textSecondary }]}>Analisis avanzado de CortexWebOS 3.1</Text>
          </View>
          <MatteIconButton
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert(
                'CortexWebOS Vision',
                'Este analisis requiere el motor Vision de la version escritorio por su alta carga computacional.',
                [{ text: 'Entendido', style: 'default' }]
              );
            }}
            size={36}
            radius={18}
            style={styles.moreInfoBtn}
            tint={`${course.color}15`}
          >
            <Info size={16} color={course.color} />
          </MatteIconButton>
        </MotiView>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recursos</Text>
        {(course.resources || []).map((res: any) => (
          <View key={res.id} style={styles.resourceRow}>
            <MatteUnderlay radius={Radius.md} />
            <View style={[styles.resourceIcon, { backgroundColor: `${course.color}20` }]}>
              <Link size={14} color={course.color} />
            </View>
            <Text style={[styles.resourceTitle, { color: theme.text }]}>{res.title}</Text>
          </View>
        ))}

        {course.schedule && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Horario</Text>
            <View style={styles.scheduleCard}>
              <MatteUnderlay radius={Radius.md} />
              <Calendar size={16} color={course.color} />
              <Text style={[styles.scheduleText, { color: theme.textSecondary }]}>
                {course.schedule.day} - {course.schedule.time}
              </Text>
            </View>
          </>
        )}

        {/* --- DELETE COURSE --- */}
        <View style={{ marginTop: 24 }}>
           <TouchableOpacity 
              style={{ padding: 18, borderRadius: Radius.lg, backgroundColor: theme.error + '15', borderWidth: 1.5, borderColor: theme.error + '30', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                Alert.alert(
                  'Eliminar Materia',
                  `¿Estás seguro que deseas eliminar "${course.name}"? Perderás todas sus notas y cortes.`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                      text: 'Eliminar', 
                      style: 'destructive', 
                      onPress: async () => {
                         if (!auth.currentUser) return;
                         const newCourses = courses.filter((c: any) => c.id !== course.id);
                         await db.collection('users').doc(auth.currentUser.uid).set({ courses: newCourses }, { merge: true });
                         navigation.goBack();
                      }
                    }
                  ]
                );
              }}
           >
              <Trash2 size={20} color={theme.error} />
              <Text style={{ color: theme.error, fontWeight: '900', fontSize: 16 }}>Eliminar Materia</Text>
           </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <Modal visible={aiModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['rgba(6,10,16,0.72)', 'rgba(6,10,16,0.42)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.modalContent}>
            <MatteUnderlay
              radius={Radius.xxl}
             
              base="rgba(255,255,255,0.2)"
             
             
            />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Brain size={20} color={theme.primary} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Estrategia IA</Text>
              </View>
              <MatteIconButton
                onPress={() => setAiModalVisible(false)}
                size={32}
                radius={16}
                tint="rgba(255,255,255,0.18)"
              >
                <X size={18} color={theme.textSecondary} />
              </MatteIconButton>
            </View>
            <ScrollView>
              <Text style={[styles.modalBody, { color: theme.textSecondary }]}>{AI_STRATEGY}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Grade CRUD Modal */}
      <Modal visible={gradeModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingGrade?.actId ? 'Editar Calificación' : 'Nueva Calificación'}
              </Text>
              <TouchableOpacity onPress={() => setGradeModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginTop: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textSecondary, textTransform: 'uppercase' }}>Nombre de la Actividad</Text>
              <TextInput
                style={[styles.inputSarah, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                placeholder="Ej: Parcial 1"
                placeholderTextColor={theme.textMuted}
                value={editingGrade?.name}
                onChangeText={(n) => setEditingGrade(prev => prev ? { ...prev, name: n } : null)}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>Nota (0.0 - 5.0)</Text>
                  <TextInput
                    style={[styles.inputSarah, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                    placeholder="Ej: 4.5"
                    keyboardType="numeric"
                    placeholderTextColor={theme.textMuted}
                    value={editingGrade?.grade}
                    onChangeText={(g) => setEditingGrade(prev => prev ? { ...prev, grade: g.replace(/[^0-9.]/g, '') } : null)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>Peso (%)</Text>
                  <TextInput
                    style={[styles.inputSarah, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                    placeholder="Ej: 30"
                    keyboardType="numeric"
                    placeholderTextColor={theme.textMuted}
                    value={editingGrade?.weight}
                    onChangeText={(w) => setEditingGrade(prev => prev ? { ...prev, weight: w.replace(/[^0-9]/g, '') } : null)}
                  />
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              {editingGrade?.actId && (
                <TouchableOpacity 
                   style={[styles.actionBtnSarah, { backgroundColor: theme.error + '20', flex: 0.5 }]}
                   onPress={deleteGrade}
                >
                  <Text style={{ color: theme.error, fontWeight: '800', fontSize: 15 }}>Eliminar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                 style={[styles.actionBtnSarah, { backgroundColor: course.color, flex: 1 }]}
                 onPress={saveGrade}
              >
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>Guardar Nota</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Cut CRUD Modal */}
      <Modal visible={cutModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingCut?.id ? 'Editar Corte' : 'Nuevo Corte'}
              </Text>
              <TouchableOpacity onPress={() => setCutModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginTop: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textSecondary, textTransform: 'uppercase' }}>Nombre del Corte</Text>
              <TextInput
                style={[styles.inputSarah, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                placeholder="Ej: Corte 1"
                placeholderTextColor={theme.textMuted}
                value={editingCut?.name}
                onChangeText={(n) => setEditingCut(prev => prev ? { ...prev, name: n } : null)}
              />

              <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 6, marginTop: 12 }}>Peso (%) en la Nota Final</Text>
              <TextInput
                style={[styles.inputSarah, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                placeholder="Ej: 30"
                keyboardType="numeric"
                placeholderTextColor={theme.textMuted}
                value={editingCut?.weight}
                onChangeText={(w) => setEditingCut(prev => prev ? { ...prev, weight: w.replace(/[^0-9]/g, '') } : null)}
              />

              <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 10, marginTop: 20 }}>Modo de Calificación</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {['basic', 'detailed'].map((m) => (
                    <TouchableOpacity 
                        key={m}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setEditingCut(prev => prev ? { ...prev, method: m as any } : null);
                        }}
                        style={{ 
                            flex: 1, 
                            paddingVertical: 12, 
                            borderRadius: 12, 
                            backgroundColor: (editingCut?.method || 'basic') === m ? course.color : theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                            alignItems: 'center',
                            borderWidth: 1.5,
                            borderColor: (editingCut?.method || 'basic') === m ? course.color : 'transparent'
                        }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '900', color: (editingCut?.method || 'basic') === m ? '#FFF' : theme.textSecondary }}>
                            {m === 'basic' ? 'BÁSICO' : 'DETALLADO'}
                        </Text>
                    </TouchableOpacity>
                ))}
              </View>
              <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 4, fontStyle: 'italic' }}>
                {editingCut?.method === 'detailed' 
                    ? '* El promedio se calculará automáticamente mediante el desglose de actividades.' 
                    : '* Ingresarás la nota final del corte manualmente sin desglosar actividades.'}
              </Text>

              {editingCut?.method === 'basic' && (
                  <View style={{ marginTop: 20 }}>
                     <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 8 }}>Nota Final del Corte</Text>
                     <TextInput
                        style={[styles.inputSarah, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, fontSize: 24, fontWeight: '900', height: 60, textAlign: 'center' }]}
                        placeholder="0.0"
                        keyboardType="numeric"
                        placeholderTextColor={theme.textMuted}
                        value={editingCut?.grade}
                        onChangeText={(g) => setEditingCut(prev => prev ? { ...prev, grade: g.replace(/[^0-9.]/g, '') } : null)}
                    />
                  </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 32 }}>
              {editingCut?.id && (
                <TouchableOpacity 
                   style={[styles.actionBtnSarah, { backgroundColor: theme.error + '20', flex: 0.5 }]}
                   onPress={deleteCut}
                >
                  <Text style={{ color: theme.error, fontWeight: '800', fontSize: 15 }}>Eliminar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                 style={[styles.actionBtnSarah, { backgroundColor: course.color, flex: 1 }]}
                 onPress={saveCut}
              >
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>Guardar Corte</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Course Header Edit Modal */}
      <Modal visible={courseModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Configuración de Materia</Text>
              <TouchableOpacity onPress={() => setCourseModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 12, marginTop: 10 }}>
                <Text style={styles.inputLabelSarah}>NOMBRE DE LA MATERIA</Text>
                <TextInput
                  style={[styles.inputSarah, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                  value={editingCourse?.name}
                  onChangeText={(t) => setEditingCourse(p => p ? {...p, name: t} : null)}
                />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabelSarah}>CÓDIGO</Text>
                    <TextInput
                      style={[styles.inputSarah, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                      value={editingCourse?.code}
                      onChangeText={(t) => setEditingCourse(p => p ? {...p, code: t} : null)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabelSarah}>CRÉDITOS</Text>
                    <TextInput
                      style={[styles.inputSarah, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                      keyboardType="numeric"
                      value={editingCourse?.credits}
                      onChangeText={(t) => setEditingCourse(p => p ? {...p, credits: t.replace(/[^0-9]/g, '')} : null)}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabelSarah}>PROFESOR</Text>
                <TextInput
                  style={[styles.inputSarah, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                  value={editingCourse?.professor}
                  onChangeText={(t) => setEditingCourse(p => p ? {...p, professor: t} : null)}
                />

                <Text style={styles.inputLabelSarah}>COLOR DISTINTIVO (HEX)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TextInput
                    style={[styles.inputSarah, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, flex: 1 }]}
                    value={editingCourse?.color}
                    onChangeText={(t) => setEditingCourse(p => p ? {...p, color: t} : null)}
                    />
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: editingCourse?.color || theme.primary }} />
                </View>

                {/* --- SCHEDULE MANAGEMENT SECTION --- */}
                <View style={{ marginTop: 20, padding: 16, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Clock size={16} color={course.color} />
                        <Text style={{ fontSize: 13, fontWeight: '900', color: theme.text, letterSpacing: 1 }}>GESTIÓN DE HORARIO</Text>
                    </View>

                    {/* New Block Form */}
                    <View style={{ gap: 10, marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(d => (
                                <TouchableOpacity 
                                    key={d}
                                    onPress={() => setNewBlock(prev => ({ ...prev, day: d }))}
                                    style={{ 
                                        paddingHorizontal: 10, 
                                        paddingVertical: 6, 
                                        borderRadius: 8, 
                                        backgroundColor: newBlock.day === d ? course.color : 'transparent',
                                        borderWidth: 1,
                                        borderColor: newBlock.day === d ? course.color : theme.border
                                    }}
                                >
                                    <Text style={{ fontSize: 11, fontWeight: '800', color: newBlock.day === d ? '#FFF' : theme.textSecondary }}>{d.substring(0,3)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TextInput 
                                style={[styles.inputSarah, { flex: 1, height: 40, paddingVertical: 0 }]}
                                value={newBlock.startTime}
                                onChangeText={t => setNewBlock(prev => ({ ...prev, startTime: t }))}
                                placeholder="08:00"
                            />
                            <Text style={{ alignSelf: 'center', color: theme.textSecondary }}>a</Text>
                            <TextInput 
                                style={[styles.inputSarah, { flex: 1, height: 40, paddingVertical: 0 }]}
                                value={newBlock.endTime}
                                onChangeText={t => setNewBlock(prev => ({ ...prev, endTime: t }))}
                                placeholder="10:00"
                            />
                            <TouchableOpacity 
                                onPress={() => {
                                    setEditingSchedule(prev => [...prev, { ...newBlock, id: Date.now() }]);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                                style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: course.color, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 20 }}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Current Sessions List */}
                    <View style={{ gap: 8 }}>
                        {editingSchedule.map((block, idx) => (
                            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#FFF', borderRadius: 10 }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>{block.day}</Text>
                                <Text style={{ fontSize: 13, color: theme.textSecondary }}>{block.startTime} - {block.endTime}</Text>
                                <TouchableOpacity onPress={() => setEditingSchedule(prev => prev.filter((_, i) => i !== idx))}>
                                    <X size={14} color={theme.error} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity 
               style={[styles.actionBtnSarah, { backgroundColor: course.color, marginTop: 24 }]}
               onPress={saveCourseDetails}
            >
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </CleanBackground>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    header: {
      height: 120,
      overflow: 'hidden',
      borderBottomLeftRadius: Radius.xl,
      borderBottomRightRadius: Radius.xl,
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
    headerGlass: {
      ...StyleSheet.absoluteFillObject,
      borderBottomLeftRadius: Radius.xl,
      borderBottomRightRadius: Radius.xl,
      overflow: 'hidden',
    },
    headerRim: {
      ...StyleSheet.absoluteFillObject,
      borderBottomLeftRadius: Radius.xl,
      borderBottomRightRadius: Radius.xl,
      borderWidth: 1.4,
      borderColor: theme.glassBorder,
      borderTopWidth: 0,
    },
    headerBevel: {
      ...StyleSheet.absoluteFillObject,
      borderBottomLeftRadius: Radius.xl,
      borderBottomRightRadius: Radius.xl,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderColor: theme.glassHighlight,
      opacity: 0.4,
    },
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingTop: 12,
      gap: Spacing.sm,
    },
    headerTitles: { flex: 1, overflow: 'hidden' },
    courseName: { fontSize: 17, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
    courseCode: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginTop: 2 },
    scroll: { flex: 1 },
    content: { padding: Spacing.base, gap: Spacing.md },
    averageCard: {
      borderRadius: Radius.xl,
      padding: Spacing.xl,
      alignItems: 'center',
      gap: Spacing.md,
      overflow: 'hidden',
      marginTop: Spacing.sm,
    },
    averageLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 4 },
    averageValue: { fontSize: 94, fontWeight: '900', letterSpacing: -5, marginTop: -8 },
    progressContainer: { width: '100%', alignItems: 'center', gap: 12 },
    progressBg: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    progressText: { fontSize: 10, textTransform: 'uppercase', fontWeight: '800' },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '900',
      marginTop: Spacing.md,
      letterSpacing: -0.8,
      marginBottom: Spacing.xs,
      color: theme.text,
    },
    cutCard: {
      borderRadius: Radius.lg,
      overflow: 'hidden',
      marginBottom: Spacing.md,
    },
    cutHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    cutWeight: {
      width: 44,
      height: 44,
      borderRadius: Radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cutWeightText: { fontSize: 13, fontWeight: '700' },
    cutInfo: { flex: 1 },
    cutName: { fontSize: 14, fontWeight: '600' },
    cutSubLabel: { fontSize: 11 },
    cutGrade: { fontSize: 22, fontWeight: '900' },
    activitiesList: {
      borderTopWidth: 1,
      paddingVertical: Spacing.sm,
    },
    activityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      gap: Spacing.sm,
    },
    actDot: { width: 6, height: 6, borderRadius: 3 },
    actName: { flex: 1, fontSize: 13 },
    actWeight: { fontSize: 11, width: 30 },
    actGrade: { fontSize: 14, fontWeight: '700', width: 30, textAlign: 'right' },
    resourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: Radius.md,
      padding: Spacing.md,
      gap: Spacing.sm,
      overflow: 'hidden',
    },
    resourceIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resourceTitle: { flex: 1, fontSize: 13 },
    oracleCard: {
        padding: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        marginTop: 10,
        marginBottom: 10,
    },
    oracleIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    oracleTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    oracleText: {
        fontSize: 12,
        color: theme.textSecondary,
        lineHeight: 16,
    },
    scheduleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: Radius.md,
      padding: Spacing.md,
      gap: Spacing.sm,
      overflow: 'hidden',
    },
    scheduleText: { fontSize: 14 },
    bigDataCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      borderRadius: Radius.lg,
      gap: Spacing.md,
      overflow: 'hidden',
      marginTop: Spacing.md,
    },
    bigDataIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bigDataTitle: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3, color: '#FFF' },
    bigDataDesc: { fontSize: 11, fontWeight: '600', opacity: 0.8, color: 'rgba(255,255,255,0.7)' },
    moreInfoBtn: {
      marginLeft: Spacing.xs,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: Radius.xxl,
      borderTopRightRadius: Radius.xxl,
      padding: Spacing.xl,
      maxHeight: '80%',
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    modalTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },
    modalBody: { fontSize: 16, lineHeight: 26, fontWeight: '500' },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputSarah: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      fontWeight: '600',
    },
    actionBtnSarah: {
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputLabelSarah: {
      fontSize: 11,
      fontWeight: '900',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4
    }
  });
