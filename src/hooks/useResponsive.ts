import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS, ScreenType } from '../constants/layout';

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isPhone = width < BREAKPOINTS.PHONE;
  const isTablet = width >= BREAKPOINTS.PHONE && width < BREAKPOINTS.LAPTOP;
  const isLaptop = width >= BREAKPOINTS.LAPTOP;

  // Pixel 9 Pro Fold detection (opened)
  // Standard foldables have a width around 600-800 when open
  const isFoldable = width > 500 && width < 900;

  let screenType: ScreenType = 'phone';
  if (isTablet) screenType = 'tablet';
  if (isLaptop) screenType = 'laptop';

  // Helper for grid layouts
  const getColumns = (phone: number, tablet: number, laptop: number) => {
    if (isPhone) return phone;
    if (isTablet) return tablet;
    return laptop;
  };

  return {
    width,
    height,
    isPhone,
    isTablet,
    isLaptop,
    isFoldable,
    screenType,
    getColumns,
    // Content should not be too wide on large screens
    contentWidth: isPhone ? '100%' : Math.min(width, 1400),
    isLandscape: width > height,
  };
};
