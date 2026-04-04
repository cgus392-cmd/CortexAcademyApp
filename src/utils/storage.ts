import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  SCHEDULE_CACHE: '@cortex_schedule_cache',
  OFFLINE_MODE_FLAG: '@cortex_offline_flag',
};

export const cacheData = async (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Error caching data:', e);
  }
};

export const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error reading cached data:', e);
    return null;
  }
};
