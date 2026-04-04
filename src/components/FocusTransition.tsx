import React from 'react';
import { MotiView } from 'moti';
import { useIsFocused } from '@react-navigation/native';

export default function FocusTransition({
  children,
  style,
  offset = 8,
  duration = 220,
}: {
  children: React.ReactNode;
  style?: any;
  offset?: number;
  duration?: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: offset }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration }}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </MotiView>
  );
}
