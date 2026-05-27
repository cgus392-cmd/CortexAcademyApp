import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Modal, 
    TouchableOpacity, 
    Animated,
    Easing,
    Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Mic, X, Loader } from 'lucide-react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { transcribeAudio, generateContextAwareText } from '../../services/gemini';
import { useData } from '../../context/DataContext';

interface CortexLiveModalProps {
    visible: boolean;
    onClose: () => void;
    onMessageGenerated: (userText: string, aiText: string) => void;
}

type LiveState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';

export default function CortexLiveModal({ visible, onClose, onMessageGenerated }: CortexLiveModalProps) {
    const { theme } = useTheme();
    const { userProfile, courses, tasks } = useData();
    const isDark = theme.isDark;
    const styles = getStyles(theme, isDark);

    const [currentState, setCurrentState] = useState<LiveState>('IDLE');
    const [transcript, setTranscript] = useState('');
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Inicializar Audio
    useEffect(() => {
        if (visible) {
            setCurrentState('IDLE');
            setTranscript('Toca el orbe para hablar');
            requestPermissions();
        } else {
            stopEverything();
        }
    }, [visible]);

    const requestPermissions = async () => {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
        } catch (error) {
            console.error("Audio permissions error", error);
        }
    };

    const stopEverything = async () => {
        if (recording) {
            await recording.stopAndUnloadAsync();
            setRecording(null);
        }
        Speech.stop();
        setCurrentState('IDLE');
        setTranscript('');
    };

    const startRecording = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Speech.stop();
            setCurrentState('LISTENING');
            setTranscript('Escuchando...');
            
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);

            // Iniciar pulso rápido
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.3, duration: 400, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
                ])
            ).start();

        } catch (err) {
            console.error('Failed to start recording', err);
            setCurrentState('IDLE');
        }
    };

    const stopRecordingAndProcess = async () => {
        try {
            if (!recording) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            pulseAnim.stopAnimation();
            Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
            
            setCurrentState('THINKING');
            setTranscript('Analizando voz...');
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

            if (uri) {
                // 1. Transcribir con Groq Whisper
                const text = await transcribeAudio(uri);
                if (!text.trim()) {
                    setTranscript('No se entendió el audio. Toca para reintentar.');
                    setCurrentState('IDLE');
                    return;
                }
                setTranscript(`"${text}"\n\nCortex está pensando...`);

                // 2. Generar respuesta con Llama 3 (o el motor activo)
                const contextData = { user: userProfile as any, courses, tasks, activeTab: 'Cortex Live' };
                const prompt = `Instrucción: Genera una respuesta corta, conversacional y fluida. Evita usar Markdown complejo, listas o ecuaciones porque esta respuesta será leída en voz alta por un sistema Text-to-Speech.\n\nUsuario dice: ${text}`;
                
                const responseText = await generateContextAwareText(prompt, contextData);
                
                // 3. Hablar y reportar
                setCurrentState('SPEAKING');
                setTranscript(responseText);
                onMessageGenerated(text, responseText); // Guarda en el historial de fondo
                
                Speech.speak(responseText, {
                    language: 'es-US',
                    pitch: 1.05,
                    rate: 0.95, // Un poco más lento para que suene menos apresurado
                    onDone: () => {
                        setCurrentState('IDLE');
                        setTranscript('Toca el orbe para responder');
                    },
                    onError: () => {
                        setCurrentState('IDLE');
                    }
                });

                // Pulso suave mientras habla
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
                    ])
                ).start();
            }
        } catch (error) {
            console.error(error);
            setTranscript('Error de conexión neuronal.');
            setCurrentState('IDLE');
        }
    };

    const handleOrbPress = () => {
        if (currentState === 'IDLE' || currentState === 'SPEAKING') {
            startRecording();
        } else if (currentState === 'LISTENING') {
            stopRecordingAndProcess();
        }
    };

    const handleClose = () => {
        stopEverything();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={handleClose}
        >
            <BlurView intensity={isDark ? 80 : 60} tint={isDark ? 'dark' : 'light'} style={styles.container}>
                {/* Header Actions */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                        <X size={28} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {/* Subtitles / Transcript */}
                <View style={styles.textContainer}>
                    <Text style={[styles.stateText, { color: theme.primary }]}>
                        {currentState === 'LISTENING' ? 'Escuchando' : currentState === 'THINKING' ? 'Procesando' : currentState === 'SPEAKING' ? 'Cortex' : 'Cortex Live'}
                    </Text>
                    <Text style={[styles.transcriptText, { color: theme.text }]} numberOfLines={6}>
                        {transcript}
                    </Text>
                </View>

                {/* Central Orb / Visualizer */}
                <View style={styles.orbContainer}>
                    <MotiView
                        from={{ scale: 1, opacity: 0.5 }}
                        animate={{ 
                            scale: currentState === 'LISTENING' ? [1, 1.5, 1] : currentState === 'SPEAKING' ? [1, 1.2, 1] : 1,
                            opacity: currentState === 'IDLE' ? 0 : 0.8
                        }}
                        transition={{
                            type: 'timing',
                            duration: currentState === 'LISTENING' ? 1000 : 1500,
                            loop: currentState !== 'IDLE' && currentState !== 'THINKING'
                        }}
                        style={[styles.glowRing, { backgroundColor: theme.primary }]}
                    />
                    
                    <TouchableOpacity 
                        activeOpacity={0.8} 
                        onPress={handleOrbPress}
                        disabled={currentState === 'THINKING'}
                    >
                        <Animated.View style={[styles.mainOrb, { backgroundColor: theme.primary, transform: [{ scale: pulseAnim }] }]}>
                            {currentState === 'THINKING' ? (
                                <Loader size={40} color="#FFF" />
                            ) : (
                                <Mic size={40} color="#FFF" />
                            )}
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                {/* Hint Text */}
                <Text style={[styles.hintText, { color: theme.textMuted }]}>
                    {currentState === 'IDLE' ? 'Toca para hablar' : currentState === 'LISTENING' ? 'Toca para enviar' : ''}
                </Text>
            </BlurView>
        </Modal>
    );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)',
        justifyContent: 'space-between',
        paddingVertical: 60,
    },
    header: {
        paddingHorizontal: 20,
        alignItems: 'flex-end',
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        paddingHorizontal: 30,
        alignItems: 'center',
        marginTop: 40,
    },
    stateText: {
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 16,
    },
    transcriptText: {
        fontSize: 28,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 38,
    },
    orbContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
    },
    glowRing: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        opacity: 0.3,
    },
    mainOrb: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    hintText: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 40,
    }
});
