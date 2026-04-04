/**
 * Cortex Academic Engine (CortexCore 3.1)
 * Centralized logic for grades, GPAs, and Oracle predictions.
 */

export interface Activity {
  id: string | number;
  name: string;
  weight: number; // 0-100
  grade: number; // 0.0 - 5.0
}

export interface Cut {
  id: string | number;
  name: string;
  weight: number; // 0-100 (e.g. 30, 30, 40)
  grade: string;  // e.g. "4.5"
  activities: Activity[];
  method?: 'basic' | 'detailed'; 
}

export interface Course {
  id: string | number;
  name: string;
  credits: number;
  average: string;
  cuts: Cut[];
  [key: string]: any;
}

/**
 * Calculates the average of a cut based on its activities' weights.
 */
export const calculateCutGrade = (activities: Activity[]): number => {
  if (!activities || activities.length === 0) return 0;
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  activities.forEach(act => {
    totalWeight += act.weight;
    weightedSum += act.grade * (act.weight / 100);
  });
  
  if (totalWeight === 0) return 0;
  
  // Normalized to 100% of defined activities
  return (weightedSum / (totalWeight / 100));
};

/**
 * Calculates a course overall GPA based on its cuts' weights, 
 * NORMALIZED by the current completed weight (CortexCore 3.1 Proportion).
 */
export const calculateCourseGPA = (cuts: Cut[]): number => {
  if (!cuts || cuts.length === 0) return 0;
  
  let totalWeightedScore = 0;
  let totalWeightCompeted = 0;
  
  cuts.forEach(cut => {
    if (cut.method === 'basic' || !cut.activities || cut.activities.length === 0) {
       // --- MODO BÁSICO --- (Usa la nota del corte directamente)
       const cutGrade = parseFloat(cut.grade) || 0;
       if (cutGrade > 0) {
         totalWeightedScore += cutGrade * (cut.weight / 100);
         totalWeightCompeted += (cut.weight / 100);
       }
       return;
    }

    // Measure progress WITHIN the cut
    let cutInternalWeightCompleted = 0;
    let cutInternalScore = 0;

    cut.activities.forEach(act => {
      const g = parseFloat(String(act.grade));
      if (!isNaN(g) && g > 0) {
        cutInternalScore += g * (act.weight / 100);
        cutInternalWeightCompleted += (act.weight / 100);
      }
    });

    if (cutInternalWeightCompleted > 0) {
      // Contribution to course: (internal_avg) * (cut_weight / 100)
      const cutAvg = cutInternalScore / cutInternalWeightCompleted;
      totalWeightedScore += cutAvg * (cut.weight / 100);
      totalWeightCompeted += (cut.weight / 100);
    }
  });
  
  if (totalWeightCompeted === 0) return 0;
  
  return totalWeightedScore / totalWeightCompeted;
};

/**
 * Calculates current Points Earned (absolute score) towards the 5.0 total.
 */
export const calculateAccumulatedScore = (cuts: Cut[]): number => {
    let total = 0;
    cuts.forEach(cut => {
        const cutGrade = parseFloat(cut.grade) || 0;
        total += cutGrade * (cut.weight / 100);
    });
    return total;
};

/**
 * Calculates the REAL progress percentage of a course based on graded activities (CortexCore 3.1).
 * If a cut has no activities but has a manual grade, it's considered 100% of that cut done.
 */
export const calculateCourseProgress = (cuts: Cut[]): number => {
  if (!cuts || cuts.length === 0) return 0;
  
  let completedCourseWeight = 0;
  
  cuts.forEach(cut => {
    const cutGrade = parseFloat(cut.grade) || 0;
    if (cutGrade > 0) {
        if (cut.method === 'basic' || !cut.activities || cut.activities.length === 0) {
            // Caso: Nota Manual (Sin Actividades / Modo Básico)
            completedCourseWeight += cut.weight;
        } else {
            // Caso: Basado en Actividades — Medimos el % completado dentro del corte
            let cutWeightCompleted = 0;
            cut.activities.forEach(act => {
                const g = parseFloat(String(act.grade));
                if (!isNaN(g) && g > 0) {
                    cutWeightCompleted += (act.weight / 100);
                }
            });
            completedCourseWeight += cut.weight * cutWeightCompleted;
        }
    }
  });
  
  return Math.min(100, completedCourseWeight);
};

/**
 * Calculates the Global Weighted GPA (P.A.P.A) across multiple courses.
 * This counts ONLY evaluated credits (where at least one cut has a grade > 0).
 */
export const calculateGlobalWeightedGPA = (courses: Course[]): number => {
  if (!courses || courses.length === 0) return 0;
  
  let totalWeightedGrades = 0;
  let totalEvaluatedCredits = 0;
  
  courses.forEach(course => {
    const avg = parseFloat(course.average) || 0;
    const progress = calculateCourseProgress(course.cuts);
    const credits = course.credits || 0;
    
    // Only include if there's actual progress/evaluation
    if (progress > 0 && avg > 0) {
        totalWeightedGrades += avg * credits;
        totalEvaluatedCredits += credits;
    }
  });
  
  if (totalEvaluatedCredits === 0) return 0;
  
  return totalWeightedGrades / totalEvaluatedCredits;
};

/**
 * Calculates the Global Accumulated Points (Semester Progress Score) across multiple courses.
 * This counts ALL credits in the semester.
 * Example: 30% of the semester evaluated at a 4.0 average = 1.20 points earned.
 */
export const calculateGlobalAccumulatedScore = (courses: Course[]): number => {
  if (!courses || courses.length === 0) return 0;
  
  let totalWeightedPoints = 0;
  let totalCredits = 0;
  
  courses.forEach(course => {
    const points = calculateAccumulatedScore(course.cuts);
    const credits = course.credits || 0;
    
    totalWeightedPoints += points * credits;
    totalCredits += credits;
  });
  
  if (totalCredits === 0) return 0;
  
  return totalWeightedPoints / totalCredits;
};

/**
 * Calculates the overall semester efficiency based on course progress.
 */
export const calculateEfficiency = (courses: Course[]): number => {
  if (!courses || courses.length === 0) return 0;
  return Math.round(courses.reduce((acc, c) => acc + (c.progress || 0), 0) / courses.length);
};

/**
 * Counts the number of courses currently below the passing grade.
 */
export const calculateRiskCourses = (courses: Course[]): number => {
  if (!courses || courses.length === 0) return 0;
  return courses.filter(c => parseFloat(c.average || '0') < 3.0).length;
};

/**
 * Cortex IA: Predicts the grade needed in the remaining cuts to reach a target.
 */
export const calculateOraclePrediction = (
  target: number,
  currentCuts: Cut[],
  remainingWeight: number
): number | null => {
  if (remainingWeight <= 0) return null;
  
  let currentAccumulated = 0;
  currentCuts.forEach(cut => {
    const grade = parseFloat(cut.grade) || 0;
    currentAccumulated += grade * (cut.weight / 100);
  });
  
  // Formula: (Target - CurrentAccumulated) / (RemainingWeight / 100)
  const needed = (target - currentAccumulated) / (remainingWeight / 100);
  
  return needed;
};

/**
 * Helper to determine academic status label and color.
 */
export const getAcademicStatus = (gpa: number, target: number = 4.0) => {
  if (gpa >= target) return { label: 'SOBRESALIENTE', color: '#10B981', icon: '🌟' };
  if (gpa >= 3.5) return { label: 'BUENO', color: '#34D399', icon: '✅' };
  if (gpa >= 3.0) return { label: 'ESTABLE', color: '#F59E0B', icon: '⚠️' };
  return { label: 'RIESGO', color: '#EF4444', icon: '🚨' };
};
