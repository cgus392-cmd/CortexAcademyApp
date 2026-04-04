// Cortex Mobile 2.0 — Mock Data
import { User, Course, Task, ScheduleBlock, NexusDocument, ChatMessage } from '../types';
import { CourseColors as CC } from './theme';

export const MOCK_USER: User = {
  id: 'camilo-dev-001',
  name: 'Camilo',
  email: 'camilo@cortex.academy',
  semester: 5,
  university: 'Corporación Universitaria Reformada',
  career: 'Ingeniería de Sistemas',
  targetGrade: 4.0,
  maxGrade: 5.0,
  minGrade: 0.0,
  avatarEmoji: '🎓',
  selectedModel: 'flash',
  aiPersonality: 'friendly',
  accentColor: 'primary',
  preferences: {
    compactMode: false,
    reducedMotion: false,
    hapticStyle: 'medium',
    nebulaIntensity: 0.5,
    glassOpacity: 0.12,
    glassBlur: 10,
    themeId: 'cortex_classic',
  },
  completedAchievements: ['init'],
  unlockedModels: ['flash'],
};

export const MOCK_MEMOS = [
  { id: 1, text: 'Recordar revisar los triggers de BD para el martes.', color: '#FEF3C7' },
  { id: 2, text: 'Comprar café para la sesión de mobile.', color: '#DBEAFE' },
  { id: 3, text: 'Investigar arquitectura hexagonal vs cebolla.', color: '#FCE7F3' },
];

export const MOCK_COURSES: Course[] = [
  {
    id: 1,
    name: 'Arquitectura de Software',
    code: 'IS-401',
    credits: 4,
    professor: 'Dr. Martínez',
    semester: 5,
    modality: 'presencial',
    location: 'Bloque B - Aula 204',
    color: CC[0],
    average: '4.2',
    progress: 75,
    cuts: [
      {
        id: 1,
        name: 'Corte 1',
        weight: 30,
        grade: '4.5',
        activities: [
          { id: 1, name: 'Parcial Teórico', weight: 50, grade: '4.8' },
          { id: 2, name: 'Taller Patrones', weight: 30, grade: '4.2' },
          { id: 3, name: 'Asistencia', weight: 20, grade: '4.0' },
        ],
      },
      { id: 2, name: 'Corte 2', weight: 35, grade: '4.0', activities: [] },
      { id: 3, name: 'Corte 3', weight: 35, grade: '4.1', activities: [] },
    ],
    resources: [
      { id: 1, title: 'Clean Architecture — Robert Martin', url: 'https://example.com/clean' },
      { id: 2, title: 'Patrones GoF PDF', url: 'https://example.com/patterns' },
    ],
    schedule: { day: 'Lunes', time: '08:00 - 10:00' },
  },
  {
    id: 2,
    name: 'Base de Datos Avanzadas',
    code: 'IS-403',
    credits: 3,
    professor: 'Ing. García',
    semester: 5,
    modality: 'presencial',
    location: 'Lab Sistemas - Piso 3',
    color: CC[1],
    average: '3.8',
    progress: 60,
    cuts: [
      { id: 1, name: 'Corte 1', weight: 30, grade: '4.0', activities: [
        { id: 1, name: 'Quiz SQL', weight: 40, grade: '3.8' },
        { id: 2, name: 'Proyecto BD', weight: 60, grade: '4.1' },
      ]},
      { id: 2, name: 'Corte 2', weight: 35, grade: '3.7', activities: [] },
      { id: 3, name: 'Corte 3', weight: 35, grade: '3.7', activities: [] },
    ],
    resources: [
      { id: 1, title: 'PostgreSQL Docs', url: 'https://www.postgresql.org/docs/' },
      { id: 2, title: 'MongoDB University', url: 'https://university.mongodb.com' },
    ],
    schedule: { day: 'Martes', time: '10:00 - 12:00' },
  },
  {
    id: 3,
    name: 'Desarrollo Mobile',
    code: 'IS-415',
    credits: 3,
    professor: 'Ing. Rodríguez',
    semester: 5,
    modality: 'virtual',
    location: 'Google Meet',
    color: CC[2],
    average: '4.5',
    progress: 85,
    cuts: [
      { id: 1, name: 'Corte 1', weight: 30, grade: '4.8', activities: [
        { id: 1, name: 'App HelloWorld', weight: 30, grade: '5.0' },
        { id: 2, name: 'UI Components', weight: 40, grade: '4.7' },
        { id: 3, name: 'Navigation Lab', weight: 30, grade: '4.5' },
      ]},
      { id: 2, name: 'Corte 2', weight: 35, grade: '4.3', activities: [] },
      { id: 3, name: 'Corte 3', weight: 35, grade: '4.5', activities: [] },
    ],
    resources: [
      { id: 1, title: 'Expo Documentation', url: 'https://docs.expo.dev' },
      { id: 2, title: 'React Native Docs', url: 'https://reactnative.dev/docs' },
    ],
    schedule: { day: 'Miércoles', time: '14:00 - 16:00' },
  },
  {
    id: 4,
    name: 'Inteligencia Artificial',
    code: 'IS-420',
    credits: 4,
    professor: 'Dr. López',
    semester: 5,
    modality: 'presencial',
    location: 'Bloque A - Aula 105',
    color: CC[3],
    average: '3.6',
    progress: 50,
    cuts: [
      { id: 1, name: 'Corte 1', weight: 30, grade: '3.5', activities: [
        { id: 1, name: 'Quiz Fundamentos IA', weight: 50, grade: '3.3' },
        { id: 2, name: 'Paper Review', weight: 50, grade: '3.7' },
      ]},
      { id: 2, name: 'Corte 2', weight: 35, grade: '3.6', activities: [] },
      { id: 3, name: 'Corte 3', weight: 35, grade: '3.7', activities: [] },
    ],
    resources: [
      { id: 1, title: 'Gemini API Docs', url: 'https://ai.google.dev/docs' },
      { id: 2, title: 'Deep Learning Book', url: 'https://www.deeplearningbook.org' },
    ],
    schedule: { day: 'Jueves', time: '08:00 - 10:00' },
  },
  {
    id: 5,
    name: 'Ética Profesional',
    code: 'HUM-201',
    credits: 2,
    professor: 'Mg. Sánchez',
    semester: 5,
    modality: 'presencial',
    location: 'Bloque C - Aula 312',
    color: CC[4],
    average: '4.7',
    progress: 90,
    cuts: [
      { id: 1, name: 'Corte 1', weight: 30, grade: '4.8', activities: [
        { id: 1, name: 'Ensayo Ética', weight: 60, grade: '4.9' },
        { id: 2, name: 'Debate', weight: 40, grade: '4.6' },
      ]},
      { id: 2, name: 'Corte 2', weight: 35, grade: '4.7', activities: [] },
      { id: 3, name: 'Corte 3', weight: 35, grade: '4.5', activities: [] },
    ],
    resources: [
      { id: 1, title: 'IEEE Code of Ethics', url: 'https://www.ieee.org/about/corporate/governance/p7-8.html' },
    ],
    schedule: { day: 'Viernes', time: '16:00 - 18:00' },
  },
];

export const MOCK_TASKS: Task[] = [
  {
    id: 1,
    text: 'Entregar proyecto final Arquitectura',
    date: '2026-03-20',
    done: false,
    priority: 'high',
    description: 'Implementar el patrón Hexagonal en la app de inventario',
  },
  {
    id: 2,
    text: 'Estudiar para parcial de BD',
    date: '2026-03-18',
    done: false,
    priority: 'high',
    description: 'Repasar índices, triggers y procedimientos almacenados',
  },
  {
    id: 3,
    text: 'Publicar app en Expo Go',
    date: '2026-03-16',
    done: true,
    priority: 'medium',
    description: 'Subir la app de Mobile al canal de staging',
  },
  {
    id: 4,
    text: 'Leer paper de redes neuronales',
    date: '2026-03-22',
    done: false,
    priority: 'medium',
    description: 'Capítulos 6 y 7 del Deep Learning Book',
  },
  {
    id: 5,
    text: 'Entregar ensayo de ética',
    date: '2026-03-25',
    done: false,
    priority: 'low',
    description: 'Tema: Responsabilidad del ingeniero en la era IA',
  },
];

export const MOCK_SCHEDULE: ScheduleBlock[] = [
  {
    id: 'sb-1',
    day: 'Lunes',
    startTime: '08:00',
    endTime: '10:00',
    subject: 'Arquitectura de Software',
    room: 'Bloque B - Aula 204',
    color: '#6C63FF',
  },
  {
    id: 'sb-2',
    day: 'Lunes',
    startTime: '14:00',
    endTime: '16:00',
    subject: 'Base de Datos Avanzadas',
    room: 'Lab Sistemas - Piso 3',
    color: '#00C9A7',
  },
  {
    id: 'sb-3',
    day: 'Martes',
    startTime: '10:00',
    endTime: '12:00',
    subject: 'Base de Datos Avanzadas',
    room: 'Lab Sistemas - Piso 3',
    color: '#00C9A7',
  },
  {
    id: 'sb-4',
    day: 'Miércoles',
    startTime: '14:00',
    endTime: '16:00',
    subject: 'Desarrollo Mobile',
    room: 'Virtual - Google Meet',
    color: '#FF6B8A',
  },
  {
    id: 'sb-5',
    day: 'Jueves',
    startTime: '08:00',
    endTime: '10:00',
    subject: 'Inteligencia Artificial',
    room: 'Bloque A - Aula 105',
    color: '#F59E0B',
  },
  {
    id: 'sb-6',
    day: 'Viernes',
    startTime: '16:00',
    endTime: '18:00',
    subject: 'Ética Profesional',
    room: 'Bloque C - Aula 312',
    color: '#3B82F6',
  },
];

export const MOCK_DOCUMENTS: NexusDocument[] = [
  {
    id: 'doc-1',
    title: 'Resumen: Patrones de Diseño GoF',
    content: `# Patrones de Diseño — Gang of Four

## Creacionales
- **Singleton**: Garantiza una única instancia de una clase
- **Factory Method**: Define interfaz para crear objetos, subclases deciden la clase
- **Abstract Factory**: Familias de objetos relacionados sin especificar clases concretas
- **Builder**: Construye objetos complejos paso a paso
- **Prototype**: Clona objetos existentes sin dependencias

## Estructurales
- **Adapter**: Permite que interfaces incompatibles trabajen juntas
- **Bridge**: Separa abstracción de implementación
- **Composite**: Compone objetos en estructura de árbol
- **Decorator**: Agrega responsabilidades a objetos dinámicamente
- **Facade**: Interfaz simplificada para subsistema complejo

## De Comportamiento
- **Observer**: Notifica cambios a múltiples objetos dependientes
- **Strategy**: Define familia de algoritmos intercambiables
- **Command**: Encapsula solicitud como objeto
- **Iterator**: Acceso secuencial sin exponer representación interna`,
    type: 'summary',
    createdAt: '2026-03-10',
    tags: ['patrones', 'diseño', 'arquitectura'],
    summary: 'Resumen completo de los 23 patrones GoF categorizados',
  },
  {
    id: 'doc-2',
    title: 'Configuración PostgreSQL — Proyecto BD',
    content: `-- Configuración inicial PostgreSQL
-- Proyecto: Sistema de Inventario

-- Crear base de datos
CREATE DATABASE inventario_db;

-- Tabla productos
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  categoria_id INT REFERENCES categorias(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas por nombre
CREATE INDEX idx_productos_nombre ON productos(nombre);

-- Función para actualizar stock
CREATE OR REPLACE FUNCTION actualizar_stock(
  p_id INT,
  p_cantidad INT
) RETURNS VOID AS $$
BEGIN
  UPDATE productos 
  SET stock = stock + p_cantidad
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger de auditoría
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log(tabla, operacion, datos, fecha)
  VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,
    type: 'code',
    createdAt: '2026-03-12',
    tags: ['postgresql', 'sql', 'base-de-datos'],
    summary: 'Scripts SQL del proyecto de inventario para BD Avanzadas',
  },
  {
    id: 'doc-3',
    title: 'Notas: IA y Machine Learning',
    content: `# Inteligencia Artificial — Notas de Clase

## Conceptos Fundamentales

### Aprendizaje Supervisado
El modelo aprende de pares (input, output) etiquetados.
- **Regresión**: predice valores continuos
- **Clasificación**: predice categorías discretas

### Redes Neuronales
- **Neurona artificial**: unidad básica que recibe entradas, aplica pesos y función de activación
- **Backpropagation**: algoritmo para ajustar pesos mediante gradiente descendente
- **Capas**: entrada → ocultas → salida

### Funciones de Activación
| Función | Rango | Uso |
|---------|-------|-----|
| ReLU | [0, ∞) | capas ocultas |
| Sigmoid | (0, 1) | clasificación binaria |
| Softmax | (0, 1) suma=1 | clasificación multiclase |
| Tanh | (-1, 1) | capas ocultas (alternativa ReLU) |

## Modelos Grandes de Lenguaje (LLMs)
- Basados en arquitectura **Transformer** (Attention is All You Need, 2017)
- Gemini, GPT-4, Claude, LLaMA
- Fine-tuning vs. prompting vs. RAG`,
    type: 'text',
    createdAt: '2026-03-14',
    tags: ['ia', 'machine-learning', 'redes-neuronales'],
    summary: 'Notas de clase sobre fundamentos de IA y ML',
  },
];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: '¡Hola Camilo! 👋 Soy Cortex IA, tu asistente académico IA. Estoy aquí para ayudarte con tus materias, tareas, estrategias de estudio y mucho más. ¿En qué te puedo ayudar hoy?',
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'msg-2',
    role: 'user',
    content: '¿Cuál es mi promedio general este semestre?',
    timestamp: new Date(Date.now() - 240000).toISOString(),
  },
  {
    id: 'msg-3',
    role: 'assistant',
    content: 'Con base en tus datos actuales 📊:\n\n• Arquitectura de Software: **4.2**\n• Base de Datos Avanzadas: **3.8**\n• Desarrollo Mobile: **4.5**\n• Inteligencia Artificial: **3.6**\n• Ética Profesional: **4.7**\n\nTu promedio ponderado actual es **4.16** — ¡Estás por encima de tu meta de 4.0! 🎯\n\nTe recomiendo enfocarte en IA y BD para subir esas notas antes del corte final.',
    timestamp: new Date(Date.now() - 180000).toISOString(),
  },
];
