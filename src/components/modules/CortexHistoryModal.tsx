import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Plus, MessageSquare, Trash2, Clock } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { ChatSessionMetadata, getChatSessions, deleteChatSession, createChatSession } from '../../services/chatStorage';
import * as Haptics from 'expo-haptics';

interface CortexHistoryModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectSession: (sessionId: string) => void;
    currentSessionId: string | null;
}

export default function CortexHistoryModal({ visible, onClose, onSelectSession, currentSessionId }: CortexHistoryModalProps) {
    const { theme } = useTheme();
    const isDark = theme.isDark;
    const styles = getStyles(theme, isDark);
    const [sessions, setSessions] = useState<ChatSessionMetadata[]>([]);

    useEffect(() => {
        if (visible) {
            loadSessions();
        }
    }, [visible]);

    const loadSessions = async () => {
        const data = await getChatSessions();
        setSessions(data);
    };

    const handleNewChat = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newId = await createChatSession('Nuevo Chat');
        onSelectSession(newId);
        onClose();
    };

    const handleDelete = (id: string, title: string) => {
        Alert.alert(
            "Eliminar Chat",
            `¿Estás seguro de eliminar el historial de "${title}"? Esta acción no se puede deshacer.`,
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Eliminar", 
                    style: "destructive",
                    onPress: async () => {
                        await deleteChatSession(id);
                        await loadSessions();
                        if (currentSessionId === id) {
                            // Si se eliminó el chat actual, abrir uno nuevo automáticamente sin cerrar el modal
                            const newId = await createChatSession('Nuevo Chat');
                            onSelectSession(newId);
                            // No llamamos a onClose() para mantener el modal abierto
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: ChatSessionMetadata }) => {
        const isActive = item.id === currentSessionId;
        const date = new Date(item.updatedAt);
        const dateStr = date.toLocaleDateString() === new Date().toLocaleDateString() 
            ? `Hoy, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
            : date.toLocaleDateString();

        return (
            <TouchableOpacity 
                style={[styles.sessionItem, isActive && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderColor: theme.primary, borderWidth: 1 }]}
                onPress={() => {
                    onSelectSession(item.id);
                    onClose();
                }}
            >
                <View style={styles.sessionInfo}>
                    <View style={styles.titleRow}>
                        <MessageSquare size={16} color={isActive ? theme.primary : theme.text} />
                        <Text style={[styles.sessionTitle, { color: isActive ? theme.primary : theme.text }]} numberOfLines={1}>
                            {item.title}
                        </Text>
                    </View>
                    <View style={styles.dateRow}>
                        <Clock size={12} color={theme.textMuted} />
                        <Text style={[styles.sessionDate, { color: theme.textMuted }]}>{dateStr}</Text>
                    </View>
                </View>
                
                <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} style={styles.deleteBtn}>
                    <Trash2 size={18} color="#FF3B30" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <BlurView intensity={isDark ? 90 : 80} tint={isDark ? 'dark' : 'light'} style={styles.container}>
                <View style={[styles.content, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
                    <View style={styles.header}>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Historial de Chats</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={[styles.newChatBtn, { backgroundColor: theme.primary }]} onPress={handleNewChat}>
                        <Plus size={20} color="#FFF" />
                        <Text style={styles.newChatText}>Nuevo Chat</Text>
                    </TouchableOpacity>

                    <FlatList
                        data={sessions}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, { color: theme.textMuted }]}>No hay conversaciones guardadas.</Text>
                            </View>
                        }
                    />
                </View>
            </BlurView>
        </Modal>
    );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    content: {
        height: '80%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 5,
    },
    newChatBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 20,
    },
    newChatText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
    },
    sessionInfo: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    sessionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        flex: 1,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sessionDate: {
        fontSize: 12,
        marginLeft: 4,
    },
    deleteBtn: {
        padding: 10,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    }
});
