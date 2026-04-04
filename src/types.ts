// Cortex Mobile 2.0 — Types

export interface UserPreferences {
  compactMode: boolean;
  reducedMotion: boolean;
  hapticStyle: 'none' | 'light' | 'medium' | 'heavy' | 'selection' | 'success'; 
  lowPowerMode?: boolean;
  nebulaIntensity: number; // 0-1
  glassOpacity: number; // 0-1
  glassBlur: number; // 0-20
  themeId: 'cortex_classic' | 'nebula_deep' | 'cyber_slate' | 'academic_gold';
  gradeScale?: '5.0' | '10.0' | '100'; // Sistema de calificación
  alertThreshold?: number; // Umbral de riesgo (ej. 3.0)
}

export interface User {
  id: string;
  name: string;
  email: string;
  semester: number;
  university: string;
  domain?: string;
  universityColor?: string;
  career: string;
  targetGrade: number;
  maxGrade: number;
  minGrade: number;
  avatarEmoji: string;
  selectedModel: 'flash' | 'pro';
  aiPersonality: 'professional' | 'friendly' | 'technical';
  accentColor: 'primary' | 'emerald' | 'rose' | 'amber' | 'royal';
  preferences: UserPreferences;
  completedAchievements: string[];
  unlockedModels: string[];
  vaultEnabled?: boolean; // Bóveda de Seguridad activa
  tutorialCompleted?: boolean;
}

export interface GradeActivity {
  id: number;
  name: string;
  weight: number; // % relative to Cut
  grade: string;
}

export interface GradeCut {
  id: number;
  name: string;
  weight: number; // % relative to Course total
  grade: string;
  activities?: GradeActivity[];
}

export interface Resource {
  id: number;
  title: string;
  url: string;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  credits: number;
  professor: string;
  semester: number;
  modality: 'presencial' | 'virtual';
  location: string;
  color: string;
  average: string;
  progress: number; // 0-100
  cuts: GradeCut[];
  resources: Resource[];
  schedule?: {
    day: string;
    time: string;
  };
}

export interface Task {
  id: number;
  text: string;
  date: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
  description?: string;
  courseId?: number; // Materia asociada
  status?: 'todo' | 'in_progress' | 'done';
  estimatedTime?: string; // e.g. '30m', '1h'
}

export interface ScheduleBlock {
  id: string;
  day: string; // 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
  startTime: string; // "08:00"
  endTime: string;   // "10:00"
  subject: string;
  room?: string;
  color: string;
}

export interface NexusDocument {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'code' | 'summary';
  createdAt: string;
  tags?: string[];
  summary?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Memo {
  id: number;
  text: string;
  color: string;
}

export type AuthState = 'LOCK' | 'ONBOARDING' | 'APP';
export type AppTab = 'home' | 'courses' | 'cronos' | 'oracle' | 'settings';
