import React, { useState } from 'react';
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
  ChevronLeft, 
  Plus, 
  Monitor, 
  ArrowRight,
  BookOpen
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { Colors, Shadows } from '../constants/theme';
import CleanBackground from '../components/CleanBackground';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import FocusTransition from '../components/FocusTransition';
import { useScrollToHideTabBar } from '../hooks/useScrollToHideTabBar';
import { 
  MatteCard, 
  MatteUnderlay, 
  MatteIconButton, 
} from '../components/design-system/CortexMatte';

const { width } = Dimensions.get('window');

type FilterType = 'all' | 'presencial' | 'virtual';

export default function CoursesScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { courses } = useData();
  const styles = getStyles(theme);
  const [filter, setFilter] = useState<FilterType>('all');
  const handleScroll = useScrollToHideTabBar(40);

  const filtered = courses.filter((c: any) => {
    if (filter === 'all') return true;
    return c.modality === filter;
  });

  return (
    <CleanBackground shadowOpacity={0}>
      <FocusTransition>
        {/* HEADER PURISTA MATTE OS */}
        <View style={[styles.headerContainer, { paddingTop: insets.top + 15 }]}>
            <View style={styles.headerTopRow}>
                <MatteIconButton 
                    icon={ChevronLeft}
                    onPress={() => navigation.goBack()}
                />
                <MatteIconButton 
                    icon={Plus}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                />
            </View>
            <View style={styles.titleSection}>
                <Text style={styles.bigTitle}>Mis Cursos</Text>
                <Text style={styles.miniSubtitle}>MATERIAS DEL SEMESTRE · {courses.length}</Text>
            </View>
        </View>

        {/* CÁPSULA DE FILTROS CRONOS-STYLE */}
        <MotiView 
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.filterWrapper}
        >
            <MatteUnderlay radius={28} blur={40} />
            <View style={styles.filterInner}>
                {(['all', 'presencial', 'virtual'] as FilterType[]).map((f) => {
                    const isActive = filter === f;
                    const label = f === 'all' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1);
                    return (
                        <TouchableOpacity
                            key={f}
                            style={styles.filterTab}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setFilter(f);
                            }}
                        >
                            {isActive && (
                                <MotiView 
                                    style={styles.activeIndicator}
                                    from={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                />
                            )}
                            <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </MotiView>

        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
        >
            {filtered.map((course: any, i: number) => (
                <MotiView
                    key={course.id}
                    from={{ opacity: 0, translateY: 30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', damping: 20, delay: i * 80 }}
                >
                    <MatteCard
                        radius={26}
                        style={styles.glassCard}
                        onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
                    >
                        {/* BORDE DE ACENTO 8PX */}
                        <View style={[styles.accentStrip, { backgroundColor: course.color }]} />
                        
                        <View style={styles.cardContent}>
                            <View style={styles.cardTop}>
                                <View style={{ flex: 1, paddingRight: 10 }}>
                                    <Text style={styles.courseTitle}>{course.name}</Text>
                                    <View style={styles.codeRow}>
                                        <Text style={styles.courseCode}>{course.code}</Text>
                                        <View style={styles.dotMini} />
                                        <Text style={styles.credits}>{course.credits} Cr.</Text>
                                    </View>
                                </View>
                                {/* PROMEDIO DISPLAY EN ESQUINA */}
                                <Text style={[styles.averageGrade, { color: theme.text }]}>
                                    {course.average}
                                </Text>
                            </View>

                            {/* BARRA DE PROGRESO NEÓN */}
                            <View style={styles.progressRow}>
                                <View style={styles.barBg}>
                                    <View style={[styles.barFill, { width: `${course.progress}%`, backgroundColor: course.color }]} />
                                </View>
                                <Text style={[styles.progressVal, { color: course.color }]}>{course.progress}%</Text>
                            </View>

                            <View style={styles.cardBottom}>
                                <View style={styles.profContainer}>
                                    <View style={[styles.profInitialBg, { backgroundColor: course.color + '20' }]}>
                                        <Text style={[styles.profInitialText, { color: course.color }]}>
                                            {course.professor?.charAt(0) || 'P'}
                                        </Text>
                                    </View>
                                    <Text style={styles.profName}>{course.professor?.split(' ').slice(-1) || 'Prof'}</Text>
                                </View>
                                
                                <View style={styles.statusBadge}>
                                    {course.modality === 'virtual' ? <Monitor size={14} color={theme.textMuted} /> : <BookOpen size={14} color={theme.textMuted} />}
                                    <Text style={styles.statusText}>{course.modality}</Text>
                                    <ArrowRight size={14} color={theme.textMuted} style={{ marginLeft: 4 }} />
                                </View>
                            </View>
                        </View>
                    </MatteCard>
                </MotiView>
            ))}
            <View style={{ height: 120 }} />
        </ScrollView>
      </FocusTransition>
    </CleanBackground>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  titleSection: {
    marginTop: 5,
  },
  bigTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -1.5,
  },
  miniSubtitle: {
    fontSize: 10,
    color: theme.textMuted,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
  },
  filterWrapper: {
    marginHorizontal: 30,
    backgroundColor: 'transparent',
    borderRadius: 28,
    height: 56,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    ...Shadows.md,
  },
  filterInner: {
    flex: 1,
    flexDirection: 'row',
    padding: 6,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'white',
    borderRadius: 22,
    ...Shadows.sm,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.textMuted,
    zIndex: 1,
  },
  filterTextActive: {
    color: theme.primary,
  },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 10 },
  glassCard: {
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  accentStrip: {
    width: 8,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 20,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: -0.5,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  courseCode: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '700',
  },
  dotMini: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.textMuted },
  credits: { fontSize: 11, color: theme.textMuted, fontWeight: '700' },
  averageGrade: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -2,
    marginTop: -5,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  barBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressVal: {
    fontSize: 11,
    fontWeight: '900',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  profContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profInitialBg: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profInitialText: {
    fontSize: 13,
    fontWeight: '900',
  },
  profName: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
