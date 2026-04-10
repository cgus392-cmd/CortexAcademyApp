import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import firestore from '@react-native-firebase/firestore';
import { ACHIEVEMENTS, checkAchievementConditions } from '../services/achievements';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';

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
  photoURL?: string;
  fallbackPhotoURL?: string;
  role?: 'student' | 'admin' | 'support' | 'management';
  completedAchievements?: string[];
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
    type: 'info' | 'success' | 'warning' | 'error';
    active: boolean;
    targetUniversity?: string;
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
  addCourse: (newCourse: any) => Promise<void>;
  deleteCourse: (courseId: string | number) => Promise<void>;
  addScheduleBlock: (newBlock: any) => Promise<void>;
  updateScheduleBlock: (updatedBlock: any) => Promise<void>;
  deleteScheduleBlock: (blockId: string) => Promise<void>;
  batchUpdateScheduleBySubject: (oldName: string, newName: string, newColor: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateUserDirectly: (uid: string, updates: any) => Promise<void>;
  updateNotes: (newNotes: any[]) => Promise<void>;
  addAchievement: (achievementId: string) => Promise<void>;
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { id?: string }) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
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
  triggerLocalBroadcast: (mockAnnouncement: any) => void;
  batchUpdateCourseAndSchedule: (updatedCourse: any, newBlocks: any[]) => Promise<void>;
  hardReset: () => Promise<void>;
  updatePushTokenImmediately: (token: string) => Promise<void>;
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
  addCourse: async () => {},
  deleteCourse: async () => {},
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
  markAllNotificationsAsRead: async () => {},
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
  triggerLocalBroadcast: () => {},
  batchUpdateCourseAndSchedule: async () => {},
  hardReset: async () => {},
  updatePushTokenImmediately: async () => {},
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
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);

  const lastSyncDataRef = React.useRef<any>(null); 
  const isInitialLoadFinished = React.useRef<boolean>(false);

  const isAdmin = userProfile?.role === 'admin';
  const role = (userProfile?.role || 'student') as any;

  const hardReset = async () => {
    try {
      // console.log('🧹 Deep Purge: Cleaning application cache...');
      setIsLoading(true);
      const keys = await AsyncStorage.getAllKeys();
      const cortexKeys = keys.filter(k => k.startsWith('CORTEX_'));
      await AsyncStorage.multiRemove(cortexKeys);
      
      setUserProfile(null);
      setCourses([]);
      setTasks([]);
      setScheduleBlocks([]);
      setNotes('');
      setNotifications([]);
      setNexusResources([]);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      console.error('Error during hard reset:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerLocalBroadcast = (mockAnnouncement: any) => {
    setGlobalConfig(prev => {
        if (!prev) return { announcement: mockAnnouncement } as any;
        return { ...prev, announcement: mockAnnouncement };
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const lastHandledIdRef = React.useRef<string>('');
  
  // 📡 PROXIMIDAD ALPHA: Listener de Tiempo Real para Push (Plan B Infalible)
  useEffect(() => {
    const unsubscribe = firestore()
      .doc('system/realtime_push')
      .onSnapshot(async (snapshot) => {
        if (!snapshot.exists) return;
        
        const data = snapshot.data();
        if (!data || !data.broadcastId) return;

        // 💾 Memoria de Mensajes: Evitar repeticiones al recargar
        try {
          const lastIdOnDisk = await AsyncStorage.getItem('CORTEX_LAST_PUSH_ID');
          if (data.broadcastId === lastIdOnDisk) return;

          // 🎓 Filtrado de Universidad (Procesamiento local)
          const userUnivClean = (userProfile?.university || '').trim().toLowerCase();
          const targetUnivClean = (data.targetUniversity || '').trim().toLowerCase();
          const matchesUniv = data.targetUniversity === 'all' || userUnivClean === targetUnivClean;

          if (matchesUniv) {
            // console.log(`🚀 [Alpha Bridge] Nueva señal aterrizada: ${data.broadcastId}`);
            
            // Marcar como procesado inmediatamente en disco
            await AsyncStorage.setItem('CORTEX_LAST_PUSH_ID', data.broadcastId);
            
            // 🔔 Lanzar Notificación Local
            await Notifications.scheduleNotificationAsync({
              content: {
                title: data.title || "Cortex Hub OS",
                body: data.body || "",
                data: { ...data },
                sound: 'default',
              },
              trigger: null,
            });

            // 🗂️ Agregar al historial (si no existe ya)
            addNotification({
              id: data.broadcastId,
              title: data.title,
              body: data.body,
              type: data.type || 'info',
              action: data.action || 'CommunicationsHub'
            });
          }
        } catch (e) {
          console.error('❌ [Alpha Bridge] Error procesando señal:', e);
        }
    }, (error) => {
      console.error('❌ [Alpha Bridge] Listener error:', error);
    });

    return () => unsubscribe();
  }, [userProfile?.university]);

  // --- PERSISTENCE HELPERS ---
  const saveToCache = async (key: string, data: any) => {
    try {
      const cacheObj = { uid: auth.currentUser?.uid, timestamp: Date.now(), data };
      await AsyncStorage.setItem(key, JSON.stringify(cacheObj));
    } catch (e) {
      console.error('Cache save error:', e);
    }
  };

  const loadFromCache = async () => {
    try {
      const keys = Object.values(CACHE_KEYS);
      const values = await AsyncStorage.multiGet(keys);
      let hasData = false;
      const currentUid = auth.currentUser?.uid;

      for (const [key, value] of values as [string, string | null][]) {
        if (value) {
          const cacheObj = JSON.parse(value);
          if (cacheObj.uid && cacheObj.uid !== currentUid) continue;
          const data = cacheObj.data;
          hasData = true;
          switch (key) {
            case CACHE_KEYS.PROFILE: setUserProfile(data); break;
            case CACHE_KEYS.COURSES: setCourses(data); break;
            case CACHE_KEYS.TASKS: setTasks(data); break;
            case CACHE_KEYS.SCHEDULE: setScheduleBlocks(data); break;
            case CACHE_KEYS.NOTES: setNotes(data); break;
            case CACHE_KEYS.NOTIFICATIONS: setNotifications(data); break;
            case CACHE_KEYS.NEXUS: setNexusResources(data); break;
          }
        }
      }
      return hasData;
    } catch (e) {
      console.error('Cache load error:', e);
      return false;
    }
  };

  const updateTask = async (updatedTask: any) => {
    if (!auth.currentUser) return;
    const ut = { ...updatedTask, id: String(updatedTask.id) };
    setTasks(prev => prev.map(t => String(t.id) === ut.id ? ut : t));
  };

  const addTask = async (newTask: any) => {
    if (!auth.currentUser) return;
    const nt = { ...newTask, id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` };
    setTasks(prev => [...prev, nt]);
  };

  const deleteTask = async (taskId: number | string) => {
    if (!auth.currentUser) return;
    setTasks(prev => prev.filter(t => String(t.id) !== String(taskId)));
  };

  const updateCourse = async (updatedCourse: any) => {
    if (!auth.currentUser) return;
    const uc = { ...updatedCourse, id: String(updatedCourse.id) };
    setCourses(prev => prev.map(c => String(c.id) === uc.id ? uc : c));
  };

  const addCourse = async (newCourse: any) => {
    if (!auth.currentUser) return;
    const id = `course_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const courseWithId = { ...newCourse, id, progress: 0, average: '0.00' };
    setCourses(prev => [...prev, courseWithId]);
  };

  const deleteCourse = async (courseId: string | number) => {
    if (!auth.currentUser) return;
    setCourses(prev => prev.filter(c => String(c.id) !== String(courseId)));
  };

  const addScheduleBlock = async (newBlock: any) => {
    if (!auth.currentUser) return;
    const newBlocks = [...scheduleBlocks, newBlock];
    setScheduleBlocks(newBlocks);
  };

  const batchUpdateCourseAndSchedule = async (updatedCourse: any, newBlocksForSubject: any[]) => {
    if (!auth.currentUser) return;
    const newCourses = courses.map(c => c.id.toString() === updatedCourse.id.toString() ? updatedCourse : c);
    const oldCourse = courses.find(c => c.id.toString() === updatedCourse.id.toString());
    const oldName = oldCourse?.name || updatedCourse.name;
    const otherSubjectsBlocks = scheduleBlocks.filter(b => b.subject !== oldName);
    const finalBlocks = [...otherSubjectsBlocks, ...newBlocksForSubject];
    setCourses(newCourses);
    setScheduleBlocks(finalBlocks);
  };

  const updateScheduleBlock = async (updatedBlock: any) => {
    if (!auth.currentUser) return;
    const newBlocks = scheduleBlocks.map(b => b.id === updatedBlock.id ? updatedBlock : b);
    setScheduleBlocks(newBlocks);
  };

  const deleteScheduleBlock = async (blockId: string) => {
    if (!auth.currentUser) return;
    const newBlocks = scheduleBlocks.filter(b => b.id !== blockId);
    setScheduleBlocks(newBlocks);
  };

  const batchUpdateScheduleBySubject = async (oldName: string, newName: string, newColor: string) => {
    const newBlocks = scheduleBlocks.map(b => {
      if (b.subject === oldName) return { ...b, subject: newName, color: newColor };
      return b;
    });
    setScheduleBlocks(newBlocks);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const newProfile = { ...userProfile, ...updates } as UserProfile;
    setUserProfile(newProfile);
  };

  const updateUserDirectly = async (uid: string, updates: any) => {
    if (!isAdmin) return;
    await db.collection('users').doc(uid).set(updates, { merge: true });
  };

  const updatePushTokenImmediately = async (token: string) => {
    if (!authUser?.uid) return;
    
    setIsSyncing(true);
    try {
        const uid = authUser.uid;
        // 1. Update local state
        const updates = { expoPushToken: token, push_status: 'active', push_last_sync: new Date().toISOString() };
        const newProfile = { ...userProfile, ...updates } as UserProfile;
        setUserProfile(newProfile);

        // 2. Direct Firestore update (Bypassing debounce)
        await db.collection('users').doc(uid).set({ 
            userProfile: { expoPushToken: token }, // For legacy/nested alignment
            expoPushToken: token,                  // For direct query alignment
            push_status: 'active'
        }, { merge: true });
        
        // console.log('📡 [DataContext] Push Token synced immediately to Cloud');
    } catch (e) {
        console.error('❌ [DataContext] Error syncing push token:', e);
    } finally {
        setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const updateNotes = async (newNotes: any[]) => {
    if (!auth.currentUser) return;
    const notesStr = JSON.stringify(newNotes);
    setNotes(notesStr);
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
    setUserProfile(prev => prev ? ({ ...prev, completedAchievements: [...(prev.completedAchievements || []), id] }) : null);
  };

  const addNotification = async (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { id?: string }) => {
    if (!auth.currentUser) return;
    const newNotif: AppNotification = { ...notif, id: notif.id || Date.now().toString(), timestamp: new Date().toISOString(), read: false };
    const newNotifications = [newNotif, ...notifications];
    setNotifications(newNotifications);
    await saveToCache(CACHE_KEYS.NOTIFICATIONS, newNotifications);
  };

  const markNotificationAsRead = async (id: string) => {
    if (!auth.currentUser) return;
    const newNotifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(newNotifications);
    await saveToCache(CACHE_KEYS.NOTIFICATIONS, newNotifications);
  };

  const markAllNotificationsAsRead = async () => {
    if (!auth.currentUser) return;
    const newNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(newNotifications);
    await saveToCache(CACHE_KEYS.NOTIFICATIONS, newNotifications);
  };

  const deleteNotification = async (id: string) => {
    if (!auth.currentUser) return;
    const newNotifications = notifications.filter(n => n.id !== id);
    setNotifications(newNotifications);
    await saveToCache(CACHE_KEYS.NOTIFICATIONS, newNotifications);
  };

  const clearNotifications = async () => {
    setNotifications([]);
    await saveToCache(CACHE_KEYS.NOTIFICATIONS, []);
  };

  const addNexusResource = async (newResource: any) => {
    const nrs = [newResource, ...nexusResources];
    setNexusResources(nrs);
    await saveToCache(CACHE_KEYS.NEXUS, nrs);
  };

  const updateNexusResource = async (updatedResource: any) => {
    const nrs = nexusResources.map(r => r.id === updatedResource.id ? updatedResource : r);
    setNexusResources(nrs);
    await saveToCache(CACHE_KEYS.NEXUS, nrs);
  };

  const deleteNexusResource = async (id: string) => {
    const nrs = nexusResources.filter(r => r.id !== id);
    setNexusResources(nrs);
    await saveToCache(CACHE_KEYS.NEXUS, nrs);
  };

  const getAllUsers = async () => {
    if (!isAdmin) return [];
    try {
        const snap = await db.collection('users').get();
        return snap.docs.map((d: any) => ({ uid: d.id, ...d.data() }));
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
        await db.collection('users').doc(uid).set({ ...backup }, { merge: true });
        setUserProfile(backup.userProfile); setCourses(backup.courses); setTasks(backup.tasks);
        setScheduleBlocks(backup.scheduleBlocks); setNotes(backup.notes); setNotifications(backup.notifications);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
        console.error('Restore error:', e);
    } finally { setIsSyncing(false); }
  };

  const syncData = async () => {
    if (!auth?.currentUser || isSyncing) return;
    setIsSyncing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
        await loadFirestoreData(auth.currentUser.uid, true);
        console.log('📡 [Manual Sync] Data refreshed from Cloud');
    } catch (e) {
        console.error('📡 [Manual Sync] Error:', e)
    } finally {
        setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const unsubscribeRef = React.useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (fbUser: any) => {
      setAuthUser(fbUser);
      if (!fbUser) {
        setUserProfile(null); 
        setCourses([]); 
        setTasks([]); 
        setIsDataFresh(false); 
        setIsLoading(false); 
      } else {
        // 🔥 CACHE-FIRST STRATEGY
        // 1. Try to load from local storage instantly
        const hasCache = await loadFromCache();
        if (hasCache) {
          // console.log('⚡ [Cortex Cache] Local data found. Instant Load triggered.');
          setIsLoading(false); 
          setIsCacheLoaded(true);
          // 2. Refresh from Cloud silently in the background
          loadFirestoreData(fbUser.uid, true);
        } else {
          // 3. If no cache, regular cloud load (blocks UI)
          // console.log('📡 [Cortex Cache] No local data. Fetching from Cloud...');
          loadFirestoreData(fbUser.uid);
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 📡 Real-time Global Config Listener (Broadcast Pro Support)
  useEffect(() => {
    if (!auth.currentUser) return;

    console.log('📡 [Global Config] Subscribing to system configuration...');
    const unsubscribeConfig = db.collection('system').doc('config').onSnapshot((snap: any) => {
      if (snap.exists) {
        const data = snap.data();
        console.log('📡 [Global Config] Received update from Cloud');
        setGlobalConfig(data as GlobalConfig);
      }
    }, (error: any) => {
      console.error('📡 [Global Config] Subscription error:', error);
    });

    return () => unsubscribeConfig();
  }, [authUser?.uid]);

  const loadFirestoreData = async (uid: string, silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    try {
      const docSnap = await db.collection('users').doc(uid).get();
      const exists = typeof docSnap.exists === 'function' ? docSnap.exists() : docSnap.exists;
      
      if (exists) { 
        const data = docSnap.data();
        if (data) {
          const profile = { 
            ...(data.userProfile || {}), 
            uid: uid, // 👈 CRITICAL: Ensure UID is present
            role: data.role || 'student' 
          };
          const c = (data.courses || data.userProfile?.courses || []).map((i: any) => ({ ...i, id: String(i.id) }));
          const t = (data.tasks || data.userProfile?.tasks || []).map((i: any) => ({ ...i, id: String(i.id), courseId: i.courseId ? String(i.courseId) : null }));
          
          setUserProfile(profile);
          setCourses(c as any[]);
          setTasks(t as any[]);
          setScheduleBlocks(data.scheduleBlocks || data.userProfile?.scheduleBlocks || []); 
          setNotes(data.notes || data.userProfile?.notes || '');
          setNotifications(data.notifications || []);
          setNexusResources(data.nexusResources || []);
          
          // 💾 IMMEDIATE CACHE UPDATE
          saveToCache(CACHE_KEYS.PROFILE, profile);
          saveToCache(CACHE_KEYS.COURSES, c);
          saveToCache(CACHE_KEYS.TASKS, t);
          saveToCache(CACHE_KEYS.SCHEDULE, data.scheduleBlocks || []);
          saveToCache(CACHE_KEYS.NOTES, data.notes || '');

          lastSyncDataRef.current = { userProfile: profile, courses: c, tasks: t, notes: data.notes };
          setIsDataFresh(true);
        }
      }
    } catch (e) {
      console.error('📡 [Simplified Sync] Load Error:', e);
    } finally {
      isInitialLoadFinished.current = true;
      setIsLoading(false);
    }
  };

  // 🚀 SIMPLIFIED SYNC EFFECT (One-way)
  useEffect(() => {
    if (!authUser?.uid || !isInitialLoadFinished.current || isLoading) return;
    
    // Comparación simple para evitar disparos inútiles
    const currentStr = JSON.stringify({ userProfile, courses, tasks, notes });
    const lastStr    = lastSyncDataRef.current ? JSON.stringify({ 
        userProfile: lastSyncDataRef.current.userProfile, 
        courses: lastSyncDataRef.current.courses, 
        tasks: lastSyncDataRef.current.tasks, 
        notes: lastSyncDataRef.current.notes
    }) : null;

    if (currentStr === lastStr) return;

    const syncTimeout = setTimeout(async () => {
        setIsSyncing(true);
        try {
            const syncPayload = JSON.parse(JSON.stringify({
                userProfile: userProfile || null,
                courses: courses || [],
                tasks: tasks || [],
                scheduleBlocks: scheduleBlocks || [],
                notes: notes || '',
                notifications: notifications || [],
                nexusResources: nexusResources || [],
                lastSync: new Date().toISOString()
            }));
            await db.collection('users').doc(authUser.uid).set(syncPayload);
            
            // 💾 SYNC CACHE AS WELL
            saveToCache(CACHE_KEYS.PROFILE, userProfile);
            saveToCache(CACHE_KEYS.COURSES, courses);
            saveToCache(CACHE_KEYS.TASKS, tasks);
            saveToCache(CACHE_KEYS.SCHEDULE, scheduleBlocks);
            saveToCache(CACHE_KEYS.NOTES, notes);

            lastSyncDataRef.current = JSON.parse(JSON.stringify({ userProfile, courses, tasks, notes }));
            // console.log('📡 [Simplified Sync] Cloud Save Success');
        } catch (e) {
            console.error('📡 [Simplified Sync] Save Error:', e);
        } finally {
            setTimeout(() => setIsSyncing(false), 800);
        }
    }, 2000);

    return () => clearTimeout(syncTimeout);
  }, [userProfile, courses, tasks, scheduleBlocks, notes, notifications, nexusResources, isLoading, authUser?.uid]);

  return (
    <DataContext.Provider value={{ 
      userProfile, courses, tasks, scheduleBlocks, notes, isLoading, isSyncing, isDataFresh, authUser, isConnected, isAdmin, role, globalConfig,
      updateTask, addTask, deleteTask, updateCourse, addCourse, deleteCourse, addScheduleBlock, updateScheduleBlock, deleteScheduleBlock,
      batchUpdateScheduleBySubject, updateUserProfile, updateUserDirectly, updateNotes, addAchievement, notifications, addNotification,
      markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearNotifications, nexusResources, addNexusResource, updateNexusResource, deleteNexusResource,
      getAllUsers, updateGlobalConfig, syncData, restoreData, triggerLocalBroadcast, batchUpdateCourseAndSchedule, hardReset, updatePushTokenImmediately
    }}>
      {children}
    </DataContext.Provider>
  );
};
// --- HELPER PARA RESOLVER COLORES DE MARCA ---
export const resolveColor = (c: string) => {
  if (!c) return '#06B6D4';
  if (c.startsWith('#')) return c;
  const map: Record<string, string> = {
    'cyan': '#06B6D4',
    'emerald': '#34D399',
    'indigo': '#6366F1',
    'violet': '#A78BFA',
    'royal': '#A78BFA',
    'rose': '#FB7185',
    'amber': '#F59E0B',
    'sky': '#3B82F6',
    'midnight': '#2E1065',
    'cortex': '#06B6D4'
  };
  const key = (c.split('#')[0] || '').toLowerCase();
  return map[key as keyof typeof map] || '#06B6D4';
};

export const useData = () => useContext(DataContext);
