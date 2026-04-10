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
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Send, Zap, Cpu, Brain, ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { auth, db } from '../services/firebase';
import { ChatMessage } from '../types';
import CleanBackground from '../components/CleanBackground';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { globalEmitter } from '../utils/EventEmitter';
import { generateContextAwareText } from '../services/gemini';
import FocusTransition from '../components/FocusTransition';
import { 
  MatteCard, 
  MatteUnderlay, 
  MatteChatBubble, 
  MatteFormula, 
  MatteIconButton 
} from '../components/design-system/CortexMatte';
import { MotiView } from 'moti';

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
  const [activeModel, setActiveModel] = useState<'flash' | 'pro'>(userProfile?.selectedModel === 'pro' ? 'pro' : 'flash');
  const [tabBarVisible, setTabBarVisible] = useState(false); 
  const listRef = useRef<FlatList>(null);
  const isDark = theme.isDark;
  const isPro = activeModel === 'pro';
  const styles = getStyles(theme, isDark);

  const toggleModel = () => {
    const nextModel = isPro ? 'flash' : 'pro';
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

  // listener para cambios manuales
  useEffect(() => {
    const unsubscribe = globalEmitter.on('toggleTabBar', (visible: boolean) => {
      setTabBarVisible(visible);
    });
    return () => unsubscribe();
  }, []);

  // ─── Load persisted chat history from Firestore ───
  useEffect(() => {
    const loadHistory = async () => {
      if (!auth.currentUser) return;
      try {
        const snap = await db.collection('users').doc(auth.currentUser.uid).get();
        if (snap.exists()) { 
            const data = snap.data() as { chatHistory?: ChatMessage[] };
          const saved = data?.chatHistory;
          if (Array.isArray(saved) && saved.length > 0) {
            setMessages(saved);
          }
        }
      } catch (e) {
        console.log("Error loading chat history:", e);
      }
    };
    loadHistory();
  }, []);

  const persistChat = async (msgs: ChatMessage[]) => {
    if (!auth.currentUser) return;
    try {
      const toSave = msgs.slice(-30);
      await db.collection('users').doc(auth.currentUser.uid).set({ chatHistory: toSave }, { merge: true });
    } catch (e) { /* Silent */ }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    const withUserMsg = [...messages, userMsg];
    setMessages(withUserMsg);
    setInputText('');
    setIsTyping(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const contextData = {
        user: userProfile as any,
        courses: courses,
        tasks: tasks,
        activeTab: 'Nexus AI'
      };
      const conversationHistory = messages.slice(-5).map(m => `${m.role === 'user' ? 'Estudiante' : 'Cortex'}: ${m.content}`).join('\n');
      const prompt = `Historial de conversación reciente:\n${conversationHistory}\n\nEstudiante: ${text.trim()}\nResponde directamente al estudiante. IMPORTANTE: Si mencionas una ecuación o fórmula matemática (ej: Teorema de Pitágoras, Newton, etc.), escríbela EXACTAMENTE entre símbolos $$ (ejemplo: $$a^2 + b^2 = c^2$$) para que mi motor de renderizado LaTeX pueda procesarla profesionalmente.`;
      
      const aiResponseText = await generateContextAwareText(prompt, contextData);
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date().toISOString(),
      };
      const finalMsgs = [...withUserMsg, aiMsg];
      setMessages(finalMsgs);
      persistChat(finalMsgs);
    } catch (error) {
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

  const renderContentWithFormulas = (content: string) => {
    const parts = content.split(/(\$\$.*?\$\$)/g);
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.substring(2, part.length - 2);
        return <MatteFormula key={index} formula={formula} color={theme.primary} />;
      }
      return <Text key={index} style={{ color: theme.text, fontSize: 15, lineHeight: 22 }}>{part}</Text>;
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (<View style={[styles.messageRow, isUser && styles.messageRowUser]}><MatteChatBubble role={item.role}>{isUser ? (<Text style={{ color: '#FFF', fontSize: 15, fontWeight: '600' }}>{item.content || ""}</Text>) : (<View style={{ gap: 4 }}>{renderContentWithFormulas(item.content || "")}</View>)}</MatteChatBubble></View>);
  };

  return (
    <CleanBackground shadowOpacity={0.9}>
      <FocusTransition>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Cortex IA</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.statusDot, { backgroundColor: isTyping ? '#10B981' : theme.primary }]} />
                  <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{isTyping ? 'Pensando...' : 'En línea (v3.1)'}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={toggleModel}
              activeOpacity={0.7}
              style={[styles.modelToggle, { borderColor: isPro ? '#F59E0B40' : theme.primary + '40' }]}
            >
              <MatteUnderlay radius={22} />
              <View style={[styles.modelIndicator, { backgroundColor: isPro ? '#F59E0B' : theme.primary }]}>
                  {isPro ? <Cpu size={14} color="#000" /> : <Zap size={14} color="#FFF" />}
              </View>
              <Text style={[styles.modelLabel, { color: theme.text }]}>
                {activeModel.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={[styles.messagesList, { 
              paddingTop: 10,
              paddingBottom: tabBarVisible ? 320 : 220 
            }]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={isTyping ? (<MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} style={styles.typingContainer}><ActivityIndicator size="small" color={theme.primary} /><Text style={styles.typingText}>Cortex está pensando...</Text></MotiView>) : null}
          />
             <View style={[styles.bottomSection, { paddingBottom: insets.bottom + (tabBarVisible ? 90 : 20) }]}>
             <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]} />
             {(!!messages.length && messages.length < 10 && !isTyping) && (<View style={styles.suggestions}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsContent}>{QUICK_SUGGESTIONS.map((s, i) => (<TouchableOpacity key={i} onPress={() => sendMessage(s)} style={styles.suggestionChip}><Text style={[styles.suggestionText, { color: theme.textSecondary }]}>{s}</Text></TouchableOpacity>))}</ScrollView></View>)}
              <View style={styles.inputWrapper}>
                <View style={[styles.inputContainer, { backgroundColor: isDark ? '#121212' : '#F5F5F5', borderColor: isDark ? '#2A2A2A' : '#E0E0E0' }]}>
                    <TextInput style={[styles.input, { color: theme.text }]} placeholder="Pregúntale a Cortex..." placeholderTextColor={theme.textMuted} value={inputText} onChangeText={setInputText} multiline />
                    <TouchableOpacity style={[styles.sendButton, { backgroundColor: inputText.trim() ? theme.primary : 'rgba(255,255,255,0.05)' }]} onPress={() => sendMessage(inputText)} disabled={!inputText.trim()}><Send size={18} color={inputText.trim() ? '#FFF' : theme.textMuted} /></TouchableOpacity>
                </View>
              </View>
          </View>

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
    marginBottom: 4,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  }
});
