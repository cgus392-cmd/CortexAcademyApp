import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Timer, 
  CalendarDays, 
  ListChecks, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap,
  Clock,
  BookOpen,
  ChevronRight,
  Sparkles,
  Kanban,
  ArrowRight,
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
  X,
  Tag,
  Calendar,
  Monitor,
  ChevronLeft,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Modal, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MotiView, AnimatePresence } from 'moti';
import { Colors, Spacing, Radius, Shadows } from '../constants/theme';
import { ScheduleBlock } from '../types';
import CleanBackground from '../components/CleanBackground';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { generateContextAwareText } from '../services/gemini';
import FocusTransition from '../components/FocusTransition';
import { useScrollToHideTabBar } from '../hooks/useScrollToHideTabBar';
import { MatteCard, MatteUnderlay, MatteIconButton, MatteBanner } from '../components/design-system/CortexMatte';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// --- Helper: Format Time ---
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getDeadlineLabel = (dateStr: string) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(dateStr);
    target.setHours(0,0,0,0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: 'Hoy', color: '#F59E0B' };
    if (diffDays === 1) return { label: 'Mañana', color: '#10B981' };
    if (diffDays < 0) return { label: `Vencido (${Math.abs(diffDays)}d)`, color: '#EF4444' };
    return { label: `en ${diffDays} días`, color: '#3B82F6' };
};

export default function CronosScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { tasks, scheduleBlocks, updateTask, updateScheduleBlock, courses } = useData();
  const styles = getStyles(theme);
  const [activeTab, setActiveTab] = useState<'Tasks' | 'Schedule' | 'Focus' | 'Kanban' | 'Calendar'>('Schedule');
  const handleScroll = useScrollToHideTabBar(40);

  // -- Pomodoro State --
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isWork, setIsWork] = useState(true);
  const [focusInsight, setFocusInsight] = useState('Consulta a Cortex un consejo para tu sesión de hoy.');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newTask, setNewTask] = useState({
    text: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    date: new Date().toISOString().split('T')[0],
    courseId: 0 as number | undefined,
    estimatedTime: '30m'
  });

  const fetchFocusTip = async () => {
    if (isAiLoading) return;
    
    setIsAiLoading(true);
    setFocusInsight('Cortex está analizando tus tareas...');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const prompt = "Actúa como Cortex Brain. Revisa mis tareas pendientes (materia, fecha, prioridad) y prioriza EXACTAMENTE cuál debería atacar en esta sesión Pomodoro de 25 min. Sé audaz, estratégico y motivador. MÁXIMO 2 LÍNEAS.";
      const result = await generateContextAwareText(prompt, { user: {} as any, courses, tasks, activeTab: 'Focus' });
      setFocusInsight(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setFocusInsight('Error al conectar con Cortex. Inténtalo de nuevo.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsActive(false);
    setTimeLeft(isWork ? 25 * 60 : 5 * 60);
  };

  const currentDay = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date().getDay()];
  const todayBlocks = scheduleBlocks.filter(b => b.day === currentDay);

  const { addTask, deleteTask } = useData();

  const handleAddTask = async () => {
    if (!newTask.text) return;
    const taskObj = {
        ...newTask,
        id: Date.now(),
        done: false,
        status: 'todo'
    };
    await addTask(taskObj);
    setIsModalVisible(false);
    setNewTask({
        text: '',
        description: '',
        priority: 'medium',
        date: new Date().toISOString().split('T')[0],
        courseId: 0,
        estimatedTime: '30m'
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteTask = (id: number) => {
    Alert.alert('Eliminar Tarea', '¿Estás seguro de eliminar esta tarea permanentemente?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
            await deleteTask(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }}
    ]);
  };

  return (
    <CleanBackground>
      <FocusTransition>
        <View style={[styles.container, { paddingTop: insets.top + Spacing.base }]}>

        {/* --- HEADER --- */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.md }}>
            <MatteIconButton 
                icon={ChevronLeft}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.goBack();
                }}
            />
            
            <MatteIconButton 
                icon={Plus}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setIsModalVisible(true);
                }}
            />
          </View>

          <View style={{ marginTop: 15 }}>
            <Text style={styles.title}>Cronos</Text>
            <Text style={styles.subtitle}>Sincronización Cuántica</Text>
          </View>

          {/* --- TOP COMMAND BAR (INTEGRATED TABS) --- */}
          <View style={styles.commandBar}>
            <MatteUnderlay radius={Radius.full} />
            <View style={styles.dockInner}>
                {[
                  { id: 'Schedule', icon: CalendarDays, label: 'Horario' },
                  { id: 'Tasks', icon: ListChecks, label: 'Tareas' },
                  { id: 'Focus', icon: Timer, label: 'Focus' },
                  { id: 'Kanban', icon: Kanban, label: 'Tablero' },
                  { id: 'Calendar', icon: Calendar, label: 'Mes' },
                ].map(tab => {
                  const selected = activeTab === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      style={[styles.dockTab, selected && styles.dockTabActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setActiveTab(tab.id as any);
                      }}
                    >
                      <tab.icon size={18} color={selected ? theme.primary : theme.text} strokeWidth={selected ? 2.5 : 2} />
                    </TouchableOpacity>
                  );
                })}
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <AnimatePresence exitBeforeEnter>
            {activeTab === 'Focus' && (
              <MotiView
                key="focus"
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={styles.focusContainer}
              >
                <MatteCard 
                  radius={140}
                  style={styles.timerSphere}
                >
                  <MotiView 
                    from={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring' }}
                    style={{ alignItems: 'center' }}
                  >
                    <Text style={styles.timerValue}>
                      {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
                      {String(timeLeft % 60).padStart(2, '0')}
                    </Text>
                    <Text style={styles.timerLabel}>{isActive ? 'FOCUS ACTIVO' : 'LISTO PARA TRABAJAR'}</Text>
                  </MotiView>
                </MatteCard>

                <View style={styles.focusControls}>
                  <TouchableOpacity 
                    style={[styles.focusBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}
                    onPress={resetTimer}
                  >
                    <RotateCcw size={22} color={theme.text} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.focusBtnLarge}
                    onPress={toggleTimer}
                  >
                    <LinearGradient
                      colors={isActive ? ['#FF5A5F', '#FF1F2F'] : [theme.primary, theme.primaryDark]}
                      style={styles.focusBtnLargeGradient}
                    >
                      {isActive ? (
                        <Pause size={32} color="#FFF" fill="#FFF" />
                      ) : (
                        <Play size={32} color="#FFF" fill="#FFF" style={{ marginLeft: 4 }} />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.focusBtn, { backgroundColor: theme.primary + '15' }]}
                    onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                  >
                    <Zap size={22} color={theme.primary} fill={theme.primary} />
                  </TouchableOpacity>
                </View>

                <MatteBanner 
                  title="Cortex Brain Suggestion"
                  subtitle="Tu ritmo actual sugiere que una sesión de 25m de Investigación de Operaciones maximizará tu retención."
                  icon={Sparkles}
                  color={theme.primary}
                  onPress={() => Alert.alert("Cortex Brain", "Análisis de flujo: ¡Es el momento perfecto para enfocarte!")}
                />
              </MotiView>
            )}

            {activeTab === 'Kanban' && (() => {
              const COLUMNS = [
                { id: 'todo',        label: 'POR HACER',   color: '#06B6D4' },
                { id: 'in_progress', label: 'EN PROGRESO', color: '#34D399' },
                { id: 'done',        label: 'TERMINADO',   color: '#FB7185' },
              ];

              const getPriorityColor = (p: string) => {
                if (p === 'high')   return '#FF5A5F';
                if (p === 'low')    return '#34D399';
                return '#F59E0B';
              };

              const advanceTask = (task: any) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const order = ['todo', 'in_progress', 'done'];
                const curr = task.status || (task.done ? 'done' : 'todo');
                const next = order[Math.min(order.indexOf(curr) + 1, 2)];
                updateTask({ ...task, status: next, done: next === 'done' });
              };

              return (
                <MotiView
                  key="kanban"
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0, translateY: 10 }}
                  style={styles.listContainer}
                >
                  <View style={styles.kanbanHeader}>
                    <Text style={styles.kanbanMeta}>{tasks.length} TAREAS TOTALES</Text>
                  </View>

                  {COLUMNS.map(col => {
                    const colTasks = tasks.filter((t: any) => {
                      const s = t.status || (t.done ? 'done' : 'todo');
                      return s === col.id;
                    });

                    return (
                      <View key={col.id} style={{ marginBottom: 24 }}>
                        <View style={styles.categoryHeader}>
                          <View style={[styles.catIndicator, { backgroundColor: col.color }]} />
                          <Text style={[styles.categoryTitle, { color: col.color }]}>{col.label}</Text>
                          <View style={styles.catBadge}>
                            <Text style={styles.catBadgeText}>{colTasks.length}</Text>
                          </View>
                        </View>

                        {colTasks.length === 0 ? (
                          <Text style={[styles.emptyText, { marginLeft: 16, marginTop: 8 }]}>Sin tareas aquí.</Text>
                        ) : (
                          colTasks.map((task: any) => (
                            <MatteCard
                              key={task.id}
                              radius={24}
                              style={styles.kanbanCard}
                            >
                              <View style={{ flex: 1, paddingRight: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: getPriorityColor(task.priority) }} />
                                  <Text style={styles.kanbanSubject}>
                                    {task.courseId ? (courses.find(c => c.id === task.courseId)?.name || 'General') : 'General'}
                                  </Text>
                                </View>
                                <Text style={styles.kanbanTaskText}>{task.text}</Text>
                              </View>

                              {col.id !== 'done' ? (
                                <TouchableOpacity
                                  style={[styles.kanbanAdvanceBtn, { backgroundColor: col.color + '15' }]}
                                  onPress={() => advanceTask(task)}
                                >
                                  <ArrowRight size={18} color={col.color} strokeWidth={2.5} />
                                </TouchableOpacity>
                              ) : (
                                <CheckCircle2 size={22} color="#FB7185" style={{ marginLeft: 8 }} />
                              )}
                            </MatteCard>
                          ))
                        )}
                      </View>
                    );
                  })}
                </MotiView>
              );
            })()}

            {activeTab === 'Tasks' && (
              <MotiView
                key="tasks"
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: 20 }}
                style={styles.listContainer}
              >
                {(() => {
                    const groupedTasks: Record<string, any[]> = {};
                    tasks.forEach(t => {
                        const cat = t.courseId ? (courses.find(c => c.id === t.courseId)?.name || 'General') : 'General';
                        if (!groupedTasks[cat]) groupedTasks[cat] = [];
                        groupedTasks[cat].push(t);
                    });

                    return Object.entries(groupedTasks).map(([cat, items], idx) => (
                        <View key={cat} style={{ marginBottom: 20 }}>
                            <View style={styles.categoryHeader}>
                                <View style={[styles.catIndicator, { backgroundColor: courses.find(c => c.name === cat)?.color || theme.primary }]} />
                                <Text style={styles.categoryTitle}>{cat.toUpperCase()}</Text>
                                <View style={styles.catBadge}>
                                    <Text style={styles.catBadgeText}>{items.length}</Text>
                                </View>
                            </View>
                            {items.map((task: any, i: number) => (
                                <MatteCard
                                    key={task.id}
                                    radius={20}
                                    style={styles.taskItem}
                                >
                                    <TouchableOpacity 
                                      style={[styles.checkbox, task.done && styles.checkboxDone]}
                                      onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        updateTask({ ...task, done: !task.done, status: !task.done ? 'done' : 'todo' });
                                      }}
                                    >
                                        {task.done && <Zap size={10} color="#fff" />}
                                    </TouchableOpacity>
                                    <View style={{ flex: 1, gap: 2 }}>
                                        <Text style={[styles.taskText, task.done && styles.taskTextDone, { color: theme.text }]}>{task.text}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            {(() => {
                                                const d = getDeadlineLabel(task.date);
                                                if (!d) return null;
                                                return (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                        <Calendar size={10} color={d.color} />
                                                        <Text style={[styles.taskDesc, { color: d.color, fontWeight: '800' }]}>{d.label}</Text>
                                                    </View>
                                                );
                                            })()}
                                            <View style={styles.dotMini} />
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <Clock size={10} color={theme.textMuted} />
                                                <Text style={styles.taskDesc}>{task.estimatedTime || '30m'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.trashBtn}
                                        onPress={() => handleDeleteTask(task.id)}
                                    >
                                        <Trash2 size={16} color={theme.error} opacity={0.6} />
                                    </TouchableOpacity>
                                </MatteCard>
                            ))}
                        </View>
                    ));
                })()}
              </MotiView>
            )}

            {activeTab === 'Calendar' && (
              <MotiView
                key="calendar_msg"
                from={{ opacity: 0, transform: [{ translateY: 10 }] }}
                animate={{ opacity: 1, transform: [{ translateY: 0 }] }}
                exit={{ opacity: 0, transform: [{ translateY: 10 }] }}
                style={[styles.calendarContainer, { alignItems: 'center', justifyContent: 'center', paddingTop: 100 }]}
              >
                  <View style={styles.webOsIconContainer}>
                      <Monitor size={48} color={theme.primary} opacity={0.5} />
                      <Sparkles size={24} color={theme.primary} style={styles.sparkleIcon} />
                  </View>
                  <Text style={[styles.title, { textAlign: 'center', marginTop: 20 }]}>Calendario Maestro</Text>
                  <Text style={[styles.subtitle, { textAlign: 'center', paddingHorizontal: 40, marginTop: 10 }]}>
                    La experiencia del calendario completo es más cómoda en **CortexWebOS**.
                  </Text>
                  <TouchableOpacity 
                    style={[styles.navBtn, { marginTop: 20, paddingHorizontal: 20 }]}
                    onPress={() => Alert.alert("CortexWebOS", "Sincroniza tu cuenta en tu PC para ver el calendario completo.")}
                  >
                      <Text style={styles.navText}>Saber más</Text>
                  </TouchableOpacity>
              </MotiView>
            )}
             {activeTab === 'Schedule' && (
              <MotiView
                key="agenda_list"
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={styles.listContainer}
              >
                  {WEEK_DAYS.filter(day => scheduleBlocks.some(b => b.day === day)).map((day, dIdx) => {
                      const dayBlocks = scheduleBlocks
                        .filter((b: any) => b.day === day)
                        .sort((a, b) => a.startTime.localeCompare(b.startTime));
                      
                      const isToday = day === currentDay;
                      const now = new Date();

                      return (
                          <View key={day} style={{ marginBottom: 30, position: 'relative' }}>
                              {/* --- DAY HEADER --- */}
                              <View style={[styles.categoryHeader, isToday && { borderBottomWidth: 1, borderBottomColor: theme.primary + '20', paddingBottom: 8 }]}>
                                  <View style={[styles.catIndicator, { backgroundColor: isToday ? theme.primary : theme.textMuted }]} />
                                  <Text style={[styles.categoryTitle, isToday && { color: theme.primary }]}>{day.toUpperCase()}</Text>
                                  {isToday && (
                                    <View style={[styles.liveBadge, { backgroundColor: '#FF5A5F' }]}>
                                        <Text style={styles.liveBadgeText}>HOY</Text>
                                    </View>
                                  )}
                              </View>
                              
                              <View style={{ flexDirection: 'row' }}>
                                  {/* --- VERTICAL TIMELINE --- */}
                                  <View style={styles.timelineSidebar}>
                                      <View style={[styles.timelineLine, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />
                                      {isToday && (() => {
                                        const nowMinutes = now.getHours() * 60 + now.getMinutes();
                                        const dayStart = 7 * 60; 
                                        const dayEnd = 21 * 60;  
                                        const percentage = Math.max(0, Math.min(100, ((nowMinutes - dayStart) / (dayEnd - dayStart)) * 100));
                                        return (
                                          <MotiView 
                                              animate={{ 
                                                top: `${percentage}%`,
                                                opacity: [0.6, 1, 0.6], 
                                                scale: [1, 1.3, 1] 
                                              }}
                                              transition={{ 
                                                top: { type: 'timing', duration: 1000 },
                                                opacity: { loop: true, duration: 2000 },
                                                scale: { loop: true, duration: 2000 }
                                              }}
                                              style={styles.nowIndicatorDot}
                                          />
                                        );
                                      })() }
                                  </View>

                                  <View style={{ flex: 1, paddingLeft: 10 }}>
                                      {dayBlocks.map((block: any, bIdx: number) => {
                                          if (!block.startTime || !block.endTime) return null;
                                          const blockStartArr = block.startTime.split(':').map(Number);
                                          const blockEndArr = block.endTime.split(':').map(Number);
                                          const startMin = blockStartArr[0] * 60 + blockStartArr[1];
                                          const endMin = blockEndArr[0] * 60 + blockEndArr[1];
                                          const nowMinutes = now.getHours() * 60 + now.getMinutes();
                                          
                                          const isCurrent = isToday && nowMinutes >= startMin && nowMinutes <= endMin;
                                          const progress = isCurrent ? Math.max(0, Math.min(100, ((nowMinutes - startMin) / (endMin - startMin)) * 100)) : 0;
                                          
                                          const blockTasks = tasks.filter(t => t.courseId === block.courseId && !t.done);

                                          return (
                                              <MatteCard 
                                                key={block.id}
                                                radius={28}
                                                style={[
                                                    styles.scheduleCard, 
                                                    { 
                                                      marginBottom: 16, 
                                                      borderWidth: 1.5, 
                                                      borderColor: isCurrent ? '#FF5A5F60' : 'rgba(255,255,255,0.05)' 
                                                    }
                                                ]}
                                              >
                                                  <View style={styles.scheduleContent}>
                                                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                          <Text style={[styles.scheduleTitle, { fontSize: isCurrent ? 18 : 16, color: theme.text }]} numberOfLines={1}>{block.subject}</Text>
                                                          {isCurrent && (
                                                              <View style={styles.liveIndicativeGroup}>
                                                                  <Text style={styles.liveIndicativeText}>ON NOW</Text>
                                                                  <View style={styles.ongoingPulse}>
                                                                      <View style={styles.pulseInner} />
                                                                  </View>
                                                              </View>
                                                          )}
                                                      </View>
                                                      
                                                      <View style={styles.scheduleMeta}>
                                                          <Clock size={12} color={isCurrent ? '#FF5A5F' : theme.textSecondary} />
                                                          <Text style={[styles.scheduleTime, isCurrent && { color: '#FF5A5F', fontWeight: '800' }]}>
                                                              {block.startTime} — {block.endTime}
                                                          </Text>
                                                          <View style={styles.dot} />
                                                          <Text style={styles.scheduleRoom}>{block.room || 'Aula Virtual'}</Text>
                                                      </View>

                                                      {blockTasks.length > 0 && (
                                                          <View style={[styles.fusedTasksContainer, { 
                                                            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                                            borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
                                                          }]}>
                                                              <View style={styles.fusedHeader}>
                                                                  <ListChecks size={12} color={theme.textMuted} />
                                                                  <Text style={[styles.fusedTitle, { color: theme.textMuted }]}>PENDIENTES DEL CURSO</Text>
                                                              </View>
                                                              {blockTasks.slice(0, 2).map((task: any) => (
                                                                  <View key={task.id} style={styles.fusedTaskRow}>
                                                                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.primary }} />
                                                                      <Text style={[styles.fusedTaskText, { color: theme.textSecondary }]} numberOfLines={1}>{task.text}</Text>
                                                                  </View>
                                                              ))}
                                                              {blockTasks.length > 2 && <Text style={[styles.fusedMore, { color: theme.textMuted }]}>+ {blockTasks.length - 2} tareas más</Text>}
                                                          </View>
                                                      )}

                                                      {isCurrent && (
                                                          <View style={[styles.progressBarBg, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                                                              <MotiView 
                                                                  from={{ width: '0%' }}
                                                                  animate={{ width: `${progress}%` }}
                                                                  style={[styles.progressBarFill, { backgroundColor: '#FF5A5F' }]} 
                                                              />
                                                          </View>
                                                      )}
                                                  </View>
                                                  
                                                  <TouchableOpacity 
                                                    style={styles.scheduleAction}
                                                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                                                  >
                                                      <ChevronRight size={18} color={isCurrent ? '#FF5A5F' : theme.textMuted} />
                                                  </TouchableOpacity>
                                              </MatteCard>
                                          );
                                      })}
                                  </View>
                              </View>
                          </View>
                      );
                  })}
                  
                  {currentDay === 'Domingo' && scheduleBlocks.filter(b => b.day === 'Domingo').length === 0 && (
                      <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                          <View style={styles.webOsIconContainer}>
                              <Sparkles size={48} color={theme.primary} opacity={0.3} />
                          </View>
                          <Text style={[styles.title, { textAlign: 'center', marginTop: 10 }]}>Domingo de Reset</Text>
                          <Text style={[styles.subtitle, { textAlign: 'center', paddingHorizontal: 40 }]}>
                              Disfruta tu descanso. Cortex está preparando tu semana para el éxito total.
                          </Text>
                      </View>
                  )}
                  
                  {scheduleBlocks.length === 0 && (
                      <View style={styles.emptyState}>
                          <Sparkles size={48} color={theme.textMuted} opacity={0.3} />
                          <Text style={styles.emptyText}>No hay clases programadas.</Text>
                      </View>
                  )}
              </MotiView>
            )}
          </AnimatePresence>
        </ScrollView>

        <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => setIsModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <MatteUnderlay radius={30} baseColor={theme.isDark ? 'rgba(28,28,30,0.98)' : 'rgba(255,255,255,0.98)'} />
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Nueva Tarea</Text>
                        <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                            <X size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.formGroup}>
                            <Text style={styles.inputLabel}>¿Qué hay que hacer?</Text>
                            <TextInput 
                                style={styles.mainInput}
                                placeholder="Ej: Estudiar para parcial"
                                value={newTask.text}
                                onChangeText={(t) => setNewTask({...newTask, text: t})}
                            />
                        </View>

                        <View style={styles.rowForm}>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Prioridad</Text>
                                <View style={styles.toggleRow}>
                                    {['low', 'medium', 'high'].map(p => (
                                        <TouchableOpacity 
                                            key={p} 
                                            onPress={() => setNewTask({...newTask, priority: p as any})}
                                            style={[styles.miniToggle, newTask.priority === p && styles.miniToggleActive]}
                                        >
                                            <Text style={[styles.miniToggleText, newTask.priority === p && styles.miniToggleTextActive]}>
                                                {p === 'low' ? 'Baja' : p === 'medium' ? 'Media' : 'Alta'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.inputLabel}>Materia Asociada</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 5 }}>
                                <TouchableOpacity 
                                    onPress={() => setNewTask({...newTask, courseId: 0})}
                                    style={[styles.coursePill, newTask.courseId === 0 && styles.coursePillActive]}
                                >
                                    <Tag size={14} color={newTask.courseId === 0 ? '#FFF' : theme.textSecondary} />
                                    <Text style={[styles.coursePillText, newTask.courseId === 0 && { color: '#FFF' }]}>General</Text>
                                </TouchableOpacity>
                                {courses.map((c: any) => (
                                    <TouchableOpacity 
                                        key={c.id} 
                                        onPress={() => setNewTask({...newTask, courseId: c.id})}
                                        style={[styles.coursePill, newTask.courseId === c.id && { backgroundColor: c.color }]}
                                    >
                                        <BookOpen size={14} color={newTask.courseId === c.id ? '#FFF' : c.color} />
                                        <Text style={[styles.coursePillText, newTask.courseId === c.id && { color: '#FFF' }]}>{c.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={[styles.rowForm, { gap: 15 }]}>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Fecha Límite</Text>
                                <TextInput 
                                    style={styles.fieldInput}
                                    value={newTask.date}
                                    onChangeText={(t) => setNewTask({...newTask, date: t})}
                                    placeholder="AAAA-MM-DD"
                                />
                            </View>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Estimación</Text>
                                <TextInput 
                                    style={styles.fieldInput}
                                    value={newTask.estimatedTime}
                                    onChangeText={(t) => setNewTask({...newTask, estimatedTime: t})}
                                    placeholder="30m"
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.createBtn} onPress={handleAddTask}>
                            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.createBtnGradient}>
                                <Text style={styles.createBtnText}>GUARDAR TAREA</Text>
                                <Zap size={18} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
        </View>
      </FocusTransition>
    </CleanBackground>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 10 },
  title: { fontSize: 34, fontWeight: '900', color: theme.text, letterSpacing: -1.5 },
  subtitle: { fontSize: 14, color: theme.textMuted, fontWeight: '600', marginTop: -4 },
  valText: { fontSize: 14, fontWeight: '800', color: theme.primary },
  toggleRow: { flexDirection: 'row', gap: 5, backgroundColor: 'rgba(0,0,0,0.05)', padding: 4, borderRadius: 12 },
  miniToggle: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  miniToggleActive: { backgroundColor: '#fff', ...Shadows.sm },
  miniToggleText: { fontSize: 12, fontWeight: '800', color: theme.textMuted },
  miniToggleTextActive: { color: theme.primary },
  commandBar: { height: 60, marginTop: 20, borderRadius: Radius.full, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, overflow: 'hidden', borderWidth: 1, borderColor: theme.glassBorder },
  dockInner: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  dockTab: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dockTabActive: { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' },
  trashBtn: { padding: 8 },
  plusBtn: { width: 48, height: 48, borderRadius: Radius.lg, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.primary },
  scroll: { flex: 1 },
  content: { padding: 20 },
  focusContainer: { alignItems: 'center', gap: 40 },
  timerSphere: { width: 280, height: 280, borderRadius: 140, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', ...Shadows.lg },
  timerLabel: { fontSize: 12, fontWeight: '900', color: Colors.textSecondary, letterSpacing: 2, marginBottom: 8 },
  timerValue: { fontSize: 64, fontWeight: '900', color: theme.text, letterSpacing: -2 },
  timerActions: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 20 },
  playBtn: { width: 80, height: 80, borderRadius: 40, ...Shadows.primary },
  playGradient: { flex: 1, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  resetBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  modeBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  aiSuggestionSarah: { width: '100%', flexDirection: 'row', padding: 20, gap: 16, alignItems: 'center' },
  aiIconSarah: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  aiTitleSarah: { fontSize: 14, fontWeight: '900', color: Colors.primary, marginBottom: 2 },
  aiTextSarah: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', fontStyle: 'italic' },
  listContainer: { gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  taskText: { fontSize: 16, fontWeight: '800', color: theme.text },
  taskTextDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  taskDesc: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  priorityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5A5F' },
  scheduleCard: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16, overflow: 'hidden' },
  scheduleLine: { width: 4, height: '100%', borderRadius: 2, position: 'absolute', left: 0 },
  scheduleContent: { flex: 1, gap: 4 },
  scheduleTitle: { fontSize: 16, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  scheduleMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scheduleTime: { fontSize: 13, color: theme.textSecondary, fontWeight: '700' },
  scheduleRoom: { fontSize: 13, color: theme.textSecondary, fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  scheduleAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontWeight: '600' },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 10 },
  catIndicator: { width: 4, height: 14, borderRadius: 2 },
  categoryTitle: { fontSize: 11, fontWeight: '900', color: theme.textMuted, letterSpacing: 1.5, flex: 1 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.05)' },
  catBadgeText: { fontSize: 10, fontWeight: '900', color: theme.textMuted },
  dotMini: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(0,0,0,0.1)' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { height: '80%', padding: 25, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: theme.text, letterSpacing: -0.5 },
  formGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '900', color: theme.textMuted, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  mainInput: { fontSize: 20, fontWeight: '800', color: theme.text, paddingVertical: 10, borderBottomWidth: 1.5, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
  rowForm: { flexDirection: 'row' },
  fieldInput: { fontSize: 16, fontWeight: '700', color: theme.text, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', padding: 12, borderRadius: 12 },
  coursePill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', marginRight: 10 },
  coursePillActive: { backgroundColor: theme.primary },
  coursePillText: { fontSize: 13, fontWeight: '800', color: theme.textSecondary },
  createBtn: { marginTop: 20, marginBottom: 40, height: 60, borderRadius: 20, overflow: 'hidden', ...Shadows.primary },
  createBtnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  createBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  gridBlock: { position: 'absolute', borderRadius: 8, padding: 6, borderWidth: 1, justifyContent: 'center' },
  blockText: { fontSize: 9, fontWeight: '900', color: '#fff', textAlign: 'center' },
  blockMeta: { fontSize: 7, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 2 },
  calendarContainer: { padding: 10, gap: 10 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 5 },
  monthTitle: { fontSize: 18, fontWeight: '900', color: theme.text },
  monthNav: { flexDirection: 'row', gap: 10 },
  navBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, borderWidth: 1, borderColor: theme.glassBorder },
  navText: { fontSize: 12, fontWeight: '800', color: theme.primary },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', justifyContent: 'center' },
  monthDayHeader: { width: (width - 40) / 7, alignItems: 'center', paddingVertical: 10 },
  monthDayHeaderText: { fontSize: 10, fontWeight: '900', color: theme.textSecondary },
  monthCell: { width: (width - 40) / 7, height: 75, borderWidth: 0.5, borderColor: theme.glassBorder, padding: 6 },
  monthCellNum: { fontSize: 11, fontWeight: '800', color: theme.text },
  indicators: { flexDirection: 'row', gap: 3, position: 'absolute', bottom: 6, right: 6 },
  calHint: { fontSize: 10, color: theme.textMuted, textAlign: 'center', marginTop: 15, fontStyle: 'italic' },
  webOsIconContainer: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  sparkleIcon: { position: 'absolute', top: 10, right: 10 },
  commentBubble: { backgroundColor: 'rgba(0,0,0,0.03)', padding: 8, borderRadius: 10, marginTop: 6, borderLeftWidth: 2, borderLeftColor: theme.primary },
  commentText: { fontSize: 11, fontStyle: 'italic', color: theme.textSecondary },
  kanbanHeader: { paddingBottom: 12 },
  kanbanMeta: { color: theme.textSecondary, fontWeight: '600' },
  kanbanCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 8, overflow: 'hidden' },
  kanbanAdvanceBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  kanbanSubject: { fontSize: 10, fontWeight: '800', color: theme.textSecondary, letterSpacing: 0.5 },
  kanbanTaskText: { fontSize: 15, fontWeight: '700', color: theme.text },
  taskItem: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 8 },
  taskCheckWrapper: { marginRight: 15 },
  taskCheckbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center' },
  priorityLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  priorityText: { fontSize: 10, fontWeight: '800', color: '#FF5A5F' },
  taskDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  focusControls: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 40 },
  focusBtn: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  focusBtnLarge: { width: 80, height: 80, borderRadius: 40, ...Shadows.primary },
  focusBtnLargeGradient: { flex: 1, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTasks: { padding: 40, alignItems: 'center' },
  timelineSidebar: { width: 40, alignItems: 'center' },
  timelineLine: { width: 4, flex: 1, borderRadius: 2, marginVertical: 10, opacity: 0.15 },
  nowIndicatorDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FF5A5F', position: 'absolute', borderWidth: 3, borderColor: theme.isDark ? '#1C1C1E' : '#FFF', shadowColor: '#FF5A5F', shadowRadius: 10, shadowOpacity: 0.8 },
  liveBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 12 },
  liveBadgeText: { fontSize: 11, fontWeight: '900', color: '#FFF' },
  liveIndicativeGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF5A5F15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 6 },
  liveIndicativeText: { fontSize: 10, fontWeight: '800', color: '#FF5A5F', letterSpacing: 0.5 },
  ongoingPulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF5A5F' },
  pulseInner: { flex: 1, borderRadius: 3, backgroundColor: '#FF5A5F' },
  progressBarBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, marginTop: 16, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  fusedTasksContainer: { marginTop: 14, padding: 12, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 18, gap: 8, borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
  fusedHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  fusedTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  fusedTaskRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fusedTaskText: { fontSize: 13, fontWeight: '600' },
  fusedMore: { fontSize: 11, fontStyle: 'italic', marginTop: 4, fontWeight: '700' },
});
