import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Send, Zap, Cpu, Brain, ChevronLeft, Settings, Square, Mic, Clock, Plus, MoreVertical } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { auth, db } from '../services/firebase';
import { ChatMessage } from '../types';
import CleanBackground from '../components/CleanBackground';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { globalEmitter } from '../utils/EventEmitter';
import { generateContextAwareText } from '../services/gemini';
import FocusTransition from '../components/FocusTransition';
import { CortexMatte, MatteCard, MatteHeader, MatteBadge, MatteNeuralContent, MatteChatBubble, MatteIconButton, MatteUnderlay, MatteBanner } from '../components/design-system/CortexMatte';
import { BlurView } from 'expo-blur';
import CortexLiveModal from '../components/modules/CortexLiveModal';
import CortexHistoryModal from '../components/modules/CortexHistoryModal';
import { getPrivacyStatus, setPrivacyStatus, getChatMessages, saveChatMessages, createChatSession, updateChatSessionTitle } from '../services/chatStorage';
import { generateChatTitle } from '../services/gemini';
import { Alert } from 'react-native';

const QUICK_SUGGESTIONS = [
  '¿Cuál es mi promedio?',
  '¿Qué debo estudiar hoy?',
  'Plan para subir mi nota',
  'Fórmulas de física',
];

export default function NexusScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { userProfile, courses, tasks, updateUserProfile } = useData();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeModel, setActiveModel] = useState<'flash' | 'pro' | '8b' | '70b'>(userProfile?.selectedModel || 'flash');
  const [tabBarVisible, setTabBarVisible] = useState(false); 
  const [isAnimating, setIsAnimating] = useState(false);
  const [forceStop, setForceStop] = useState(false);
  const [liveModalVisible, setLiveModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const listRef = useRef<FlatList>(null);
  const isDark = theme.isDark;
  const isPro = activeModel === 'pro';
  const styles = getStyles(theme, isDark);

  const toggleModel = () => {
    let nextModel: any = activeModel;
    if (userProfile?.aiProvider === 'meta') {
        nextModel = activeModel === '8b' ? '70b' : '8b';
    } else {
        nextModel = activeModel === 'pro' ? 'flash' : 'pro';
    }
    setActiveModel(nextModel);
    updateUserProfile({ selectedModel: nextModel });
    Haptics.selectionAsync();
  };

   // ─── Control de Inmersión Total (Ocultar Tab Bar) ───
  useFocusEffect(
    React.useCallback(() => {
      // Ocultar al entrar (Focus)
      globalEmitter.emit('toggleTabBar', false);
      setTabBarVisible(false);

      return () => {
        // Mostrar al salir (Blur)
        globalEmitter.emit('toggleTabBar', true);
      };
    }, [])
  );

  // listener para cambios manuales y borrado de historial
  useEffect(() => {
    const unsubscribe = globalEmitter.on('toggleTabBar', (visible: boolean) => {
      setTabBarVisible(visible);
    });
    return () => unsubscribe();
  }, []);

  // Escuchar si el historial se borra desde Settings
  useEffect(() => {
    if (userProfile?.chatHistory && userProfile.chatHistory.length === 0 && messages.length > 0) {
      setMessages([]);
    }
    
    // Actualizar modelo activo si cambia en el perfil
    if (userProfile?.selectedModel && userProfile.selectedModel !== activeModel) {
      setActiveModel(userProfile.selectedModel);
    }
  }, [userProfile?.chatHistory, userProfile?.selectedModel]);

  useEffect(() => {
    const initChat = async () => {
      const isAccepted = await getPrivacyStatus();
      setPrivacyAccepted(isAccepted);
      if (isAccepted) {
          const { getChatSessions } = require('../services/chatStorage');
          const sessions = await getChatSessions();
          
          if (sessions.length > 0) {
              const recent = sessions[0];
              const msgs = await getChatMessages(recent.id);
              setCurrentSessionId(recent.id);
              setMessages(msgs);
          } else {
              const newId = await createChatSession('Nuevo Chat');
              setCurrentSessionId(newId);
              setMessages([]);
          }
      }
    };
    initChat();
  }, []);

  const loadSession = async (sessionId: string) => {
      const msgs = await getChatMessages(sessionId);
      setCurrentSessionId(sessionId);
      setMessages(msgs);
  };

  const persistChat = async (msgs: ChatMessage[]) => {
    if (!currentSessionId) return;
    try {
      await saveChatMessages(currentSessionId, msgs);
    } catch (e) { /* Silent */ }
  };

  const sendMessage = async (text: string, bypassPrivacyCheck: boolean = false) => {
    if (!text.trim()) return;
    
    if (!privacyAccepted && !bypassPrivacyCheck) {
        Alert.alert(
            "Privacidad Local",
            "Cortex guarda todas tus conversaciones ESTRICTAMENTE en tu dispositivo para máxima privacidad. Si desinstalas la app, los chats se borrarán. ¿Aceptas estas condiciones?",
            [
                { text: "No, salir", style: "cancel" },
                { text: "Acepto", onPress: async () => {
                    await setPrivacyStatus(true);
                    setPrivacyAccepted(true);
                    const newId = await createChatSession('Nuevo Chat');
                    setCurrentSessionId(newId);
                    sendMessage(text, true);
                }}
            ]
        );
        return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    const withUserMsg = [...messages, userMsg];
    setMessages(withUserMsg);
    persistChat(withUserMsg); // PERSISTENCIA INMEDIATA
    setInputText('');
    setIsTyping(true);
    setForceStop(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    
    abortControllerRef.current = new AbortController();
    try {
      const contextData = {
        user: userProfile as any,
        courses: courses,
        tasks: tasks,
        activeTab: 'Nexus AI'
      };
      const conversationHistory = messages.slice(-5).map(m => `${m.role === 'user' ? 'Estudiante' : 'Cortex'}: ${m.content}`).join('\n');
      const prompt = `Historial de conversación reciente:\n${conversationHistory}\n\nEstudiante: ${text.trim()}\nResponde directamente al estudiante. IMPORTANTE: Si mencionas una ecuación o fórmula matemática (ej: Teorema de Pitágoras, Newton, etc.), escríbela EXACTAMENTE entre símbolos $$ (ejemplo: $$a^2 + b^2 = c^2$$) para que mi motor de renderizado LaTeX pueda procesarla profesionalmente.`;
      
      const aiResponseText = await generateContextAwareText(prompt, contextData, undefined, abortControllerRef.current.signal);
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date().toISOString(),
      };
      const finalMsgs = [...withUserMsg, aiMsg];
      setMessages(finalMsgs);
      persistChat(finalMsgs);
      setIsAnimating(true);

      // Generar título inteligente
      if (finalMsgs.length === 2 && finalMsgs[0].role === 'user') {
          generateChatTitle(finalMsgs[0].content).then(async (title) => {
              if (currentSessionId) {
                  await updateChatSessionTitle(currentSessionId, title);
              }
          });
      }
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log('Generación cancelada por el usuario');
            return;
        }
        setMessages(prev => [...prev, {
         id: `msg-err-${Date.now()}`,
         role: 'assistant',
         content: '⚠️ Error neuronal en mi núcleo. Por favor, reintenta la consulta.',
         timestamp: new Date().toISOString(),
       }]);
    } finally {
      setIsTyping(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleLiveMessageGenerated = (userText: string, aiText: string) => {
      const userMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: userText,
          timestamp: new Date().toISOString(),
      };
      const aiMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: aiText,
          timestamp: new Date().toISOString(),
      };
      const newHistory = [...messages, userMsg, aiMsg];
      setMessages(newHistory);
      persistChat(newHistory);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // MatteNeuralContent ahora maneja todo el renderizado enriquecido y animado en CortexMatte.tsx


  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const isDark = theme.isDark;
    const aiProvider = userProfile?.aiProvider || 'gemini';
    const photoURL = auth.currentUser?.photoURL;
    
    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
             <View style={[styles.aiAvatar, { backgroundColor: aiProvider === 'meta' ? '#10B981' : theme.primary }]}>
                {aiProvider === 'meta' ? <Cpu size={14} color="#FFF" /> : <Zap size={14} color="#FFF" />}
             </View>
          </View>
        )}
        
        <View style={{ flexShrink: 1, marginHorizontal: 8 }}>
            <MatteChatBubble role={item.role} rawTextForActions={item.content}>
            {isUser ? (
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '600' }}>{item.content || ""}</Text>
            ) : (
                <MatteNeuralContent 
                    content={item.content || ""} 
                    animate={messages[messages.length - 1]?.id === item.id} 
                    forceStop={forceStop}
                    onComplete={() => setIsAnimating(false)}
                />
            )}
            </MatteChatBubble>
        </View>

        {isUser && (
          <View style={styles.avatarContainer}>
            <View style={[styles.userAvatar, { backgroundColor: theme.primary + '30' }]}>
              {photoURL ? (
                <Image source={{ uri: photoURL }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarEmoji}>{userProfile?.avatarEmoji || '👤'}</Text>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => {
    const firstName = userProfile?.name?.split(' ')[0] || 'Cam';
    return (
      <View style={styles.emptyStateContainer}>
        <View style={[styles.emptyStateLogo, { backgroundColor: theme.primary + '15' }]}>
          <Brain size={44} color={theme.primary} />
        </View>
        <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Hola, {firstName}.</Text>
        
        <View style={styles.emptyStateSuggestions}>
          {QUICK_SUGGESTIONS.map((s, i) => (
            <TouchableOpacity 
              key={i} 
              style={[styles.emptyStateChip, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5', borderColor: isDark ? '#333' : '#E5E5E5' }]} 
              onPress={() => sendMessage(s)}
              activeOpacity={0.7}
            >
              <Square size={14} color={theme.textSecondary} style={{ marginRight: 10, opacity: 0.5 }} />
              <Text style={[styles.emptyStateChipText, { color: theme.text }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <CleanBackground shadowOpacity={0.9}>
      <FocusTransition>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 10 : 20) }]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 8 }}>
                <ChevronLeft size={28} color={theme.text} />
              </TouchableOpacity>
              <MatteIconButton 
                icon={Brain} 
                size={44} 
                radius={22} 
                onPress={() => {}} 
                tint={theme.primary + '15'}
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Nexus AI</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.statusDot, { backgroundColor: isTyping ? '#10B981' : theme.primary }]} />
                  <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{isTyping ? 'Pensando...' : 'En línea (v3.1)'}</Text>
                </View>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity 
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  const newId = await createChatSession('Nuevo Chat');
                  setCurrentSessionId(newId);
                  setMessages([]);
                }}
                activeOpacity={0.7}
                style={[styles.modelToggle, { width: 40, minWidth: 40, justifyContent: 'center', paddingRight: 0, paddingLeft: 0 }]}
              >
                <MatteUnderlay radius={20} />
                <Plus size={22} color={theme.text} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert(
                    "Opciones de Cortex",
                    "Elige una acción rápida",
                    [
                      { 
                        text: "Historial de Chats", 
                        onPress: () => setHistoryModalVisible(true) 
                      },
                      { 
                        text: "Ajustes de IA", 
                        onPress: () => navigation.navigate('Settings', { screen: 'SettingsMain', params: { view: 'ia' } }) 
                      },
                      { text: "Cancelar", style: "cancel" }
                    ]
                  );
                }}
                activeOpacity={0.7}
                style={[styles.modelToggle, { width: 40, minWidth: 40, justifyContent: 'center', paddingRight: 0, paddingLeft: 0 }]}
              >
                <MatteUnderlay radius={20} />
                <MoreVertical size={22} color={theme.text} />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={toggleModel}
                activeOpacity={0.7}
                style={[styles.modelToggle, { borderColor: isPro ? '#F59E0B40' : theme.primary + '40', paddingLeft: 6, paddingRight: 10 }]}
              >
                <MatteUnderlay radius={22} />
                <View style={[styles.modelIndicator, { backgroundColor: isPro ? '#F59E0B' : theme.primary, marginRight: 6 }]}>
                    {isPro ? <Cpu size={14} color="#000" /> : <Zap size={14} color="#FFF" />}
                </View>
                <Text style={[styles.modelLabel, { color: theme.text, fontSize: 12 }]}>
                  {userProfile?.aiProvider === 'meta' 
                    ? (activeModel === '70b' ? 'Llama 3.3' : 'Llama 3.1')
                    : activeModel.toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={[styles.messagesList, messages.length === 0 && { flexGrow: 1, justifyContent: 'center' }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={isTyping ? (<View style={[styles.typingContainer, { flexDirection: 'row', alignItems: 'center', padding: 10 }]}><ActivityIndicator size="small" color={theme.primary} /><Text style={[styles.typingText, { marginLeft: 8, color: theme.textSecondary, fontSize: 13, fontWeight: '600' }]}>Cortex está pensando...</Text></View>) : null}
          />
          <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 10 }]}>
             <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]} />
             {(messages.length > 0 && messages.length < 5 && !isTyping) && (
               <View style={styles.suggestions}>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsContent}>
                   {QUICK_SUGGESTIONS.map((s, i) => (
                     <TouchableOpacity key={i} onPress={() => sendMessage(s)} style={styles.suggestionChip}>
                       <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>{s}</Text>
                     </TouchableOpacity>
                   ))}
                 </ScrollView>
               </View>
             )}
              <View style={styles.inputWrapper}>
                <View style={[styles.inputContainer, { backgroundColor: isDark ? '#121212' : '#F5F5F5', borderColor: isDark ? '#2A2A2A' : '#E0E0E0' }]}>
                    <TextInput style={[styles.input, { color: theme.text }]} placeholder="Pregúntale a Cortex..." placeholderTextColor={theme.textMuted} value={inputText} onChangeText={setInputText} multiline editable={!isTyping} />
                    {(isTyping || isAnimating) ? (
                        <TouchableOpacity style={[styles.sendButton, { backgroundColor: '#FF3B30' }]} onPress={() => {
                            if (isTyping) {
                                abortControllerRef.current?.abort();
                                setIsTyping(false);
                            }
                            setForceStop(true);
                            setIsAnimating(false);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        }}>
                            <Square size={16} color="#FFF" fill="#FFF" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={[styles.sendButton, { backgroundColor: inputText.trim() ? theme.primary : 'rgba(255,255,255,0.05)' }]} onPress={() => sendMessage(inputText)} disabled={!inputText.trim()}><Send size={18} color={inputText.trim() ? '#FFF' : theme.textMuted} /></TouchableOpacity>
                    )}
                    
                    {/* Botón de Live Mode */}
                    {!(isTyping || isAnimating) && !inputText.trim() && (
                        <TouchableOpacity style={[styles.liveButton, { backgroundColor: 'rgba(255,255,255,0.08)', marginLeft: 8 }]} onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setLiveModalVisible(true);
                        }}>
                            <Mic size={20} color={theme.text} />
                        </TouchableOpacity>
                    )}
                </View>
              </View>
          </View>

          <CortexLiveModal 
              visible={liveModalVisible} 
              onClose={() => setLiveModalVisible(false)} 
              onMessageGenerated={handleLiveMessageGenerated} 
          />

          <CortexHistoryModal
              visible={historyModalVisible}
              onClose={() => setHistoryModalVisible(false)}
              onSelectSession={loadSession}
              currentSessionId={currentSessionId}
          />

          {/* Zona Segura para recuperar el TabBar */}
          {!tabBarVisible && (
            <TouchableOpacity 
               activeOpacity={1}
               style={styles.recoveryZone} 
               onPress={() => {
                  globalEmitter.emit('toggleTabBar', true);
               }}
            >
               <View style={styles.recoveryIndicator} />
            </TouchableOpacity>
          )}

        </KeyboardAvoidingView>
      </FocusTransition>
    </CleanBackground>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  modelToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    paddingRight: 12,
    borderRadius: 22,
    height: 44,
    minWidth: 80,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modelIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  modelLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  messagesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
    gap: 0, // Gaps managed manually for precision
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  avatarEmoji: {
    fontSize: 16,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  typingText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  bottomSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  suggestions: {
    maxHeight: 50,
    marginBottom: 10,
  },
  suggestionsContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 28,
    padding: 6,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    fontWeight: '500',
  },
   sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryZone: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
    zIndex: 999,
  },
  recoveryIndicator: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
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
  settingsSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.textMuted,
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  personalityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  personalityIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  personalityTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  personalityDesc: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateLogo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 40,
    textAlign: 'center',
  },
  emptyStateSuggestions: {
    width: '100%',
    paddingHorizontal: 10,
    gap: 12,
  },
  emptyStateChip: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyStateChipText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
