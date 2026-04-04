import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Timer, Coffee, Play } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolateColor,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AppTab } from '../types';
import { MatteUnderlay as GlassLayers } from './design-system/CortexMatte';

interface TimerDetail {
    timeLeft: number;
    focusMode: string;
    isActive: boolean;
}

interface Props {
    activeTab: AppTab;
    onNavigate: (tab: AppTab) => void;
}

// In React Native, global events are usually handled by Context, Redux, Zustand or an event emitter.
// For standard parity with your existing code, we will simulate the listener.
import { DeviceEventEmitter } from 'react-native';

export const CortexCoreWidget: React.FC<Props> = ({ activeTab, onNavigate }) => {
    const insets = useSafeAreaInsets();
    const [timerState, setTimerState] = useState<TimerDetail | null>(null);

    const widgetY = useSharedValue(-100);
    const widgetScale = useSharedValue(0.8);
    const widgetOpacity = useSharedValue(0);

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('timer-update', (detail: TimerDetail) => {
            setTimerState(detail);
        });

        return () => {
            sub.remove();
        };
    }, []);

    const shouldShow = timerState && timerState.isActive && activeTab !== 'cronos';

    useEffect(() => {
        if (shouldShow) {
            widgetY.value = withSpring(insets.top + 10, { stiffness: 200, damping: 20 });
            widgetScale.value = withSpring(1, { stiffness: 200, damping: 20 });
            widgetOpacity.value = withTiming(1, { duration: 300 });
        } else {
            widgetY.value = withSpring(-100);
            widgetScale.value = withSpring(0.8);
            widgetOpacity.value = withTiming(0, { duration: 300 });
        }
    }, [shouldShow]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: widgetY.value },
                { scale: widgetScale.value }
            ],
            opacity: widgetOpacity.value,
        };
    });

    // If it shouldn't show AND the animation is done, don't render to save resources
    if (!shouldShow && widgetOpacity.value === 0) return null;

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onNavigate('cronos');
                }}
                style={styles.pill}
            >
                <GlassLayers
                    radius={999}
                   
                    base="rgba(12,14,18,0.82)"
                   
                   
                />
                <View style={styles.iconContainer}>
                    {timerState?.focusMode === 'work' ? (
                        <Timer color="#4f46e5" size={18} />
                    ) : (
                        <Coffee color="#10b981" size={18} />
                    )}
                    {/* Pulsing indicator could be added here with another sharedValue */}
                    <View style={[styles.dot, { backgroundColor: timerState?.focusMode === 'work' ? '#4f46e5' : '#10b981' }]} />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.label}>
                        {timerState?.focusMode === 'work' ? 'ESTUDIANDO' : 'DESCANSO'}
                    </Text>
                    <Text style={styles.timeValue}>
                        {timerState ? formatTime(timerState.timeLeft) : '00:00'}
                    </Text>
                </View>

                <View style={styles.actionCircle}>
                    <Play color="white" size={12} fill="white" style={{ marginLeft: 2 }} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
    },
    pill: {
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 9999,
        overflow: 'hidden',
        gap: 12,
    },
    iconContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    textContainer: {
        flexDirection: 'column',
    },
    label: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    timeValue: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    actionCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
