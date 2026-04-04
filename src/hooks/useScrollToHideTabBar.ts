import { useRef, useCallback } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { globalEmitter } from '../utils/EventEmitter';

export function useScrollToHideTabBar(threshold = 40) {
  const lastOffsetY = useRef(0);
  const isTabBarVisible = useRef(true); // Default state of CustomTabBar

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffsetY = event.nativeEvent.contentOffset.y;
    
    // Always show at the very top (e.g. bounce effect on iOS or pulling down to refresh)
    if (currentOffsetY <= 0) {
      if (!isTabBarVisible.current) {
        isTabBarVisible.current = true;
        globalEmitter.emit('toggleTabBar', true);
      }
      lastOffsetY.current = currentOffsetY;
      return;
    }

    const diff = currentOffsetY - lastOffsetY.current;

    if (diff > threshold) {
      // Scrolling down and exceeded threshold -> Hide the bar
      if (isTabBarVisible.current) {
        isTabBarVisible.current = false;
        globalEmitter.emit('toggleTabBar', false);
      }
      lastOffsetY.current = currentOffsetY;
    } else if (diff < -threshold) {
      // Scrolling up and exceeded threshold -> Show the bar
      if (!isTabBarVisible.current) {
        isTabBarVisible.current = true;
        globalEmitter.emit('toggleTabBar', true);
      }
      lastOffsetY.current = currentOffsetY;
    }
  }, [threshold]);

  return handleScroll;
}
