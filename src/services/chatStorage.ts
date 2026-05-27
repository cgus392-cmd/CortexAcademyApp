import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../types';

export interface ChatSessionMetadata {
    id: string;
    title: string;
    updatedAt: string;
}

const PRIVACY_KEY = '@cortex_privacy_accepted';
const SESSIONS_KEY = '@cortex_sessions';
const CHAT_PREFIX = '@cortex_chat_';

// --- PRIVACIDAD ---
export const getPrivacyStatus = async (): Promise<boolean> => {
    try {
        const val = await AsyncStorage.getItem(PRIVACY_KEY);
        return val === 'true';
    } catch (e) {
        return false;
    }
};

export const setPrivacyStatus = async (accepted: boolean): Promise<void> => {
    try {
        await AsyncStorage.setItem(PRIVACY_KEY, accepted ? 'true' : 'false');
    } catch (e) {}
};

// --- SESIONES DE CHAT ---
export const getChatSessions = async (): Promise<ChatSessionMetadata[]> => {
    try {
        const val = await AsyncStorage.getItem(SESSIONS_KEY);
        return val ? JSON.parse(val) : [];
    } catch (e) {
        return [];
    }
};

export const createChatSession = async (title: string = 'Nuevo Chat'): Promise<string> => {
    try {
        const sessions = await getChatSessions();
        const newSession: ChatSessionMetadata = {
            id: `session_${Date.now()}`,
            title,
            updatedAt: new Date().toISOString()
        };
        sessions.unshift(newSession); // Agregar al inicio
        await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
        return newSession.id;
    } catch (e) {
        return `session_${Date.now()}`;
    }
};

export const updateChatSessionTitle = async (sessionId: string, newTitle: string): Promise<void> => {
    try {
        const sessions = await getChatSessions();
        const idx = sessions.findIndex(s => s.id === sessionId);
        if (idx !== -1) {
            sessions[idx].title = newTitle;
            sessions[idx].updatedAt = new Date().toISOString();
            await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
        }
    } catch (e) {}
};

export const deleteChatSession = async (sessionId: string): Promise<void> => {
    try {
        const sessions = await getChatSessions();
        const filtered = sessions.filter(s => s.id !== sessionId);
        await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
        await AsyncStorage.removeItem(`${CHAT_PREFIX}${sessionId}`);
    } catch (e) {}
};

// --- MENSAJES DE CHAT ---
export const getChatMessages = async (sessionId: string): Promise<ChatMessage[]> => {
    try {
        const val = await AsyncStorage.getItem(`${CHAT_PREFIX}${sessionId}`);
        return val ? JSON.parse(val) : [];
    } catch (e) {
        return [];
    }
};

export const saveChatMessages = async (sessionId: string, messages: ChatMessage[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(`${CHAT_PREFIX}${sessionId}`, JSON.stringify(messages));
        
        // Actualizar el timestamp de la sesión
        const sessions = await getChatSessions();
        const idx = sessions.findIndex(s => s.id === sessionId);
        if (idx !== -1) {
            sessions[idx].updatedAt = new Date().toISOString();
            // Mover al principio porque es la más reciente
            const [moved] = sessions.splice(idx, 1);
            sessions.unshift(moved);
            await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
        }
    } catch (e) {}
};
