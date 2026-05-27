// 🧠 CORTEX AI CORE - [SYSTEM ONLINE]
// Arquitectura: Google GenAI SDK (v1+)
// Migración Hacia: React Native (Expo)

import { GoogleGenAI, Modality } from "@google/genai";
import { User, Course, Task, ScheduleBlock } from "../types";

const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3.1-pro-preview';
const MODEL_LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025';

// API Key de Gemini
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: API_KEY });

// API Key de Groq (Meta Llama 3) - Recuperada de CortexWebOS
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || "";

// Mapeo de Modelos
const META_MODELS = {
    '8b': 'llama-3.1-8b-instant',
    '70b': 'llama-3.3-70b-versatile'
};

const GEMINI_MODELS = {
    'flash': MODEL_FLASH,
    'pro': MODEL_PRO
};

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

export const generateText = async (prompt: string, sys?: string, model?: 'flash' | 'pro' | '8b' | '70b', provider: 'gemini' | 'meta' = 'gemini'): Promise<string> => {
    try {
        const systemInstruction = sys || "Eres un asistente académico avanzado integrado en Cortex Hub OS. Sé amable, exacto e inteligente. Usa Markdown y LaTeX para fórmulas.";
        
        if (provider === 'meta') {
            const modelId = META_MODELS[model as keyof typeof META_MODELS] || META_MODELS['8b'];
            console.log(`🧠 [Cortex Meta] Requesting ${modelId}...`);
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        { role: "system", content: systemInstruction },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7
                })
            });
            const data = await groqRes.json();
            return data.choices?.[0]?.message?.content || "";
        }

        if (!API_KEY) return "";
        console.log("🧠 [Cortex Google] Requesting Gemini...");
        const response = await ai.models.generateContent({
            model: model === 'pro' ? MODEL_PRO : MODEL_FLASH,
            contents: { parts: [{ text: prompt }] },
            config: {
                systemInstruction,
                temperature: 0.7
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("AI Text Error:", e);
        return "";
    }
};

export const generateContextAwareText = async (
    prompt: string,
    contextData: { user: User, courses: Course[], tasks: Task[], activeTab: string },
    imageBase64?: string,
    signal?: AbortSignal
): Promise<string> => {
    try {
        const globalAverage = contextData.courses.length > 0 
            ? (contextData.courses.reduce((acc, c) => acc + (parseFloat(c.average.toString()) || 0), 0) / contextData.courses.length).toFixed(2)
            : "0.0";

        const tasksDetail = contextData.tasks
            .filter(t => !t.done)
            .map(t => {
                const courseName = contextData.courses.find(c => c.id === t.courseId)?.name || 'General';
                return `- [${courseName}] ${t.text} (Prioridad: ${t.priority || 'Normal'})`;
            })
            .join('\n');

        const contextString = `
        DATOS ACADÉMICOS DEL ESTUDIANTE (TIENES ACCESO TOTAL):
        - Nombre: ${contextData.user.name || "Usuario"}
        - Carrera: ${contextData.user.career || "No definida"}
        - Universidad: ${contextData.user.university || "No definida"}
        - Semestre Actual: ${contextData.user.semester}
        - PROMEDIO GLOBAL: ${globalAverage} / 5.0
        
        DETALLE DE MATERIAS Y PROMEDIOS PARCIALES:
        ${contextData.courses.map(c => `- ${c.name}: Promedio actual ${c.average} (Código: ${c.id})`).join('\n')}
        
        TAREAS Y COMPROMISOS PENDIENTES:
        ${tasksDetail || "No hay tareas pendientes en este momento."}
        
        SISTEMA OPERATIVO: Cortex Hub OS v3.1 (Matte Design)
        `;

        let personalityInstruction = "Sé inteligente, equilibrado y analítico.";
        if (contextData.user.aiPersonality === 'friendly') {
            personalityInstruction = "Sé muy amistoso, cálido, motivador y usa bastantes emojis. Habla como un mentor cercano.";
        } else if (contextData.user.aiPersonality === 'technical') {
            personalityInstruction = "Usa un lenguaje altamente técnico, preciso, enfocado en datos, algoritmos y directo al punto. Evita rodeos.";
        } else if (contextData.user.aiPersonality === 'smart') {
            personalityInstruction = "Prioriza el razonamiento lógico, la eficiencia y soluciones ingeniosas a problemas complejos.";
        }

        const systemInstruction = `Eres Cortex, un asistente académico experto.
        Tu objetivo es ayudar al estudiante a organizar su vida, entender sus materias y mejorar sus notas.
        ${personalityInstruction} Usa Markdown para formatear tu respuesta. 
        REGLA MATEMÁTICA CRÍTICA: NO uses un solo signo de dólar ($) para fórmulas matemáticas en línea. Escribe las variables matemáticas o fórmulas pequeñas como texto normal legible. Únicamente usa \`$$\` (doble signo de dólar en bloque) para ecuaciones complejas, largas o que requieran notación matemática LaTeX avanzada.
        Responde basándote estrictamente en el contexto académico proporcionado.`;

        const userProvider = contextData.user.aiProvider || 'gemini';
        const userModel = contextData.user.selectedModel || 'flash';

        // Si es Meta (Groq) y NO hay imagen (Groq Llama 3 texto)
        if (userProvider === 'meta' && !imageBase64) {
            const modelId = META_MODELS[userModel as keyof typeof META_MODELS] || META_MODELS['8b'];
            console.log(`🧠 [Cortex Meta] Requesting ${modelId}...`);
            
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [
                        { role: "system", content: systemInstruction + "\n" + contextString },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7
                }),
                signal
            });
            const data = await groqRes.json();
            return data.choices?.[0]?.message?.content || "";
        }

        // Si usa Gemini o si tiene Imagen adjunta (Fallback visual)
        if (!API_KEY) return "Error crítico: No hay API Key de Google configurada y se solicitó motor visual.";

        console.log(`🧠 [Cortex Google] Requesting Gemini ${userModel}...`);
        let parts: any[] = [{ text: prompt }];
        if (imageBase64) {
            parts.unshift({
                inlineData: {
                    data: imageBase64,
                    mimeType: "image/jpeg"
                }
            });
        }

        const response = await ai.models.generateContent({
            model: userModel === 'pro' ? MODEL_PRO : MODEL_FLASH,
            contents: { parts: parts },
            config: {
                systemInstruction: systemInstruction + "\n" + contextString,
                temperature: 0.7,
                // @ts-ignore
                safetySettings: SAFETY_SETTINGS
            }
        });

        if (!response.text) throw new Error("Respuesta vacía del modelo.");
        return response.text;
    } catch (error: any) {
        console.error("AI Chat Error (Dual Core):", error);
        
        const errorMsg = error?.message?.toLowerCase() || "";
        const isHighDemand = errorMsg.includes("503") || 
                             errorMsg.includes("429") ||
                             errorMsg.includes("high demand") || 
                             errorMsg.includes("resource_exhausted");

        if (isHighDemand) {
            return "🚀 Mi núcleo está procesando demasiada información ahora mismo. Estamos optimizando mis circuitos para darte la mejor respuesta académica. ¡Dame un par de minutos para despejarme! ⚡";
        }

        return `⚠️ Error de Conexión: ${error.message || "Intenta de nuevo."}`;
    }
};

export const transcribeAudio = async (audioUri: string): Promise<string> => {
    try {
        console.log(`🎙️ [Cortex Audio] Enviando a Whisper (Groq)...`);
        const formData = new FormData();
        formData.append('file', {
            uri: audioUri,
            name: 'audio.m4a',
            type: 'audio/m4a'
        } as any);
        formData.append('model', 'whisper-large-v3');
        formData.append('language', 'es'); // Optimización para habla hispana

        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                // React Native se encarga del Content-Type multipart/form-data automáticamente
            },
            body: formData
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message || 'Error en Whisper');
        
        console.log(`🎙️ [Cortex Audio] Transcripción exitosa: "${data.text}"`);
        return data.text || "";
    } catch (e) {
        console.error("Transcribe Error:", e);
        return "";
    }
};

export const generateChatTitle = async (firstMessage: string): Promise<string> => {
    try {
        const prompt = `Actúa como un titulador automático. Genera un título muy corto (máximo 4 palabras) que resuma el siguiente mensaje del usuario. Solo devuelve el texto del título, nada más, sin comillas ni formato. Mensaje: "${firstMessage}"`;
        
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                max_tokens: 15
            })
        });

        const data = await res.json();
        let title = data.choices?.[0]?.message?.content?.trim() || "Nuevo Chat";
        title = title.replace(/['"]/g, ''); // Limpiar comillas
        return title;
    } catch (e) {
        return "Nuevo Chat";
    }
};
