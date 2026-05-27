import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { X, Check, BookOpen, User, Hash, Monitor, Building } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { Radius, Shadows, CourseColors } from '../../constants/theme';
import { resolveColor } from '../../context/DataContext';

const { width } = Dimensions.get('window');

interface AddCourseModalProps {
  isVisible: boolean;
  defaultSemester?: number;
  onClose: () => void;
  onSave: (courseData: any) => void;
}

export default function AddCourseModal({ isVisible, defaultSemester = 1, onClose, onSave }: AddCourseModalProps) {
  const { theme } = useTheme();
  
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState('3');
  const [professor, setProfessor] = useState('');
  const [modality, setModality] = useState<'presencial' | 'virtual'>('presencial');
  const [color, setColor] = useState(CourseColors[0]);

  // Reset form when opened
  React.useEffect(() => {
    if (isVisible) {
      setName('');
      setCode('');
      setCredits('3');
      setProfessor('');
      setModality('presencial');
      setColor(CourseColors[0]);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handleSave = () => {
    if (!name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Podríamos mostrar un toast de error, pero por ahora solo prevenimos el guardado
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      name: name.trim(),
      code: code.trim() || 'S/C',
      credits: parseInt(credits) || 3,
      professor: professor.trim() || 'Por asignar',
      modality,
      color,
      semester: defaultSemester,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Backdrop */}
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
              from={{ opacity: 0, scale: 0.95, translateY: 20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              exit={{ opacity: 0, scale: 0.95, translateY: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={styles.modalWrapper}
            >
              <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                {/* Glass Background Overlay */}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.glassBase, borderRadius: Radius.xxl }]} />
                <View style={[StyleSheet.absoluteFill, { borderRadius: Radius.xxl, borderWidth: 1.5, borderColor: theme.glassBorder }]} />
                
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerTitleRow}>
                    <View style={[styles.iconBox, { backgroundColor: theme.primary + '20' }]}>
                      <BookOpen size={20} color={theme.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>Nueva Materia</Text>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <X size={24} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Scrollable Form */}
                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    style={{ maxHeight: Dimensions.get('window').height * 0.6 }}
                >
                    <View style={styles.form}>
                        {/* Nombre y Código */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Nombre de la Materia *</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.bg, borderColor: theme.border }]}
                            placeholder="Ej: Matemáticas Discretas"
                            placeholderTextColor={theme.textMuted}
                            value={name}
                            onChangeText={setName}
                        />

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Código</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                    <Hash size={16} color={theme.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.inputInner, { color: theme.text }]}
                                        placeholder="Ej: MAT101"
                                        placeholderTextColor={theme.textMuted}
                                        value={code}
                                        onChangeText={setCode}
                                    />
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Créditos</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                    <TextInput
                                        style={[styles.inputInner, { color: theme.text, textAlign: 'center' }]}
                                        placeholder="3"
                                        placeholderTextColor={theme.textMuted}
                                        keyboardType="numeric"
                                        value={credits}
                                        onChangeText={setCredits}
                                        maxLength={2}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Profesor */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Profesor</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                            <User size={16} color={theme.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.inputInner, { color: theme.text }]}
                                placeholder="Nombre del Profesor"
                                placeholderTextColor={theme.textMuted}
                                value={professor}
                                onChangeText={setProfessor}
                            />
                        </View>

                        {/* Modalidad */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Modalidad</Text>
                        <View style={styles.modalityRow}>
                            <TouchableOpacity
                                style={[
                                    styles.modalityBtn,
                                    { backgroundColor: theme.bg, borderColor: theme.border },
                                    modality === 'presencial' && { backgroundColor: theme.primary + '15', borderColor: theme.primary }
                                ]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setModality('presencial');
                                }}
                            >
                                <Building size={16} color={modality === 'presencial' ? theme.primary : theme.textMuted} />
                                <Text style={[styles.modalityText, { color: modality === 'presencial' ? theme.primary : theme.textSecondary }]}>Presencial</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalityBtn,
                                    { backgroundColor: theme.bg, borderColor: theme.border },
                                    modality === 'virtual' && { backgroundColor: theme.primary + '15', borderColor: theme.primary }
                                ]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setModality('virtual');
                                }}
                            >
                                <Monitor size={16} color={modality === 'virtual' ? theme.primary : theme.textMuted} />
                                <Text style={[styles.modalityText, { color: modality === 'virtual' ? theme.primary : theme.textSecondary }]}>Virtual</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Color */}
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Color Identificador</Text>
                        <View style={styles.colorRow}>
                            {CourseColors.map((c) => (
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
                    </View>
                </ScrollView>

                {/* Action Button */}
                <TouchableOpacity
                  style={[styles.saveBtn, !name.trim() && { opacity: 0.5 }]}
                  activeOpacity={0.8}
                  onPress={handleSave}
                  disabled={!name.trim()}
                >
                  <LinearGradient
                    colors={[resolveColor(theme.primary), resolveColor(theme.primaryDark)]}
                    style={styles.saveBtnGradient}
                  >
                    <Check size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Crear Materia</Text>
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
    maxWidth: 500,
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
    marginBottom: 20,
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
    paddingBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
    marginTop: 6,
  },
  input: {
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    borderWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputInner: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  modalityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: 8,
  },
  modalityText: {
    fontSize: 14,
    fontWeight: '800',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    marginTop: 10,
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
