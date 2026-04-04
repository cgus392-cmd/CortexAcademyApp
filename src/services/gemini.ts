// 🧠 CORTEX AI CORE - [SYSTEM ONLINE]
// Arquitectura: Google GenAI SDK (v1+)
// Migración Hacia: React Native (Expo)

import { GoogleGenAI, Modality } from "@google/genai";
import { User, Course, Task, ScheduleBlock } from "../types";

const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3.1-pro-preview';
const MODEL_LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025';

// API Key Hardcoded para máxima estabilidad en CortexWebOS
const API_KEY = "AIzaSyB3m3ZZ4iBxIh4xtq7niHiCmFoLZgvyB4U";

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SAFETY_SETTINGS = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

export const checkAiConnection = async (): Promise<'connected' | 'offline'> => {
    if (!API_KEY) return 'offline';
    try {
        await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: { parts: [{ text: "ping" }] }
        });
        console.log(`🔌 Cortex AI: Native Online (Key: ...${API_KEY.slice(-4)})`);
        return 'connected';
    } catch (error) {
        console.error("❌ Cortex AI RN: Error de conexión.", error);
        return 'offline';
    }
};

export const getApiKey = () => API_KEY;

export const generateText = async (prompt: string, sys?: string, model?: 'flash' | 'pro'): Promise<string> => {
    if (!API_KEY) return "";
    try {
        const response = await ai.models.generateContent({
            model: model === 'pro' ? MODEL_PRO : MODEL_FLASH,
            contents: { parts: [{ text: prompt }] },
            config: {
                systemInstruction: sys || "Eres un asistente académico avanzado integrado en Cortex Hub OS. Sé amable, exacto e inteligente.",
                temperature: 0.7
            }
        });
        return response.text || "";
    } catch (e) {
        console.error(e);
        return "";
    }
};

export const generateContextAwareText = async (
    prompt: string,
    contextData: { user: User, courses: Course[], tasks: Task[], activeTab: string },
    imageBase64?: string
): Promise<string> => {
    if (!API_KEY) return "Error crítico: No hay API Key configurada.";

    try {
        const contextString = `
        DATOS DEL USUARIO (Contexto App Nativa):
        - Nombre: ${contextData.user.name || "Usuario"}
        - Carrera: ${contextData.user.career || "No definida"}
        - Universidad: ${contextData.user.university || "No definida"}
        - Semestre: ${contextData.user.semester}
        - Materias: ${contextData.courses.map(c => `${c.name} (Promedio: ${c.average})`).join(', ')}
        - Tareas Pendientes: ${contextData.tasks.filter(t => !t.done).length}
        `;

        const systemInstruction = `Eres Cortex, un asistente académico experto.
        Tu objetivo es ayudar al estudiante a organizar su vida, entender sus materias y mejorar sus notas.
        Sé breve, directo y motivador. Usa emojis ocasionalmente.
        Responde basándote en el contexto académico proporcionado.`;

        let parts: any[] = [{ text: prompt }];

        if (imageBase64) {
            // Expected format strictly base64 string, assuming image/jpeg or png from React Native
            parts.unshift({
                inlineData: {
                    data: imageBase64,
                    mimeType: "image/jpeg"
                }
            });
        }

        const response = await ai.models.generateContent({
            model: contextData.user.selectedModel === 'pro' ? MODEL_PRO : MODEL_FLASH,
            contents: { parts: parts },
            config: {
                systemInstruction: systemInstruction + "\n" + contextString,
                temperature: 0.7,
                // @ts-ignore
                safetySettings: SAFETY_SETTINGS
            }
        });

        if (!response.text) {
            throw new Error("Respuesta vacía del modelo.");
        }

        return response.text;
    } catch (error: any) {
        console.error("AI Chat Error (Native):", error);
        
        const errorMsg = error?.message?.toLowerCase() || "";
        const isHighDemand = errorMsg.includes("503") || 
                            errorMsg.includes("high demand") || 
                            errorMsg.includes("unavailable") ||
                            errorMsg.includes("resource_exhausted");

        if (isHighDemand) {
            return "🚀 Mi núcleo está procesando demasiada información ahora mismo. Estamos optimizando mis circuitos para darte la mejor respuesta académica. ¡Dame un par de minutos para despejarme! ⚡";
        }

        return `⚠️ Error de Conexión: ${error.message || "Intenta de nuevo."}`;
    }
};

// NOTE: Gemini Live API implementation is currently heavily tied to window.AudioContext.
// In React Native, the native Audio primitives have to be handled via expo-av or similar tools.
// The Live API part is simplified until full webRTC integration is fully supported by React Native and Expo directly.
export const startLiveSession = async () => {
    console.warn('Gemini Live in React Native requires adapting web AudioContext to expo-av/react-native-webrtc. Temporarily unavailable.');
};
