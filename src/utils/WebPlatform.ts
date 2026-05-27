import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';

export const getWebPlatform = (): 'ios' | 'android' | 'windows' | 'mac' | 'other' => {
  if (!isWeb || typeof window === 'undefined') return 'other';
  const ua = window.navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/windows/.test(ua)) return 'windows';
  if (/mac os/.test(ua)) return 'mac';
  return 'other';
};

export const isStandalonePWA = (): boolean => {
  if (!isWeb || typeof window === 'undefined') return false;
  
  // iOS Safari Standalone
  if (('standalone' in window.navigator) && (window.navigator as any).standalone) return true;
  
  // Standard PWA
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  
  return false;
};
