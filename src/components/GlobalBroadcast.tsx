import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal, TouchableOpacity } from 'react-native';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { MatteCard, MatteUnderlay } from './design-system/CortexMatte';
import { Bell, Info, AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MotiView, AnimatePresence } from 'moti';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const STORAGE_KEY = 'CORTEX_DISMISSED_ANNOUNCEMENTS';

export default function GlobalBroadcast() {
    const { userProfile, globalConfig, addNotification, notifications } = useData();
    const { theme } = useTheme();
    const [isVisible, setIsVisible] = useState(false);
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);

    const announcement = globalConfig?.announcement;

    // 1. Load dismissed announcements from storage
    useEffect(() => {
        const loadDismissed = async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored) {
                    setDismissedIds(JSON.parse(stored));
                }
            } catch (e) {
                console.error('Error loading dismissed announcements:', e);
            }
        };
        loadDismissed();
    }, []);

    // 2. Monitor new announcements
    useEffect(() => {
        if (announcement?.active && announcement.id) {
            // Filtrar por universidad si está definido
            const targetUniv = announcement.targetUniversity;
            const userUniv = userProfile?.university;
            
            if (targetUniv && targetUniv !== 'all' && targetUniv !== userUniv) {
                setIsVisible(false);
                return;
            }

            const isDismissed = dismissedIds.includes(announcement.id);
            if (!isDismissed) {
                setIsVisible(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                
                // Add to notification center if not already there
                const alreadyNotified = notifications.some(n => n.id === `announcement_${announcement.id}`);
                if (!alreadyNotified) {
                    addNotification({
                        title: announcement.title,
                        body: announcement.body,
                        type: announcement.type as any || 'info'
                    });
                }
            }
        } else {
            setIsVisible(false);
        }
    }, [announcement, dismissedIds, notifications, userProfile?.university]);

    const handleDismiss = async () => {
        if (!announcement?.id) return;
        
        setIsVisible(false);
        const newDismissed = [...dismissedIds, announcement.id];
        setDismissedIds(newDismissed);
        
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newDismissed));
        } catch (e) {
            console.error('Error saving dismissed announcement:', e);
        }
    };

    if (!isVisible || !announcement) return null;

    const getColor = () => {
        switch (announcement.type) {
            case 'warning': return '#FACC15'; // Yellow/Amber
            case 'success': return '#10B981'; // Emerald
            case 'error': return '#EF4444'; // Red
            default: return theme.primary;
        }
    };

    const getIcon = () => {
        const color = getColor();
        const iconSize = 34;
        const strokeWidth = 2.5;

        switch (announcement.type) {
            case 'warning': return <AlertTriangle size={iconSize} color={color} strokeWidth={strokeWidth} />;
            case 'success': return <CheckCircle2 size={iconSize} color={color} strokeWidth={strokeWidth} />;
            case 'error': return <XCircle size={iconSize} color={color} strokeWidth={strokeWidth} />;
            default: return <Bell size={iconSize} color={color} strokeWidth={strokeWidth} />;
        }
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="none"
            onRequestClose={handleDismiss}
        >
            <View style={styles.overlay}>
                <BlurView intensity={30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                
                <AnimatePresence>
                    {isVisible && (
                        <MotiView
                            from={{ opacity: 0, scale: 0.8, translateY: 40 }}
                            animate={{ opacity: 1, scale: 1, translateY: 0 }}
                            exit={{ opacity: 0, scale: 0.8, translateY: 40 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
                            style={styles.container}
                        >
                            <MatteCard 
                                radius={32} 
                                style={styles.card}
                                baseColor={theme.isDark ? '#1F1F23' : '#FFFFFF'}
                            >
                                <View style={styles.header}>
                                    <View style={[styles.iconBox, { backgroundColor: getColor() + '15' }]}>
                                        {getIcon()}
                                    </View>
                                    <View style={styles.headerTitleRow}>
                                        <Text style={[styles.badge, { color: getColor(), backgroundColor: getColor() + '10' }]}>
                                            SISTEMA
                                        </Text>
                                        <Text style={[styles.title, { color: theme.text }]}>
                                            {announcement.title}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={[styles.body, { color: theme.textSecondary }]}>
                                    {announcement.body}
                                </Text>

                                <TouchableOpacity 
                                    activeOpacity={0.8}
                                    onPress={handleDismiss}
                                    style={[styles.button, { backgroundColor: theme.primary }]}
                                >
                                    <Text style={styles.buttonText}>Entendido</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    onPress={handleDismiss}
                                    style={styles.closeBtn}
                                >
                                    <X size={20} color={theme.textMuted} />
                                </TouchableOpacity>
                            </MatteCard>
                        </MotiView>
                    )}
                </AnimatePresence>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 400,
    },
    card: {
        padding: 24,
        paddingTop: 32,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    headerTitleRow: {
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    badge: {
        fontSize: 10,
        fontWeight: '900',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 6,
        letterSpacing: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    body: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 28,
        paddingHorizontal: 10,
    },
    button: {
        width: '100%',
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    closeBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 8,
    }
});
