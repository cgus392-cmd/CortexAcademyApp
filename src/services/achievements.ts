// 🏆 CORTEX GAMIFICATION ENGINE
// Logic for tracking and awarding academic achievements

export interface Achievement {
    id: string;
    label: string;
    description: string;
    icon: string;
    color: string;
}

export const ACHIEVEMENTS: Achievement[] = [
    { 
        id: 'init', 
        label: 'Cortex Iniciado', 
        description: 'Has configurado tu perfil académico.', 
        icon: 'star', 
        color: '#6366F1' 
    },
    { 
        id: 'strat', 
        label: 'Estratega', 
        description: 'Has definido una meta semestral clara.', 
        icon: 'trophy', 
        color: '#F59E0B' 
    },
    { 
        id: 'master', 
        label: 'Maestro IA', 
        description: 'Has completado 10 interacciones con Cortex IA.', 
        icon: 'zap', 
        color: '#10B981' 
    },
    { 
        id: 'scholar', 
        label: 'Erudito', 
        description: 'Has mantenido un promedio superior a 4.5.', 
        icon: 'award', 
        color: '#8B5CF6' 
    }
];

/**
 * Checks if a new achievement should be awarded based on current state.
 */
export const checkAchievementConditions = (profile: any, courses: any[]): string[] => {
    const newAchievements: string[] = [];
    const current = profile.completedAchievements || [];

    // 1. Estratega: Meta definida
    if (!current.includes('strat') && profile.targetGrade > 0) {
        newAchievements.push('strat');
    }

    // 2. Erudito: Promedio alto
    const avg = courses.reduce((acc, c) => acc + parseFloat(c.average || 0), 0) / (courses.length || 1);
    if (!current.includes('scholar') && avg >= 4.5 && courses.length > 0) {
        newAchievements.push('scholar');
    }

    return newAchievements;
};
