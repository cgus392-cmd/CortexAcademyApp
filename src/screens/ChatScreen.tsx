import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Linking,
  Alert,
  TextInput,
  Modal,
  Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { 
  Folder, 
  Link as LinkIcon, 
  Video, 
  Image as ImageIcon, 
  FileText,
  ChevronRight,
  Plus,
  Monitor,
  ExternalLink,
  BookOpen,
  Trash2,
  Edit3,
  Tag,
  X,
  FileUp,
  Globe
} from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Colors, Spacing, Radius } from '../constants/theme';
import CleanBackground from '../components/CleanBackground';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import FocusTransition from '../components/FocusTransition';
import { 
  MatteCard, 
  MatteUnderlay, 
  MatteIconButton 
} from '../components/design-system/CortexMatte';
import { NexusService, LocalResource } from '../services/NexusService';

const { width, height } = Dimensions.get('window');

const RESOURCE_TYPES = [
  { id: 'all', label: 'Todo', icon: Folder },
  { id: 'link', label: 'Links', icon: LinkIcon },
  { id: 'video', label: 'Videos', icon: Video },
  { id: 'photo', label: 'Fotos', icon: ImageIcon },
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { courses, nexusResources, addNexusResource, deleteNexusResource, updateNexusResource } = useData();
  const [activeType, setActiveType] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  // Modal State
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formType, setFormType] = useState<'video' | 'link' | 'photo' | 'file'>('link');
  const [formCourseId, setFormCourseId] = useState(courses[0]?.id || '');

  // Context Menu State
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedResource, setSelectedResource] = useState<LocalResource | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const styles = getStyles(theme);

  React.useEffect(() => {
    NexusService.initialize();
  }, []);

  const filteredResources = nexusResources.filter((r: LocalResource) => {
    const matchesType = activeType === 'all' || r.type === activeType;
    const matchesCourse = !selectedCourseId || r.courseId === selectedCourseId;
    return matchesType && matchesCourse;
  });

  const handleAddResource = async () => {
    if (!formTitle.trim()) {
        Alert.alert('Error', 'Por favor ingresa un título');
        return;
    }

    setIsLoading(true);
    try {
        let finalUri = formUrl;
        let fileName = '';
        let fileSize = 0;

        if (formType === 'photo') {
            const picked = await NexusService.pickImage();
            if (!picked) { setIsLoading(false); return; }
            finalUri = picked.uri;
            fileName = picked.fileName;
            fileSize = picked.fileSize || 0;
        } else if (formType === 'file') {
            const picked = await NexusService.pickDocument();
            if (!picked) { setIsLoading(false); return; }
            finalUri = picked.uri;
            fileName = picked.fileName;
            fileSize = picked.fileSize || 0;
        }

        const newRes: LocalResource = {
            id: Date.now().toString(),
            title: formTitle,
            type: formType,
            uri: finalUri,
            courseId: formCourseId,
            date: new Date().toLocaleDateString(),
            fileName,
            fileSize
        };

        await addNexusResource(newRes);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsAddModalVisible(false);
        resetForm();
    } catch (error) {
        console.error(error);
        Alert.alert('Error', 'No se pudo guardar el recurso');
    } finally {
        setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormUrl('');
    setFormType('link');
    setFormCourseId(courses[0]?.id || '');
  };

  const handleOpenResource = async (res: LocalResource) => {
    try {
        if (res.uri.startsWith('http') || res.uri.startsWith('https')) {
            await Linking.openURL(res.uri);
        } else {
            // Compartir o abrir archivo local
            // Por ahora solo logging para desarrollo
            console.log('Abriendo archivo local:', res.uri);
            Alert.alert('Recurso Local', `Este archivo está guardado en: ${res.uri}`);
        }
    } catch (e) {
        Alert.alert('Error', 'No se puede abrir el recurso');
    }
  };

  const showContextMenu = (res: LocalResource, event: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedResource(res);
    setMenuVisible(true);
    // En una app real usaríamos measure para posición exacta, 
    // pero por simplicidad de la demo centramos o usamos el evento
  };

  const handleDelete = async () => {
    if (!selectedResource) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
        'Eliminar Recurso',
        `¿Estás seguro de que quieres eliminar "${selectedResource.title}"?`,
        [
            { text: 'Cancelar', style: 'cancel' },
            { 
                text: 'Eliminar', 
                style: 'destructive',
                onPress: async () => {
                   await deleteNexusResource(selectedResource.id);
                   await NexusService.deleteFile(selectedResource.uri);
                   setMenuVisible(false);
                }
            }
        ]
    );
  };

  return (
    <CleanBackground shadowOpacity={0.95}>
      <FocusTransition>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={{ 
            paddingTop: insets.top + (Platform.OS === 'ios' ? 10 : 20),
            paddingBottom: insets.bottom + 120 
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Nexus</Text>
              <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Centro de Recursos Académicos</Text>
            </View>
            <MatteIconButton 
              icon={Plus} 
              size={44} 
              radius={22} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsAddModalVisible(true);
              }} 
              tint={theme.primary + '15'}
            />
          </View>

          {/* Web OS Promotion Banner */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <MatteCard radius={28} style={styles.webBanner}>
              <View style={styles.webBannerContent}>
                <View style={styles.webIconContainer}>
                   <Monitor size={32} color={theme.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={[styles.webTitle, { color: theme.text }]}>Cortex Web OS 3.1</Text>
                  <Text style={[styles.webDesc, { color: theme.textSecondary }]}>
                    Accede a la experiencia de investigación avanzada completa desde tu computadora.
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.webCTA}
                onPress={() => Linking.openURL('https://cortexwebacademy.com')}
              >
                <MatteUnderlay radius={16} />
                <Text style={[styles.webCTAText, { color: theme.primary }]}>Ir a la Web</Text>
                <ExternalLink size={14} color={theme.primary} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </MatteCard>
          </MotiView>

          {/* Type Filters */}
          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
              {RESOURCE_TYPES.map((type) => {
                const isActive = activeType === type.id;
                const Icon = type.icon;
                return (
                  <TouchableOpacity 
                    key={type.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setActiveType(type.id);
                    }}
                    style={[
                      styles.filterChip, 
                      isActive && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                  >
                    <Icon size={14} color={isActive ? '#FFF' : theme.textSecondary} />
                    <Text style={[styles.filterLabel, { color: isActive ? '#FFF' : theme.textSecondary }]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Course Filters */}
          <View style={styles.courseSelect}>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
                <TouchableOpacity 
                  onPress={() => setSelectedCourseId(null)}
                  style={[styles.courseChip, !selectedCourseId && styles.courseChipActive]}
                >
                  <Text style={[styles.courseLabel, !selectedCourseId && { color: theme.primary }]}>Todas las Materias</Text>
                </TouchableOpacity>
                {courses.map((course: any) => (
                  <TouchableOpacity 
                    key={course.id} 
                    onPress={() => setSelectedCourseId(course.id)}
                    style={[styles.courseChip, selectedCourseId === course.id && styles.courseChipActive]}
                  >
                    <Text style={[styles.courseLabel, selectedCourseId === course.id && { color: theme.primary }]}>
                      {course.name}
                    </Text>
                  </TouchableOpacity>
                ))}
             </ScrollView>
          </View>

          {/* Resources Grid/List */}
          <View style={styles.resourcesSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Tus Archivos</Text>
            <AnimatePresence>
              {filteredResources.length > 0 ? (
                 <View style={styles.resourcesGrid}>
                    {filteredResources.map((res: LocalResource, i: number) => (
                      <MotiView
                        key={res.id}
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 50 }}
                        style={styles.resourceCardWrapper}
                      >
                        <TouchableOpacity 
                            onPress={() => handleOpenResource(res)}
                            onLongPress={(e) => showContextMenu(res, e)}
                            delayLongPress={500}
                            activeOpacity={0.7}
                        >
                            <MatteCard radius={24} style={styles.resourceCard}>
                                <View style={[styles.resourceIcon, { backgroundColor: theme.primary + '10' }]}>
                                {res.type === 'link' && <LinkIcon size={20} color={theme.primary} />}
                                {res.type === 'video' && <Video size={20} color={theme.primary} />}
                                {res.type === 'photo' && <ImageIcon size={20} color={theme.primary} />}
                                {res.type === 'file' && <FileText size={20} color={theme.primary} />}
                                </View>
                                <View style={{ flex: 1 }}>
                                <Text style={[styles.resourceTitle, { color: theme.text }]} numberOfLines={1}>{res.title}</Text>
                                <View style={styles.resourceMetaRow}>
                                    <Text style={[styles.resourceMeta, { color: theme.textSecondary }]}>{res.date}</Text>
                                    <View style={styles.dotSeparator} />
                                    <Text style={[styles.resourceMeta, { color: theme.textSecondary }]}>
                                        {courses.find((c: any) => c.id === res.courseId)?.name || 'Sin Materia'}
                                    </Text>
                                </View>
                                </View>
                                <ChevronRight size={16} color={theme.textMuted} />
                            </MatteCard>
                        </TouchableOpacity>
                      </MotiView>
                    ))}
                 </View>
              ) : (
                <MotiView 
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={styles.emptyContainer}
                >
                  <BookOpen size={48} color={theme.textMuted} />
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>No hay recursos guardados todavía.</Text>
                  <TouchableOpacity 
                    style={[styles.addFirstBtn, { backgroundColor: theme.primary + '10' }]}
                    onPress={() => setIsAddModalVisible(true)}
                  >
                    <Text style={{ color: theme.primary, fontWeight: '700' }}>Agregar el primero</Text>
                  </TouchableOpacity>
                </MotiView>
              )}
            </AnimatePresence>
          </View>
        </ScrollView>

        {/* --- ADD RESOURCE MODAL --- */}
        <Modal
          visible={isAddModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsAddModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsAddModalVisible(false)} />
            <MotiView 
                from={{ translateY: 100, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                style={styles.modalContent}
            >
              <MatteUnderlay radius={32} baseColor={theme.isDark ? 'rgba(30,30,35,0.98)' : 'rgba(255,255,255,0.98)'} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Nuevo Recurso</Text>
                <TouchableOpacity onPress={() => setIsAddModalVisible(false)} style={styles.closeBtn}>
                  <X size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Título</Text>
                <TextInput 
                    style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceElevated }]}
                    placeholder="Ej. PDF de Termodinámica"
                    placeholderTextColor={theme.textMuted}
                    value={formTitle}
                    onChangeText={setFormTitle}
                />

                <Text style={styles.inputLabel}>Tipo de Recurso</Text>
                <View style={styles.typeSelector}>
                    {(['link', 'video', 'photo', 'file'] as const).map((t) => (
                        <TouchableOpacity 
                            key={t}
                            onPress={() => setFormType(t)}
                            style={[
                                styles.typeOption, 
                                formType === t && { backgroundColor: theme.primary, borderColor: theme.primary }
                            ]}
                        >
                            {t === 'link' && <LinkIcon size={18} color={formType === t ? '#FFF' : theme.textSecondary} />}
                            {t === 'video' && <Video size={18} color={formType === t ? '#FFF' : theme.textSecondary} />}
                            {t === 'photo' && <ImageIcon size={18} color={formType === t ? '#FFF' : theme.textSecondary} />}
                            {t === 'file' && <FileUp size={18} color={formType === t ? '#FFF' : theme.textSecondary} />}
                            <Text style={[styles.typeOptionText, { color: formType === t ? '#FFF' : theme.textSecondary }]}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {(formType === 'link' || formType === 'video') && (
                    <>
                        <Text style={styles.inputLabel}>Enlace (URL)</Text>
                        <TextInput 
                            style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceElevated }]}
                            placeholder="https://..."
                            placeholderTextColor={theme.textMuted}
                            value={formUrl}
                            onChangeText={setFormUrl}
                            autoCapitalize="none"
                        />
                    </>
                )}

                <Text style={styles.inputLabel}>Materia</Text>
                <View style={styles.coursePicker}>
                    {courses.map((c: any) => (
                        <TouchableOpacity 
                            key={c.id}
                            onPress={() => setFormCourseId(c.id)}
                            style={[
                                styles.coursePickerItem,
                                formCourseId === c.id ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border }
                            ]}
                        >
                            <Text style={[styles.coursePickerText, { color: formCourseId === c.id ? '#FFF' : theme.textSecondary }]}>
                                {c.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity 
                    style={[styles.saveBtn, { backgroundColor: theme.primary }, isLoading && { opacity: 0.7 }]}
                    onPress={handleAddResource}
                    disabled={isLoading}
                >
                    <LinearGradient 
                        colors={[theme.primary, theme.primaryDark || theme.primary]} 
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    <Text style={styles.saveBtnText}>
                        {isLoading ? 'GUARDANDO...' : (formType === 'photo' || formType === 'file' ? 'SELECCIONAR Y GUARDAR' : 'GUARDAR RECURSO')}
                    </Text>
                </TouchableOpacity>
              </ScrollView>
            </MotiView>
          </View>
        </Modal>

        {/* --- CONTEXT MENU --- */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
            <MotiView 
                from={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={[styles.menuContent, { backgroundColor: theme.surfaceElevated }]}
            >
              <View style={styles.menuHeader}>
                <Text style={[styles.menuTitle, { color: theme.text }]} numberOfLines={1}>
                    {selectedResource?.title}
                </Text>
              </View>
              
              <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
                <Edit3 size={18} color={theme.text} />
                <Text style={[styles.menuItemText, { color: theme.text }]}>Renombrar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
                <Tag size={18} color={theme.text} />
                <Text style={[styles.menuItemText, { color: theme.text }]}>Etiquetar</Text>
              </TouchableOpacity>

              <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

              <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                <Trash2 size={18} color={theme.error} />
                <Text style={[styles.menuItemText, { color: theme.error }]}>Eliminar</Text>
              </TouchableOpacity>
            </MotiView>
          </Pressable>
        </Modal>

      </FocusTransition>
    </CleanBackground>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
    marginTop: 2,
  },
  webBanner: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  webBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  webIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: theme.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  webDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 4,
  },
  webCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.primary + '20',
  },
  webCTAText: {
    fontSize: 14,
    fontWeight: '800',
  },
  filterSection: {
    marginTop: 24,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  courseSelect: {
    marginTop: 12,
  },
  courseChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  courseChipActive: {
    backgroundColor: theme.primary + '15',
  },
  courseLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  resourcesSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  resourcesGrid: {
    gap: 12,
  },
  resourceCardWrapper: {
    width: '100%',
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  resourceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cloudBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.success || '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  resourceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  resourceMeta: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.5,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.textMuted,
    marginHorizontal: 6,
    opacity: 0.3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  addFirstBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.surfaceLow || '#121212',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 10,
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.8,
  },
  input: {
    height: 56,
    borderRadius: 18,
    paddingHorizontal: 18,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 8,
    minWidth: '48%',
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  coursePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  coursePickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  coursePickerText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  saveBtn: {
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
    overflow: 'hidden',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  // Menu Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  menuContent: {
    width: '80%',
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  menuHeader: {
    padding: 12,
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '800',
    opacity: 0.8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
    opacity: 0.2,
  }
});
