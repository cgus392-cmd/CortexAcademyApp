import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, StyleProp, Image, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight, Sparkles, StickyNote } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ============================================
// CORTEX MATTE UI SYSTEM (PATENTABLE DESIGN)
// ============================================

import { BlurView } from 'expo-blur';

export interface MatteCardProps {
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    radius?: number;
    onPress?: () => void;
    baseColor?: string;
}

export const MatteCard = ({ children, style, radius = 28, onPress, baseColor }: MatteCardProps) => {
    const { theme } = useTheme();
    const { compactMode, performanceMode } = theme;
    const Container: any = onPress ? TouchableOpacity : View;
    
    // Official Matte OS Solid Base
    const isLowPerf = performanceMode === 'eco' || performanceMode === 'ahorro';
    const bgColor = baseColor || (theme.isDark ? '#1C1C1E' : '#FFFFFF');
    
    // Compact Overrides
    const finalRadius = compactMode ? Math.min(radius, 20) : radius;

    return (
        <Container 
            activeOpacity={0.8}
            onPress={onPress}
            style={[
                styles.baseCard, 
                {
                    borderRadius: finalRadius,
                    shadowOpacity: 0,
                    shadowRadius: 0,
                    elevation: 0,
                    borderWidth: 1,
                    borderColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    backgroundColor: isLowPerf ? bgColor : 'transparent', 
                    overflow: 'hidden',
                    padding: compactMode ? 12 : 0, // Default padding for compact lists if child is text
                },
                style
            ]}
        >
            {/* Base Glass/Matte Layer */}
            {!isLowPerf && (
                <BlurView 
                    intensity={performanceMode === 'ultra' ? 90 : 40}
                    tint={theme.isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                />
            )}
            
            {/* Solid Mask for better contrast */}
            <View style={[StyleSheet.absoluteFill, { 
                backgroundColor: bgColor, 
                opacity: isLowPerf ? 1 : 0.8, 
                borderRadius: finalRadius, 
                zIndex: -1 
            }]} />
            
            {/* Content Overlay */}
            {children}
        </Container>
    );
};


export const MatteActionBtn = ({ icon: Icon, label, onPress }: { icon: any, label: string, onPress: () => void }) => {
    const { theme } = useTheme();
    return (
        <TouchableOpacity activeOpacity={0.7} style={styles.actionContainer} onPress={onPress}>
            <MatteCard 
                radius={24} 
                style={{ width: 68, height: 68, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}
            >
                <Icon size={28} color={theme.text} strokeWidth={2.2} />
            </MatteCard>
            <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>{label}</Text>
        </TouchableOpacity>
    );
};


export const MatteBanner = ({ title, subtitle, icon: Icon, color, onPress }: { title: string, subtitle: string, icon: any, color: string, onPress: () => void }) => {
    const { theme } = useTheme();
    return (
        <MatteCard onPress={onPress} style={{ width: '100%', flexDirection: 'row', alignItems: 'center', padding: 16 }}>
            {/* Left Edge Indicator */}
            <LinearGradient
                colors={[`${color}25`, 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 28, width: '40%' }]}
            />
            <View style={[StyleSheet.absoluteFill, {
                borderRadius: 28,
                borderWidth: 1,
                borderColor: 'transparent',
                borderLeftWidth: 2,
                borderLeftColor: color,
            }]} />

            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${color}15`, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
               <Icon size={24} color={color} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <Sparkles size={10} color={color} />
                    <Text style={{ fontSize: 10, fontWeight: '800', color: color, letterSpacing: 0.5 }}>SMART CONTEXT</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, letterSpacing: -0.5 }}>{title}</Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '500' }}>{subtitle}</Text>
            </View>
            <ChevronRight size={20} color={theme.textSecondary} />
        </MatteCard>
    );
};


export const MatteMemoCard = ({ text, color, onPress }: { text: string, color: string, onPress: () => void }) => {
    const { theme } = useTheme();
    return (
        <MatteCard 
           radius={20} 
           style={{ width: 140, height: 150, padding: 16, marginRight: 16 }}
           onPress={onPress}
           baseColor={theme.isDark ? '#232325' : '#FFFFFF'} 
        >
           {/* Color Accent dot */}
           <View style={{ position: 'absolute', top: 12, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
           
           <StickyNote size={18} color={color} style={{ marginBottom: 10 }} />
           <Text style={{ fontSize: 13, lineHeight: 18, color: theme.text, fontWeight: '500' }} numberOfLines={4}>
               {text}
           </Text>
        </MatteCard>
    );
};


export const MatteCourseCard = ({ 
    name, 
    code, 
    average, 
    color, 
    progress, 
    accumulatedScore,
    onPress 
}: { 
    name: string, 
    code: string, 
    average: string, 
    color: string, 
    progress: number, 
    accumulatedScore?: string | number,
    onPress: () => void 
}) => {
    const { theme } = useTheme();
    return (
        <MatteCard 
           radius={24} 
           style={{ width: 220, padding: 20, marginRight: 16, justifyContent: 'space-between' }}
           onPress={onPress}
        >
            <View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 4, letterSpacing: -0.5 }} numberOfLines={2}>
                    {name}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>{code}</Text>
            </View>
            
            <View style={{ marginTop: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary }}>Promedio</Text>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: color }}>{average}</Text>
                </View>
                <View style={{ width: '100%', height: 6, borderRadius: 3, backgroundColor: theme.isDark ? '#333' : '#F0F0F0', overflow: 'hidden' }}>
                    <View style={{ width: `${Math.min(100, progress)}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
                </View>
                
                {accumulatedScore !== undefined && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: theme.textSecondary, letterSpacing: 0.5 }}>PROGRESO: {progress}%</Text>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: theme.textSecondary }}>ACUMULADA: {accumulatedScore}/5.0</Text>
                    </View>
                )}
            </View>
        </MatteCard>
    );
};


export const MatteIconButton = ({ onPress, size = 44, radius, icon: Icon, children, tint, style, iconSize = 20, iconColor }: any) => {
    const { theme } = useTheme();
    const { isDark, performanceMode } = theme;
    const computedRadius = radius || (size / 2);
    const isLowPerf = performanceMode === 'eco' || performanceMode === 'ahorro';
    const finalIconColor = iconColor || theme.text;
    
    return (
        <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={onPress} 
            style={[
                { 
                    width: size, 
                    height: size, 
                    borderRadius: computedRadius,
                    alignItems: 'center', 
                    justifyContent: 'center',
                    overflow: 'hidden',
                    backgroundColor: isLowPerf 
                        ? (isDark ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.95)') 
                        : (isDark ? 'rgba(20,20,24,0.3)' : 'rgba(255,255,255,0.2)'),
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
                }, 
                style
            ]}
        >
            {!isLowPerf && (
                <BlurView 
                    intensity={performanceMode === 'ultra' ? 80 : 35}
                    tint={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                />
            )}
            {/* Si hay tint, usamos BlurView sutil para profundidad en modo claro */}
            {tint && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: tint, opacity: isDark ? 0.4 : 0.6 }]} />
            )}
            
            {Icon ? (
                <Icon size={iconSize} color={finalIconColor} strokeWidth={2.5} />
            ) : (
                children
            )}
        </TouchableOpacity>
    );
};

export const MatteUnderlay = ({ radius = 28, baseColor }: any) => {
    const { theme } = useTheme();
    const bgColor = baseColor || (theme.isDark ? '#1C1C1E' : '#FFFFFF');
    return (
        <View 
            style={[
                StyleSheet.absoluteFill, 
                { 
                    borderRadius: radius, 
                    backgroundColor: bgColor,
                    overflow: 'hidden' 
                }
            ]} 
        />
    );
};

const styles = StyleSheet.create({
    baseCard: {
        overflow: 'hidden',
    },
    actionContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 76,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 6,
    },
    // Chat Specifics
    bubble: {
        maxWidth: '85%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        elevation: 0,
        shadowOpacity: 0,
    },
    formulaContainer: {
        marginTop: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    }
});

/**
 * Premium Chat Bubble for Cortex IA
 */
export const MatteChatBubble = ({ role, content, color, children }: { role: 'user' | 'assistant', content?: string, color?: string, children?: React.ReactNode }) => {
    const { theme } = useTheme();
    const isUser = role === 'user';
    const isDark = theme.isDark;

    return (
        <View style={{ 
            alignSelf: isUser ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            marginBottom: 12,
        }}>
            <MatteCard 
                radius={20}
                baseColor={isUser ? (color || theme.primary) : (isDark ? 'rgba(40,40,45,0.4)' : 'rgba(255,255,255,0.7)')}
                style={[
                    styles.bubble,
                    {
                        borderBottomRightRadius: isUser ? 4 : 20,
                        borderBottomLeftRadius: isUser ? 20 : 4,
                        borderWidth: 1,
                        borderColor: isUser ? 'rgba(255,255,255,0.1)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                    }
                ]}
            >
                {content ? (
                    <Text style={{ 
                        fontSize: 15, 
                        lineHeight: 22, 
                        color: isUser ? '#FFFFFF' : theme.text,
                        fontWeight: isUser ? '600' : '500'
                    }}>
                        {content}
                    </Text>
                ) : children}
            </MatteCard>
        </View>
    );
};

/**
 * Scientific Formula Container (LaTeX Style)
 */
export const MatteFormula = ({ formula, color }: { formula: string, color: string }) => {
    const { theme } = useTheme();
    return (
        <View style={[
            styles.formulaContainer, 
            { 
                backgroundColor: theme.isDark ? '#0F172A' : '#F8FAFC',
                borderColor: color + '30',
                borderWidth: 1.5,
                borderLeftWidth: 4,
                borderLeftColor: color,
                padding: 18,
                marginVertical: 12,
                borderRadius: 4,
                width: '100%'
            }
        ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <View style={{ width: 4, height: 4, transform: [{rotate: '45deg'}], backgroundColor: color }} />
                <Text style={{ fontSize: 10, fontWeight: '900', color: color, letterSpacing: 2 }}>CORE.MATH ENGINE</Text>
            </View>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ 
                    fontSize: 20, 
                    color: theme.isDark ? '#E2E8F0' : '#1E293B', 
                    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                    textAlign: 'center',
                    lineHeight: 28,
                    fontWeight: '700',
                    fontStyle: 'italic'
                }}>
                    {formula}
                </Text>
            </View>
            <View style={{ marginTop: 12, height: 1, backgroundColor: color + '10', width: '100%' }} />
        </View>
    );
};

