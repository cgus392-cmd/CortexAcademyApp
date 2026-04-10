import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  ChevronRight, 
  ArrowLeft,
  Filter,
  CloudOff,
  Wifi
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MotiView, AnimatePresence } from 'moti';
import { Spacing, Radius, Shadows } from '../constants/theme';
import CleanBackground from '../components/CleanBackground';
import { useTheme } from '../context/ThemeContext';
import { cacheData, getCachedData, StorageKeys } from '../utils/storage';
import { useData, resolveColor } from '../context/DataContext';
import { MatteCard, MatteUnderlay } from '../components/design-system/CortexMatte';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function CalendarScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { scheduleBlocks } = useData();
  const styles = getStyles(theme);
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() - 1] || 'Lunes');

  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoadingUI, setIsLoadingUI] = useState(true);

  const loadData = async (forceOffline: boolean = false) => {
    setIsLoadingUI(true);
    if (forceOffline) {
      setIsOffline(true);
      const cached = await getCachedData<any[]>(StorageKeys.SCHEDULE_CACHE);
      setScheduleData(cached || []);
    } else {
      setScheduleData(scheduleBlocks);
      await cacheData(StorageKeys.SCHEDULE_CACHE, scheduleBlocks);
      setIsOffline(false);
      setIsLoadingUI(false);
      return; 
    }
    setIsLoadingUI(false);
  };

  useEffect(() => {
    if (scheduleBlocks.length > 0) {
      loadData(false);
    } else {
      loadData(true);
    }
  }, [scheduleBlocks]);

  const filteredBlocks = scheduleData.filter(b => b.day === selectedDay).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleDayPress = (day: string) => {
    Haptics.selectionAsync();
    setSelectedDay(day);
  };

  return (
    <CleanBackground>
      {/* Header */}
      <MotiView 
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.title}>Horario Semanal</Text>
          {isOffline && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <CloudOff size={10} color={theme.error} />
              <Text style={{ fontSize: 10, color: theme.error, fontWeight: '700' }}>Sin conexión (Caché)</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.headerIcon} 
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            loadData(!isOffline);
          }}
        >
          {isOffline ? <Wifi size={22} color={theme.primary} /> : <Filter size={22} color={theme.textSecondary} />}
        </TouchableOpacity>
      </MotiView>

      {isLoadingUI && (
         <View style={{ paddingVertical: 10 }}>
            <ActivityIndicator size="small" color={theme.primary} />
         </View>
      )}

      {/* Day Selector */}
      <View style={styles.daySelectorWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelector}
        >
          {DAYS.map((day) => {
            const isSelected = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => handleDayPress(day)}
                style={[styles.dayItem, isSelected && styles.dayItemSelected]}
              >
                 <AnimatePresence>
                    {isSelected && (
                        <MotiView
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={[StyleSheet.absoluteFill, styles.daySelectedBg, { backgroundColor: theme.primary }]}
                        />
                    )}
                 </AnimatePresence>
                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                  {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredBlocks.length === 0 ? (
          <MatteCard 
            radius={30}
            style={styles.emptyState}
          >
            <CalendarIcon size={48} color={theme.textSecondary} style={{ opacity: 0.3, marginBottom: 15 }} />
            <Text style={styles.emptyTitle}>Día sin clases</Text>
            <Text style={styles.emptySubtitle}>Aprovecha para adelantar tareas o descansar.</Text>
          </MatteCard>
        ) : (
          filteredBlocks.map((block, i) => (
            <MotiView
              key={block.id}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: 200 + i * 100 }}
              style={styles.timelineItem}
            >
              {/* Time Indicator */}
              <View style={styles.timeWrapper}>
                <Text style={styles.startTime}>{block.startTime}</Text>
                <View style={[styles.timeDot, { backgroundColor: resolveColor(block.color) }]} />
                <View style={[styles.timeLine, { backgroundColor: theme.divider }]} />
              </View>

              {/* Class Card */}
              <MatteCard style={styles.classCard} radius={25}>
                
                <View style={styles.classInfo}>
                  <View style={styles.classHeader}>
                    <Text style={styles.subjectText}>{block.subject}</Text>
                    <View style={[styles.colorBadge, { backgroundColor: resolveColor(block.color) + '20' }]}>
                        <View style={[styles.colorDot, { backgroundColor: resolveColor(block.color) }]} />
                    </View>
                  </View>
                  
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Clock size={12} color={theme.textSecondary} />
                      <Text style={styles.metaText}>{block.startTime} - {block.endTime}</Text>
                    </View>
                    {block.room && (
                      <View style={styles.metaItem}>
                        <MapPin size={12} color={theme.textSecondary} />
                        <Text style={styles.metaText}>{block.room}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <ChevronRight size={18} color={theme.textSecondary} />
              </MatteCard>
            </MotiView>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </CleanBackground>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, gap: 15 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
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
  daySelectorWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  daySelector: {
    paddingHorizontal: 20,
    gap: 12,
  },
  dayItem: {
    width: 60,
    height: 45,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  dayItemSelected: {
    backgroundColor: 'transparent',
  },
  daySelectedBg: {
    borderRadius: 15,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  dayTextSelected: {
    color: '#fff',
  },
  glassBase: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    marginTop: 40,
    ...Shadows.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.text,
    marginBottom: 5,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 15,
  },
  timeWrapper: {
    width: 50,
    alignItems: 'center',
    paddingTop: 10,
  },
  startTime: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 8,
  },
  timeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
  timeLine: {
    flex: 1,
    width: 2,
    marginTop: -5,
  },
  classCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 25,
    ...Shadows.sm,
  },
  classInfo: {
    flex: 1,
    gap: 8,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
    flex: 1,
  },
  colorBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
  },
});
