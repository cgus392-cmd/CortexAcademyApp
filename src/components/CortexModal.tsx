import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { X, Check, Calendar, StickyNote, BookOpen, Trash2 } from 'lucide-react-native';
// import { BlurView } from 'expo-blur'; // Removing to fix native ViewManager error
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { Radius, Shadows, Spacing } from '../constants/theme';
import { useData } from '../context/DataContext';

const { width, height } = Dimensions.get('window');

export type ModalType = 'task' | 'memo' | null;

interface CortexModalProps {
  isVisible: boolean;
  type: ModalType;
  initialData?: any;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
}

const MEMO_COLORS = [
  '#06B6D4', // Cyan
  '#34D399', // Esmeralda
  '#A78BFA', // Violeta
  '#FB7185', // Neon Rose
  '#F59E0B', // Academic Gold
  '#3B82F6', // Blue
];

export default function CortexModal({ isVisible, type, initialData, onClose, onSave, onDelete }: CortexModalProps) {
  const { theme } = useTheme();
  const { courses } = useData();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(courses.length > 0 ? courses[0].id : 1);
  const [date, setDate] = useState(new Date());
  const [color, setColor] = useState('#06B6D4');
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setTitle(initialData?.text || initialData?.title || '');
      setDescription(initialData?.description || '');
      setSelectedCourse(initialData?.courseId || (courses.length > 0 ? courses[0].id : 1));
      setDate(initialData?.date ? new Date(initialData.date) : new Date());
      setColor(initialData?.color || '#06B6D4');
    }
  }, [isVisible, initialData]);

  if (!type) return null;

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({ 
      id: initialData?.id,
      title, 
      description, 
      selectedCourse, 
      date: date.toISOString(), 
      color,
      type 
    });
    onClose();
    setTitle('');
    setDescription('');
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar Item",
      "¿Estás seguro de que quieres borrar esto? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: () => {
            if (onDelete && initialData?.id) {
              onDelete(initialData.id);
              onClose();
            }
          }
        }
      ]
    );
  };

  const isTask = type === 'task';
  const isEditing = !!initialData;

  return (
    <AnimatePresence>
      {isVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Backdrop Glass Fallback (Robust) */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={[StyleSheet.absoluteFill, styles.backdrop]}
          >
            <TouchableOpacity 
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} 
                onPress={onClose} 
                activeOpacity={1} 
            />
          </MotiView>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
            pointerEvents="box-none"
          >
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 150 }}
              style={styles.modalWrapper}
            >
              <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                {/* Glass Background Overlay */}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.glassBase, borderRadius: Radius.xxl }]} />
                <View style={[StyleSheet.absoluteFill, { borderRadius: Radius.xxl, borderWidth: 1.5, borderColor: theme.glassBorder }]} />
                
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerTitleRow}>
                    <View style={[styles.iconBox, { backgroundColor: isTask ? theme.primary + '20' : color + '20' }]}>
                      {isTask ? (
                        <Calendar size={20} color={theme.primary} />
                      ) : (
                        <StickyNote size={20} color={color} />
                      )}
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>
                      {isEditing ? `Editar ${isTask ? 'Tarea' : 'Memo'}` : `Nuevo ${isTask ? 'Tarea' : 'Memo'}`}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {isEditing && (
                      <TouchableOpacity onPress={handleDelete} style={[styles.closeBtn, { backgroundColor: theme.error + '15' }]}>
                        <Trash2 size={18} color={theme.error} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                      <X size={24} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Form */}
                <View style={styles.form}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Título</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: theme.bg, borderColor: theme.border }]}
                    placeholder={isTask ? "Ej: Entregar Lab 3" : "Ej: Idea para proyecto..."}
                    placeholderTextColor={theme.textMuted}
                    value={title}
                    onChangeText={setTitle}
                  />

                  {isTask && (
                    <>
                      <Text style={[styles.label, { color: theme.textSecondary }]}>Fecha de Entrega</Text>
                      <TouchableOpacity
                        style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.border, justifyContent: 'center', marginBottom: 12 }]}
                        onPress={() => setShowPicker(true)}
                      >
                         <Text style={{ color: theme.text }}>{date.toLocaleDateString()}</Text>
                      </TouchableOpacity>
                      {showPicker && (
                        <DateTimePicker
                          value={date}
                          mode="date"
                          display="default"
                          onChange={(event: any, selectedDate?: Date) => {
                            setShowPicker(false);
                            if (selectedDate) setDate(selectedDate);
                          }}
                        />
                      )}

                      <Text style={[styles.label, { color: theme.textSecondary }]}>Materia</Text>
                      <View style={styles.courseScroll}>
                        {courses.slice(0, 4).map((course: any) => (
                          <TouchableOpacity
                            key={course.id}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedCourse(course.id);
                            }}
                            style={[
                              styles.coursePill,
                              { backgroundColor: theme.bg, borderColor: theme.border },
                              selectedCourse === course.id && { backgroundColor: course.color + '20', borderColor: course.color }
                            ]}
                          >
                            <View style={[styles.dot, { backgroundColor: course.color }]} />
                            <Text style={[styles.coursePillText, { color: theme.textSecondary }, selectedCourse === course.id && { color: course.color }]}>
                              {course.code}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

                  {!isTask && (
                    <>
                      <Text style={[styles.label, { color: theme.textSecondary }]}>Color</Text>
                      <View style={styles.colorRow}>
                        {MEMO_COLORS.map((c) => (
                          <TouchableOpacity
                            key={c}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setColor(c);
                            }}
                            style={[
                              styles.colorCircle,
                              { backgroundColor: c },
                              color === c && { borderWidth: 2, borderColor: theme.text }
                            ]}
                          >
                            {color === c && <Check size={12} color="#FFF" />}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

                  <Text style={[styles.label, { color: theme.textSecondary }]}>Descripción</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.bg, borderColor: theme.border }]}
                    placeholder="Escribe los detalles aquí..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    numberOfLines={4}
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  style={styles.saveBtn}
                  activeOpacity={0.8}
                  onPress={handleSave}
                >
                  <LinearGradient
                    colors={[
                      (isTask ? theme.primary : color) || '#06B6D4', 
                      (isTask ? theme.primaryDark : color) || '#06B6D4'
                    ]}
                    style={styles.saveBtnGradient}
                  >
                    <Check size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>
                      {isEditing ? 'Guardar Cambios' : (isTask ? 'Crear Tarea' : 'Guardar Memo')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </MotiView>
          </KeyboardAvoidingView>
        </View>
      )}
    </AnimatePresence>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWrapper: {
    width: width,
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: Radius.xxl,
    padding: 24,
    ...Shadows.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  input: {
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  coursePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  coursePillText: {
    fontSize: 12,
    fontWeight: '900',
  },
  saveBtn: {
    marginTop: 24,
    height: 56,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  saveBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
