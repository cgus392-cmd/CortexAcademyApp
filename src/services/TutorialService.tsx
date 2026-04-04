import React, { createContext, useContext, useState, useCallback } from 'react';
import { useData } from '../context/DataContext';

export interface TutorialStep {
  id: string;
  targetId: string; // The ID of the element to highlight
  text: string;
  expression: 'normal' | 'happy' | 'thinking' | 'success';
  onAction?: () => void;
}

interface TutorialContextProps {
  currentStep: TutorialStep | null;
  isActive: boolean;
  startTutorial: (steps: TutorialStep[]) => void;
  nextStep: () => void;
  stopTutorial: () => void;
  registerElement: (id: string, layout: any) => void;
  getElementLayout: (id: string) => any;
}

const TutorialContext = createContext<TutorialContextProps | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [stepIndex, setStepIndex] = useState(-1);
  const [elements, setElements] = useState<Record<string, any>>({});
  const { updateUserProfile } = useData();

  const isActive = stepIndex >= 0 && stepIndex < steps.length;
  const currentStep = isActive ? steps[stepIndex] : null;

  const startTutorial = useCallback((newSteps: TutorialStep[]) => {
    setSteps(newSteps);
    setStepIndex(0);
  }, []);

  const nextStep = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setStepIndex(-1);
      // Mark as completed in user profile if it's the main tutorial
      updateUserProfile({ tutorialCompleted: true });
    }
  }, [stepIndex, steps, updateUserProfile]);

  const stopTutorial = useCallback(() => {
    setStepIndex(-1);
  }, []);

  const registerElement = useCallback((id: string, layout: any) => {
    // If layout doesn't have px/py, it's a legacy or local measurement
    setElements(prev => ({ ...prev, [id]: layout }));
  }, []);

  const getElementLayout = useCallback((id: string) => {
    return elements[id];
  }, [elements]);

  return (
    <TutorialContext.Provider value={{
      currentStep,
      isActive,
      startTutorial,
      nextStep,
      stopTutorial,
      registerElement,
      getElementLayout
    }}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) throw new Error('useTutorial must be used within TutorialProvider');
  return context;
};
