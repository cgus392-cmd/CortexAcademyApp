import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import firestore from '@react-native-firebase/firestore';
import { ACHIEVEMENTS, checkAchievementConditions } from '../services/achievements';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_KEYS = {
  PROFILE: 'CORTEX_PROFILE',
  COURSES: 'CORTEX_COURSES',
  TASKS: 'CORTEX_TASKS',
  SCHEDULE: 'CORTEX_SCHEDULE',
  NOTES: 'CORTEX_NOTES',
  NOTIFICATIONS: 'CORTEX_NOTIFICATIONS',
  NEXUS: 'CORTEX_NEXUS',
};

export interface UserProfile {
  name?: string;
  semester?: number;
  theme?: string;
  university?: string;
  [key: string]: any;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  action?: string;
}

export interface GlobalConfig {
  currentVersion: string;
  updateUrl: string;
  announcement?: {
    id: string;
    title: string;
    body: string;
    type: 'info' | 'update' | 'warning';
    active: boolean;
  };
  maintenanceMode: boolean;
}

export interface DataContextProps {
  userProfile: UserProfile | null;
  courses: any[];
  tasks: any[];
  scheduleBlocks: any[];
  notes: string;
  isLoading: boolean;
  isSyncing: boolean;
  isDataFresh: boolean;
  authUser: any;
  isConnected: boolean | null;
  role: 'student' | 'admin' | 'support' | 'management';
  isAdmin: boolean;
  globalConfig: GlobalConfig | null;
  updateTask: (updatedTask: any) => Promise<void>;
  addTask: (newTask: any) => Promise<void>;
  deleteTask: (taskId: number) => Promise<void>;
  updateCourse: (updatedCourse: any) => Promise<void>;
  addScheduleBlock: (newBlock: any) => Promise<void>;
  updateScheduleBlock: (updatedBlock: any) => Promise<void>;
  deleteScheduleBlock: (blockId: string) => Promise<void>;
  batchUpdateScheduleBySubject: (oldName: string, newName: string, newColor: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateUserDirectly: (uid: string, updates: any) => Promise<void>;
  updateNotes: (newNotes: any[]) => Promise<void>;
  addAchievement: (achievementId: string) => Promise<void>;
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  nexusResources: any[];
  addNexusResource: (newResource: any) => Promise<void>;
  updateNexusResource: (updatedResource: any) => Promise<void>;
  deleteNexusResource: (resourceId: string) => Promise<void>;
  getAllUsers: () => Promise<any[]>;
  updateGlobalConfig: (updates: Partial<GlobalConfig>) => Promise<void>;
  syncData: () => Promise<void>;
  restoreData: (data: any) => Promise<void>;
}

export const DataContext = createContext<DataContextProps>({
  userProfile: null,
  courses: [],
  tasks: [],
  scheduleBlocks: [],
  notes: '',
  isLoading: true,
  isSyncing: false,
  isDataFresh: false,
  authUser: null,
  isConnected: true,
  isAdmin: false,
  role: 'student',
  globalConfig: null,
  updateTask: async () => {},
  addTask: async () => {},
  deleteTask: async () => {},
  updateCourse: async () => {},
  addScheduleBlock: async () => {},
  updateScheduleBlock: async () => {},
  deleteScheduleBlock: async () => {},
  batchUpdateScheduleBySubject: async () => {},
  updateUserProfile: async () => {},
  updateUserDirectly: async () => {},
  updateNotes: async () => {},
  addAchievement: async () => {},
  notifications: [],
  addNotification: async () => {},
  markNotificationAsRead: async () => {},
  deleteNotification: async () => {},
  clearNotifications: async () => {},
  nexusResources: [],
  addNexusResource: async () => {},
  updateNexusResource: async () => {},
  deleteNexusResource: async () => {},
  getAllUsers: async () => [],
  updateGlobalConfig: async () => {},
  syncData: async () => {},
  restoreData: async () => {},
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [nexusResources, setNexusResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDataFresh, setIsDataFresh] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig | null>(null);

  const isAdmin = userProfile?.role === 'admin';
  const role = (userProfile?.role || 'student') as any;

  // --- PERSISTENCE HELPERS ---
  const saveToCache = async (key: string, data: any) => {
    try {
      if (data) {
        await AsyncStorage.setItem(key, JSON.stringify(data));
      }
    } catch (e) {
      console.error(`Error saving ${key} to cache:`, e);
    }
  };

  const loadFromCache = async () => {
    try {
      const [p, c, t, s, n, nt] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.PROFILE),
        AsyncStorage.getItem(CACHE_KEYS.COURSES),
        AsyncStorage.getItem(CACHE_KEYS.TASKS),
        AsyncStorage.getItem(CACHE_KEYS.SCHEDULE),
        AsyncStorage.getItem(CACHE_KEYS.NOTES),
        AsyncStorage.getItem(CACHE_KEYS.NOTIFICATIONS),
      ]);

      if (p) setUserProfile(JSON.parse(p));
      if (c) setCourses(JSON.parse(c));
      if (t) setTasks(JSON.parse(t));
      if (s) setScheduleBlocks(JSON.parse(s));
      if (n) setNotes(n); // Notes is a string
      if (nt) setNotifications(JSON.parse(nt));
      const nx = await AsyncStorage.getItem(CACHE_KEYS.NEXUS);
      if (nx) setNexusResources(JSON.parse(nx));
      
      return !!(p || c || t || nx);
    } catch (e) {
      console.error('Error loading from cache:', e);
      return false;
    }
  };

  const updateTask = async (updatedTask: any) => {
    if (!auth.currentUser) return;
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(newTasks);
    await db.collection('users').doc(auth.currentUser.uid).set({ tasks: newTasks }, { merge: true });
  };

  const addTask = async (newTask: any) => {
    if (!auth.currentUser) return;
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    await db.collection('users').doc(auth.currentUser.uid).set({ tasks: newTasks }, { merge: true });
  };

  const deleteTask = async (taskId: number) => {
    if (!auth.currentUser) return;
    const newTasks = tasks.filter(t => t.id !== taskId);
    setTasks(newTasks);
    await db.collection('users').doc(auth.currentUser.uid).set({ tasks: newTasks }, { merge: true });
  };

  const updateCourse = async (updatedCourse: any) => {
    if (!auth.currentUser) return;
    const newCourses = courses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
    setCourses(newCourses);
    await db.collection('users').doc(auth.currentUser.uid).set({ courses: newCourses }, { merge: true });
  };

  const addScheduleBlock = async (newBlock: any) => {
    if (!auth.currentUser) return;
    const newBlocks = [...scheduleBlocks, newBlock];
    setScheduleBlocks(newBlocks);
    await db.collection('users').doc(auth.currentUser.uid).set({ scheduleBlocks: newBlocks }, { merge: true });
  };

  const updateScheduleBlock = async (updatedBlock: any) => {
    if (!auth.currentUser) return;
    const newBlocks = scheduleBlocks.map(b => b.id === updatedBlock.id ? updatedBlock : b);
    setScheduleBlocks(newBlocks);
    await db.collection('users').doc(auth.currentUser.uid).set({ scheduleBlocks: newBlocks }, { merge: true });
  };

  const deleteScheduleBlock = async (blockId: string) => {
    if (!auth.currentUser) return;
    const newBlocks = scheduleBlocks.filter(b => b.id !== blockId);
    setScheduleBlocks(newBlocks);
    await db.collection('users').doc(auth.currentUser.uid).set({ scheduleBlocks: newBlocks }, { merge: true });
  };

  const batchUpdateScheduleBySubject = async (oldName: string, newName: string, newColor: string) => {
    if (!auth.currentUser) return;
    const newBlocks = scheduleBlocks.map(b => {
      if (b.subject === oldName) {
        return { ...b, subject: newName, color: newColor };
      }
      return b;
    });
    setScheduleBlocks(newBlocks);
    await db.collection('users').doc(auth.currentUser.uid).set({ scheduleBlocks: newBlocks }, { merge: true });
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const newProfile = { ...userProfile, ...updates };
    setUserProfile(newProfile);
    if (!auth.currentUser) return;
    await db.collection('users').doc(auth.currentUser.uid).set({ userProfile: newProfile }, { merge: true });
  };

  const updateUserDirectly = async (uid: string, updates: any) => {
    if (!isAdmin) return;
    // Esto es para que el Admin corrija la sesión de un usuario remotamente
    await db.collection('users').doc(uid).set(updates, { merge: true });
  };

  const updateNotes = async (newNotes: any[]) => {
    if (!auth.currentUser) return;
    const notesStr = JSON.stringify(newNotes);
    setNotes(notesStr);
    await db.collection('users').doc(auth.currentUser.uid).set({ notes: notesStr }, { merge: true });
  };
  
  const addAchievement = async (id: string) => {
    if (!auth.currentUser) return;
    const current = userProfile?.completedAchievements || [];
    if (current.includes(id)) return;
    
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (achievement) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('¡Logro Desbloqueado!', `Has ganado la medalla: ${achievement.label}`);
    }

    const docRef = db.collection('users').doc(auth.currentUser.uid);
    await docRef.update({
        completedAchievements: firestore.FieldValue.arrayUnion(id)
    });
    // Actualizar localmente para evitar re-disparo antes del snapshot
    setUserProfile(prev => prev ? ({ ...prev, completedAchievements: [...(prev.completedAchievements || []), id] }) : null);
  };

  const addNotification = async (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    if (!auth.currentUser) return;
    const newNotif: AppNotification = {
      ...notif,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    const newNotifications = [newNotif, ...notifications];
    setNotifications(newNotifications);
    await db.collection('users').doc(auth.currentUser.uid).set({ notifications: newNotifications }, { merge: true });
  };

  const markNotificationAsRead = async (id: string) => {
    if (!auth.currentUser) return;
    const newNotifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(newNotifications);
    await db.collection('users').doc(auth.currentUser.uid).set({ notifications: newNotifications }, { merge: true });
  };

  const deleteNotification = async (id: string) => {
    if (!auth.currentUser) return;
    const newNotifications = notifications.filter(n => n.id !== id);
    setNotifications(newNotifications);
    await db.collection('users').doc(auth.currentUser.uid).set({ notifications: newNotifications }, { merge: true });
    await saveToCache(CACHE_KEYS.NOTIFICATIONS, newNotifications);
  };

  const clearNotifications = async () => {
    if (!auth.currentUser) return;
    setNotifications([]);
    await db.collection('users').doc(auth.currentUser.uid).set({ notifications: [] }, { merge: true });
    await saveToCache(CACHE_KEYS.NOTIFICATIONS, []);
  };

  const addNexusResource = async (newResource: any) => {
    if (!auth.currentUser) return;
    const nrs = [newResource, ...nexusResources];
    setNexusResources(nrs);
    await db.collection('users').doc(auth.currentUser.uid).set({ nexusResources: nrs }, { merge: true });
    await saveToCache(CACHE_KEYS.NEXUS, nrs);
  };

  const updateNexusResource = async (updatedResource: any) => {
    if (!auth.currentUser) return;
    const nrs = nexusResources.map(r => r.id === updatedResource.id ? updatedResource : r);
    setNexusResources(nrs);
    await db.collection('users').doc(auth.currentUser.uid).set({ nexusResources: nrs }, { merge: true });
    await saveToCache(CACHE_KEYS.NEXUS, nrs);
  };

  const deleteNexusResource = async (id: string) => {
    if (!auth.currentUser) return;
    const nrs = nexusResources.filter(r => r.id !== id);
    setNexusResources(nrs);
    await db.collection('users').doc(auth.currentUser.uid).set({ nexusResources: nrs }, { merge: true });
    await saveToCache(CACHE_KEYS.NEXUS, nrs);
  };

  const getAllUsers = async () => {
    if (!isAdmin) return [];
    try {
        const snap = await db.collection('users').get();
        return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    } catch (e) {
        console.error('Error fetching users:', e);
        return [];
    }
  };

  const updateGlobalConfig = async (updates: Partial<GlobalConfig>) => {
    if (!isAdmin) return;
    const newConfig = { ...globalConfig, ...updates };
    setGlobalConfig(newConfig as GlobalConfig);
    await db.collection('system').doc('config').set(newConfig, { merge: true });
  };

  const restoreData = async (backup: any) => {
    if (!auth.currentUser) return;
    setIsSyncing(true);
    try {
        const uid = auth.currentUser.uid;
        // 1. Update Firestore
        await db.collection('users').doc(uid).set({
            userProfile: backup.userProfile,
            courses: backup.courses,
            tasks: backup.tasks,
            scheduleBlocks: backup.scheduleBlocks,
            notes: backup.notes,
            notifications: backup.notifications,
            nexusResources: backup.nexusResources || [],
            completedAchievements: backup.completedAchievements || []
        }, { merge: true });

        // 2. Local State update
        setUserProfile(backup.userProfile);
        setCourses(backup.courses);
        setTasks(backup.tasks);
        setScheduleBlocks(backup.scheduleBlocks);
        setNotes(backup.notes);
        setNotifications(backup.notifications);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Restauración Exitosa', 'Tu ecosistema ha sido restaurado desde el archivo seleccionado.');
    } catch (e) {
        console.error('Restore error:', e);
        Alert.alert('Error Crítico', 'No se pudieron restaurar los datos en la nube.');
    } finally {
        setIsSyncing(false);
    }
  };

  const syncData = async () => {
    if (!auth.currentUser || isSyncing) return;
    setIsSyncing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // Simulado o manual trigger para mostrar feedback visual si es necesario
      // onSnapshot ya se encarga de la sincronización real-time, 
      // pero esto sirve para forzar una lectura si hubo errores.
      console.log('Fuerza de sincronización disparada...');
      // No necesitamos hacer nada extra si onSnapshot está activo, 
      // pero podríamos repasar la lógica si onSnapshot falló por internet.
    } catch (e) {
      console.error('Sync error:', e);
    } finally {
      setTimeout(() => setIsSyncing(false), 1000);
    }
  };

  const unsubscribeRef = React.useRef<(() => void) | null>(null);

  useEffect(() => {
    if (userProfile && courses.length > 0) {
      const newAch = checkAchievementConditions(userProfile, courses);
      newAch.forEach(id => addAchievement(id));
    }
  }, [userProfile, courses]);

  // --- NETWORK MONITORING ---
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (isConnected === false && state.isConnected) {
        // Recuperó conexión - Notificación Proactiva
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        syncData();
      }
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, [isConnected]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user: any) => {
      setAuthUser(user);
      // Limpiar suscripción previa si existe
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      if (user) {
        // --- HYDRATE FROM CACHE FIRST ---
        loadFromCache().then(hasCache => {
          if (hasCache) {
            console.log('Data loaded from local cache.');
            setIsLoading(false);
          }
        });

        console.log('User authenticated:', user.uid);
        const docRef = db.collection('users').doc(user.uid);
        
        unsubscribeRef.current = docRef.onSnapshot((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (!data) return;
            const profile = data.userProfile || {};
            // El campo role ahora se saca directamente del perfil
            const achievements = data.completedAchievements || [];
            const fullProfile = { ...profile, role: data.role || 'student', completedAchievements: achievements };
            
            setUserProfile(fullProfile);
            setCourses(data.courses || []);
            setTasks(data.tasks || []);
            setScheduleBlocks(data.scheduleBlocks || []);
            setNotes(data.notes || '');
            setNotifications(data.notifications || []);
            setNexusResources(data.nexusResources || []);

            // PERSIST TO CACHE
            saveToCache(CACHE_KEYS.PROFILE, fullProfile);
            saveToCache(CACHE_KEYS.COURSES, data.courses || []);
            saveToCache(CACHE_KEYS.TASKS, data.tasks || []);
            saveToCache(CACHE_KEYS.SCHEDULE, data.scheduleBlocks || []);
            saveToCache(CACHE_KEYS.NOTES, data.notes || '');
            saveToCache(CACHE_KEYS.NOTIFICATIONS, data.notifications || []);
            saveToCache(CACHE_KEYS.NEXUS, data.nexusResources || []);
            setIsDataFresh(true);
          } else {
            console.log('No Firestore document found for user, initializing with empty data.');
            // Reset to defaults if doc doesn't exist
            setUserProfile(null);
            setCourses([]);
            setTasks([]);
            setScheduleBlocks([]);
            setNotes('');
            setNotifications([]);
          }
          setIsLoading(false);
        }, (error) => {
          console.error('Firestore Snapshot Error:', error);
          setIsLoading(false);
        });

        // --- GLOBAL CONFIG LISTENER ---
        const configRef = db.collection('system').doc('config');
        const unsubConfig = configRef.onSnapshot((snap) => {
            if (snap.exists()) {
                setGlobalConfig(snap.data() as GlobalConfig);
            }
        });
        
        return () => {
            if (unsubscribeRef.current) unsubscribeRef.current();
            unsubConfig();
        };
      } else {
        setUserProfile(null);
        setCourses([]);
        setTasks([]);
        setScheduleBlocks([]);
        setNotes('');
        setNotifications([]);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, []);

  return (
    <DataContext.Provider value={{ 
      userProfile, 
      courses, 
      tasks, 
      scheduleBlocks, 
      notes, 
      isLoading, 
      isSyncing,
      isDataFresh,
      authUser,
      isConnected,
      isAdmin,
      role,
      globalConfig,
      updateTask, 
      addTask,
      deleteTask,
      updateCourse, 
      addScheduleBlock,
      updateScheduleBlock,
      deleteScheduleBlock,
      batchUpdateScheduleBySubject,
      updateUserProfile, 
      updateUserDirectly,
      updateNotes, 
      addAchievement,
      notifications,
      addNotification,
      markNotificationAsRead,
      deleteNotification,
      clearNotifications,
      nexusResources,
      addNexusResource,
      updateNexusResource,
      deleteNexusResource,
      getAllUsers,
      updateGlobalConfig,
      syncData,
      restoreData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
