import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, StyleProp, Image, Platform, Share } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight, Sparkles, StickyNote, Copy, Share as ShareIcon, Check, Pin } from 'lucide-react-native';
import { Svg, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

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
    const { compactMode } = theme;
    return (
        <TouchableOpacity activeOpacity={0.7} style={[styles.actionContainer, compactMode && { width: 60 }]} onPress={onPress}>
            <MatteCard 
                radius={compactMode ? 20 : 24} 
                style={{ width: compactMode ? 52 : 68, height: compactMode ? 52 : 68, alignItems: 'center', justifyContent: 'center', marginBottom: compactMode ? 4 : 8 }}
            >
                <Icon size={compactMode ? 22 : 28} color={theme.text} strokeWidth={2.2} />
            </MatteCard>
            <Text style={[styles.actionLabel, { color: theme.textSecondary }, compactMode && { fontSize: 10, marginTop: 4 }]}>{label}</Text>
        </TouchableOpacity>
    );
};


export const MatteBanner = ({ title, subtitle, icon: Icon, color, onPress }: { title: string, subtitle: any, icon: any, color: string, onPress: () => void }) => {
    const { theme } = useTheme();
    const { compactMode } = theme;
    return (
        <MatteCard onPress={onPress} style={{ width: '100%', flexDirection: 'row', alignItems: 'center', padding: compactMode ? 12 : 16 }}>
            {/* Left Edge Indicator */}
            <LinearGradient
                colors={[`${color}25`, 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[StyleSheet.absoluteFill, { borderRadius: compactMode ? 20 : 28, width: '40%' }]}
            />
            <View style={[StyleSheet.absoluteFill, {
                borderRadius: compactMode ? 20 : 28,
                borderWidth: 1,
                borderColor: 'transparent',
                borderLeftWidth: 2,
                borderLeftColor: color,
            }]} />

            <View style={{ width: compactMode ? 36 : 44, height: compactMode ? 36 : 44, borderRadius: compactMode ? 18 : 22, backgroundColor: `${color}15`, alignItems: 'center', justifyContent: 'center', marginRight: compactMode ? 10 : 14 }}>
               <Icon size={compactMode ? 20 : 24} color={color} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <Sparkles size={compactMode ? 8 : 10} color={color} />
                    <Text style={{ fontSize: compactMode ? 9 : 10, fontWeight: '800', color: color, letterSpacing: 0.5 }}>SMART CONTEXT</Text>
                </View>
                <Text style={{ fontSize: compactMode ? 16 : 18, fontWeight: '800', color: theme.text, letterSpacing: -0.5 }}>{title}</Text>
                <Text style={{ fontSize: compactMode ? 11 : 13, color: theme.textSecondary, fontWeight: '500' }}>{subtitle}</Text>
            </View>
            <ChevronRight size={compactMode ? 16 : 20} color={theme.textSecondary} />
        </MatteCard>
    );
};


export const MatteMemoCard = ({ text, color, onPress }: { text: string, color: string, onPress: () => void }) => {
    const { theme } = useTheme();
    const { compactMode } = theme;
    return (
        <MatteCard 
           radius={compactMode ? 16 : 20} 
           style={{ width: compactMode ? 120 : 140, height: compactMode ? 120 : 150, padding: compactMode ? 12 : 16, marginRight: compactMode ? 12 : 16 }}
           onPress={onPress}
           baseColor={theme.isDark ? '#232325' : '#FFFFFF'} 
        >
           {/* Color Accent dot */}
           <View style={{ position: 'absolute', top: compactMode ? 10 : 12, right: compactMode ? 10 : 12, width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
           
           <StickyNote size={compactMode ? 16 : 18} color={color} style={{ marginBottom: compactMode ? 6 : 10 }} />
           <Text style={{ fontSize: compactMode ? 11 : 13, lineHeight: compactMode ? 16 : 18, color: theme.text, fontWeight: '500' }} numberOfLines={compactMode ? 3 : 4}>
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
    const { compactMode } = theme;
    return (
        <MatteCard 
           radius={compactMode ? 20 : 24} 
           style={{ width: compactMode ? 180 : 220, padding: compactMode ? 14 : 20, marginRight: compactMode ? 12 : 16, justifyContent: 'space-between' }}
           onPress={onPress}
        >
            <View>
                <Text style={{ fontSize: compactMode ? 16 : 18, fontWeight: '800', color: theme.text, marginBottom: 4, letterSpacing: -0.5 }} numberOfLines={2}>
                    {name}
                </Text>
                <Text style={{ fontSize: compactMode ? 11 : 12, fontWeight: '700', color: theme.textSecondary }}>{code}</Text>
            </View>
            
            <View style={{ marginTop: compactMode ? 16 : 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: compactMode ? 6 : 8 }}>
                    <Text style={{ fontSize: compactMode ? 11 : 13, fontWeight: '600', color: theme.textSecondary }}>Promedio</Text>
                    <Text style={{ fontSize: compactMode ? 16 : 18, fontWeight: '800', color: color }}>{average}</Text>
                </View>
                <View style={{ width: '100%', height: compactMode ? 4 : 6, borderRadius: 3, backgroundColor: theme.isDark ? '#333' : '#F0F0F0', overflow: 'hidden' }}>
                    <View style={{ width: `${Math.min(100, progress)}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
                </View>
                
                {accumulatedScore !== undefined && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: compactMode ? 6 : 8 }}>
                        <Text style={{ fontSize: compactMode ? 8 : 9, fontWeight: '800', color: theme.textSecondary, letterSpacing: 0.5 }}>PROGRESO: {progress}%</Text>
                        <Text style={{ fontSize: compactMode ? 8 : 9, fontWeight: '800', color: theme.textSecondary }}>ACUMULADA: {accumulatedScore}/5.0</Text>
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
    },
    integratedTail: {
        width: 14,
        height: 14,
        transform: [{ rotate: '45deg' }],
        zIndex: 1,
        marginTop: 6,
    }
});

/**
 * Premium Chat Bubble for Cortex IA
 */
export const MatteChatBubble = ({ role, content, rawTextForActions, color, children }: { role: 'user' | 'assistant', content?: string, rawTextForActions?: string, color?: string, children?: React.ReactNode }) => {
    const { theme } = useTheme();
    const isUser = role === 'user';
    const isDark = theme.isDark;
    const bgColor = isUser ? (color || theme.primary) : (isDark ? '#232326' : '#F0F0F5');
    const [copied, setCopied] = useState(false);
    const [pinned, setPinned] = useState(false);

    const handleCopy = async () => {
        if (!rawTextForActions) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await Clipboard.setStringAsync(rawTextForActions);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (!rawTextForActions) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            await Share.share({ message: rawTextForActions });
        } catch (error) {}
    };

    return (
        <View style={{ 
            flexDirection: isUser ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            marginBottom: 4,
            flexShrink: 1,
        }}>
            {/* Integrated Tail - In Flow */}
            <View style={[
                styles.integratedTail,
                { 
                    backgroundColor: bgColor,
                    [isUser ? 'marginLeft' : 'marginRight']: -8,
                    marginTop: 6,
                    zIndex: 1,
                    [isUser ? 'borderRightWidth' : 'borderLeftWidth']: 1,
                    [isUser ? 'borderRightColor' : 'borderLeftColor']: isUser ? 'rgba(255,255,255,0.1)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                    borderTopWidth: 1,
                    borderTopColor: isUser ? 'rgba(255,255,255,0.1)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                }
            ]} />
            
            <MatteCard 
                radius={18}
                baseColor={bgColor}
                style={[
                    styles.bubble,
                    {
                        borderTopRightRadius: isUser ? 0 : 18,
                        borderTopLeftRadius: isUser ? 18 : 0,
                        borderWidth: 1,
                        borderColor: isUser ? 'rgba(255,255,255,0.1)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                        paddingHorizontal: 15,
                        paddingVertical: 12,
                        elevation: 0,
                        zIndex: 2,
                        flexShrink: 1,
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

            {!isUser && rawTextForActions && (
                <View style={{ flexDirection: 'row', marginTop: 8, marginLeft: 16, gap: 16, alignItems: 'center' }}>
                    <TouchableOpacity 
                        onPress={handleCopy} 
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} color={theme.textMuted} />}
                        <Text style={{ fontSize: 13, color: copied ? '#10B981' : theme.textMuted, marginLeft: 6, fontWeight: '500' }}>
                            {copied ? 'Copiado' : 'Copiar'}
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={handleShare} 
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ShareIcon size={16} color={theme.textMuted} />
                        <Text style={{ fontSize: 13, color: theme.textMuted, marginLeft: 6, fontWeight: '500' }}>Compartir</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setPinned(!pinned);
                        }} 
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Pin size={16} color={pinned ? theme.primary : theme.textMuted} />
                        <Text style={{ fontSize: 13, color: pinned ? theme.primary : theme.textMuted, marginLeft: 6, fontWeight: '500' }}>
                            {pinned ? 'Fijado' : 'Fijar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
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
            <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 60 }}>
                <Image
                    source={{ 
                        uri: `https://latex.codecogs.com/png.latex?\\huge\\color{${theme.isDark ? 'White' : 'Black'}} ${encodeURIComponent(formula.trim())}` 
                    }}
                    style={{ 
                        width: '100%', 
                        height: 100, // Altura base, se ajustará con contain
                        resizeMode: 'contain'
                    }}
                />
            </View>
            <View style={{ marginTop: 12, height: 1, backgroundColor: color + '10', width: '100%' }} />
        </View>
    );
};

/**
 * Neural Content Renderer with Typewriter Effect
 */
export const MatteNeuralContent = ({ 
    content, 
    animate = false,
    forceStop = false,
    onComplete
}: { 
    content: string, 
    animate?: boolean,
    forceStop?: boolean,
    onComplete?: () => void
}) => {
    const { theme } = useTheme();
    const isDark = theme.isDark;
    const [wordIndex, setWordIndex] = useState(animate ? 0 : content.split(' ').length);
    const [isFinished, setIsFinished] = useState(!animate);
    const words = useRef(content.split(' '));
    const currentIndexRef = useRef(animate ? 0 : content.split(' ').length);

    useEffect(() => {
        words.current = content.split(' ');
        if (!animate) {
            setWordIndex(words.current.length);
            currentIndexRef.current = words.current.length;
            setIsFinished(true);
            return;
        }

        setWordIndex(0);
        currentIndexRef.current = 0;
        setIsFinished(false);
        
        const interval = setInterval(() => {
            if (forceStop) {
                clearInterval(interval);
                setIsFinished(true);
                onComplete?.();
                setWordIndex(words.current.length);
                currentIndexRef.current = words.current.length;
                return;
            }

            if (currentIndexRef.current < words.current.length) {
                currentIndexRef.current += 1;
                setWordIndex(currentIndexRef.current);
            } else {
                clearInterval(interval);
                setIsFinished(true);
                onComplete?.();
            }
        }, 40); // Un poco más lento para suavidad

        return () => clearInterval(interval);
    }, [content, animate, forceStop]);

    const displayedText = words.current.slice(0, wordIndex).join(' ');


    const renderInlineMarkdown = (text: string, isHeading: boolean = false) => {
        const parts = text.split(/(\*\*.*?\*\*|\$.*?\$|\*.*?\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <Text key={i} style={{ fontWeight: 'bold' }}>{part.slice(2, -2)}</Text>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <Text key={i} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</Text>;
            }
            if (part.startsWith('$') && part.endsWith('$')) {
                const math = part.slice(1, -1).trim();
                return (
                    <Image 
                        key={i}
                        source={{ uri: `https://latex.codecogs.com/png.latex?\\color{${isDark ? 'White' : 'Black'}}${encodeURIComponent(math)}` }}
                        style={{ height: isHeading ? 22 : 18, width: Math.max(20, math.length * 8), resizeMode: 'contain' }}
                    />
                );
            }
            return <Text key={i}>{part}</Text>;
        });
    };

    const renderStructure = (text: string) => {
        const parts = text.split(/(\$\$[\s\S]*?\$\$)/g);
        return parts.map((part, index) => {
            if (part.startsWith('$$') && part.endsWith('$$')) {
                const formula = part.substring(2, part.length - 2);
                return <MatteFormula key={index} formula={formula} color={theme.primary} />;
            }
            
            const lines = part.split('\n');
            return (
                <View key={index} style={{ width: '100%' }}>
                    {lines.map((line, i) => {
                        if (line.trim() === '') return <View key={i} style={{ height: 10 }} />;
                        
                        let style: any = { color: theme.text, fontSize: 15, lineHeight: 22, marginBottom: 4 };
                        let prefix = '';
                        
                        if (line.trim().startsWith('### ')) {
                            style = { fontSize: 18, fontWeight: 'bold', color: theme.text, marginTop: 12, marginBottom: 8 };
                            prefix = '### ';
                        } else if (line.trim().startsWith('## ')) {
                            style = { fontSize: 20, fontWeight: 'bold', color: theme.text, marginTop: 12, marginBottom: 8 };
                            prefix = '## ';
                        } else if (line.trim().startsWith('# ')) {
                            style = { fontSize: 24, fontWeight: 'bold', color: theme.text, marginTop: 12, marginBottom: 8 };
                            prefix = '# ';
                        }

                        return (
                            <MotiView
                                key={i}
                                from={animate ? { opacity: 0, translateY: 5 } : false}
                                animate={{ opacity: 1, translateY: 0 }}
                                transition={{ type: 'timing', duration: 400 }}
                            >
                                <Text style={style}>
                                    {renderInlineMarkdown(line.replace(prefix, '').trim(), prefix !== '')}
                                </Text>
                            </MotiView>
                        );
                    })}
                </View>
            );
        });
    };

    return (
        <View style={{ width: '100%' }}>
            {renderStructure(displayedText)}
        </View>
    );
};
