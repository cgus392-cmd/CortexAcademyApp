import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal, TouchableOpacity, Linking, Platform, ScrollView, DeviceEventEmitter } from 'react-native';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, ArrowRight, Circle } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import * as Application from 'expo-application';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { isUpdateAvailable } from '../utils/versionCheck';
import { CheckCircle2, Loader2 } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function UpdateManager() {
    const { globalConfig } = useData();
    const { theme, isDark } = useTheme();
    const [isVisible, setIsVisible] = useState(false);
    const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'uptodate'>('idle');
    
    // Estados para la descarga In-App
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadedUri, setDownloadedUri] = useState<string | null>(null);

    const localVersion = Application.nativeApplicationVersion || '1.0.0';
    const remoteVersion = globalConfig?.currentVersion;
    const updateUrl = globalConfig?.updateUrl;
    
    // Variables de Firebase o valores por defecto
    const releaseDate = globalConfig?.releaseDate || new Date().toLocaleDateString();
    const releaseSize = globalConfig?.releaseSize || '25.0 MB';
    const releaseNotes = globalConfig?.releaseNotes || [
        "Correcciones de rendimiento y estabilidad.",
        "Interfaz más fluida.",
        "Nuevos iconos y animaciones."
    ];

    useEffect(() => {
        // Auto-check silencioso al inicio
        if (remoteVersion && updateUrl && isUpdateAvailable(remoteVersion, localVersion)) {
            const timer = setTimeout(() => {
                setStatus('available');
                setIsVisible(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }, 2000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
            setStatus('idle');
        }
    }, [remoteVersion, localVersion, updateUrl]);

    // Listener para accionarlo manualmente desde Configuración
    useEffect(() => {
        const listener = DeviceEventEmitter.addListener('trigger_update_check', () => {
            setIsVisible(true);
            setStatus('checking');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            
            setTimeout(() => {
                if (remoteVersion && updateUrl && isUpdateAvailable(remoteVersion, localVersion)) {
                    setStatus('available');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                } else {
                    setStatus('uptodate');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            }, 1500); // Simulamos 1.5s de red
        });
        return () => listener.remove();
    }, [remoteVersion, localVersion, updateUrl]);

    const handleUpdate = async () => {
        if (!updateUrl) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        
        // Asegurarnos de que el link tenga https://
        let finalUrl = updateUrl.trim();
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = `https://${finalUrl}`;
        }

        // 1. Si ya se descargó el APK, lanzar el instalador
        if (downloadedUri) {
            try {
                const cUri = await FileSystem.getContentUriAsync(downloadedUri);
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: cUri,
                    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                    type: 'application/vnd.android.package-archive'
                });
            } catch (err) {
                console.error("Error launching APK installer", err);
                Linking.openURL(finalUrl); // Fallback en caso de error crítico
            }
            return;
        }

        // 2. Si es Android y es un link a un APK directo, hacemos descarga In-App
        if (Platform.OS === 'android' && finalUrl.endsWith('.apk')) {
            setIsDownloading(true);
            setDownloadProgress(0);

            const fileUri = `${FileSystem.documentDirectory}cortex-update-v${remoteVersion}.apk`;

            const downloadResumable = FileSystem.createDownloadResumable(
                finalUrl,
                fileUri,
                {},
                (downloadProgressData) => {
                    const progress = downloadProgressData.totalBytesWritten / downloadProgressData.totalBytesExpectedToWrite;
                    setDownloadProgress(progress);
                }
            );

            try {
                const result = await downloadResumable.downloadAsync();
                if (result?.uri) {
                    setDownloadedUri(result.uri);
                    setIsDownloading(false);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    
                    // Auto lanzar la instalación
                    const cUri = await FileSystem.getContentUriAsync(result.uri);
                    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                        data: cUri,
                        flags: 1,
                        type: 'application/vnd.android.package-archive'
                    });
                }
            } catch (e) {
                console.error("Download failed", e);
                setIsDownloading(false);
                Linking.openURL(finalUrl); // Fallback si la descarga falla
            }
            return;
        }

        // 3. Fallback: Abrir en el navegador (iOS o enlace no-APK)
        Linking.openURL(finalUrl).catch(err => {
            console.error("Couldn't load page", err);
        });
    };

    if (!isVisible) return null;

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
        >
            <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#111111' }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => setIsVisible(false)}
                        style={[styles.backButton, { backgroundColor: '#1A1A1A' }]}
                    >
                        <ArrowLeft size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {status === 'checking' && (
                        <View style={{ marginTop: 100, alignItems: 'center', justifyContent: 'center' }}>
                            <MotiView
                                from={{ rotate: '0deg' }}
                                animate={{ rotate: '360deg' }}
                                transition={{ loop: true, type: 'timing', duration: 1000 }}
                            >
                                <Loader2 size={48} color={theme.primary} />
                            </MotiView>
                            <Text style={{ color: '#FFF', fontSize: 18, marginTop: 20, fontWeight: '600' }}>
                                Buscando actualizaciones...
                            </Text>
                            <Text style={{ color: '#888', fontSize: 14, marginTop: 8 }}>
                                Conectando con los servidores Cortex
                            </Text>
                        </View>
                    )}

                    {status === 'uptodate' && (
                        <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ marginTop: 40, alignItems: 'center' }}>
                            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B98120', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                <CheckCircle2 size={40} color="#10B981" />
                            </View>
                            <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
                                Sistema Actualizado
                            </Text>
                            <Text style={{ color: '#999', fontSize: 15, textAlign: 'center', marginTop: 10, paddingHorizontal: 20 }}>
                                Tu núcleo Cortex está corriendo en la versión más reciente (v{localVersion}). No hay acciones requeridas.
                            </Text>
                            
                            <View style={{ width: '100%', marginTop: 40 }}>
                                <Text style={styles.whatsNewTitle}>Notas de tu versión actual</Text>
                                <View style={styles.featuresCard}>
                                    {releaseNotes.map((note, index) => (
                                        <View key={index} style={[
                                            styles.featureRow, 
                                            index < releaseNotes.length - 1 && styles.featureBorder
                                        ]}>
                                            <View style={[styles.featureDot, { backgroundColor: '#10B981' }]} />
                                            <Text style={styles.featureText}>{note}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </MotiView>
                    )}

                    {status === 'available' && (
                        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {/* Title */}
                            <Text style={styles.mainTitle}>
                                New update <Text style={{ color: theme.primary }}>v{remoteVersion}</Text>
                            </Text>

                            {/* Metadata */}
                            <View style={styles.metadataContainer}>
                                <Text style={styles.metadataText}>Released on: {releaseDate}</Text>
                                <Text style={styles.metadataText}>Size: {releaseSize}</Text>
                            </View>

                            {/* Banner Image / Graphic */}
                            <View style={styles.bannerContainer}>
                                <LinearGradient
                                    colors={[theme.primary + '30', theme.primary + '80', '#000000']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.bannerGradient}
                                >
                                    <View style={styles.bannerContent}>
                                        <Text style={styles.bannerTitle}>CORTEX ACADEMY</Text>
                                        <Text style={styles.bannerSubtitle}>NEW UPDATE</Text>
                                        <View style={styles.bannerArrow}>
                                            <ArrowRight size={14} color="#FFF" />
                                        </View>
                                    </View>
                                </LinearGradient>
                            </View>

                            {/* Description */}
                            <Text style={styles.description}>
                                Cortex Academy v{remoteVersion} introduces exciting new features, UI improvements, and general fixes.
                            </Text>

                            {/* What's New */}
                            <Text style={styles.whatsNewTitle}>What's New</Text>
                            
                            <View style={styles.featuresCard}>
                                {releaseNotes.map((note, index) => (
                                    <View key={index} style={[
                                        styles.featureRow, 
                                        index < releaseNotes.length - 1 && styles.featureBorder
                                    ]}>
                                        <View style={[styles.featureDot, { backgroundColor: theme.primary }]} />
                                        <Text style={styles.featureText}>{note}</Text>
                                    </View>
                                ))}
                            </View>
                        </MotiView>
                    )}
                    
                    {/* Bottom padding for scroll */}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Bottom Action Buttons */}
                <View style={[styles.bottomBar, { backgroundColor: isDark ? '#000000' : '#111111', flexDirection: 'column', gap: 10 }]}>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <TouchableOpacity 
                            style={[styles.buttonLater, { borderColor: '#333', display: status === 'checking' ? 'none' : 'flex' }]}
                            onPress={() => setIsVisible(false)}
                        >
                            <Text style={styles.buttonLaterText}>{status === 'uptodate' ? 'Cerrar' : 'Later'}</Text>
                        </TouchableOpacity>
                        
                        {status === 'available' && (
                            <TouchableOpacity 
                                style={[styles.buttonUpdate, { backgroundColor: downloadedUri ? '#10B981' : theme.primary + '40', overflow: 'hidden' }]} 
                                onPress={handleUpdate}
                                disabled={isDownloading}
                            >
                                {isDownloading && (
                                    <View style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: `${downloadProgress * 100}%`,
                                        backgroundColor: theme.primary,
                                        opacity: 0.5
                                    }} />
                                )}
                                <Text style={[styles.buttonUpdateText, { color: downloadedUri ? '#FFF' : theme.primary }]}>
                                    {isDownloading 
                                        ? `Descargando... ${Math.round(downloadProgress * 100)}%` 
                                        : downloadedUri 
                                            ? 'Instalar Ahora' 
                                            : 'Update'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Tercer Botón: Visitar Sitio Web (Oculto mientras checa) */}
                    {status !== 'checking' && (
                        <TouchableOpacity 
                            style={{ marginTop: 5, alignItems: 'center', paddingVertical: 10 }}
                            onPress={() => Linking.openURL('https://cortexweb.org')}
                        >
                            <Text style={{ color: '#FFFFFF', opacity: 0.6, fontSize: 14 }}>
                                Visitar página web oficial
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    mainTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 20,
    },
    metadataContainer: {
        marginBottom: 30,
    },
    metadataText: {
        fontSize: 14,
        color: '#999999',
        marginBottom: 4,
    },
    bannerContainer: {
        width: '100%',
        height: 220,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 24,
    },
    bannerGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerTitle: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    bannerSubtitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 2,
        marginTop: 4,
    },
    bannerArrow: {
        position: 'absolute',
        bottom: -60,
        right: -100,
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
        color: '#BBBBBB',
        marginBottom: 24,
    },
    whatsNewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    featuresCard: {
        backgroundColor: '#161618',
        borderRadius: 20,
        overflow: 'hidden',
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    featureBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#222222',
    },
    featureDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 16,
    },
    featureText: {
        fontSize: 15,
        color: '#DDDDDD',
        flex: 1,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
        gap: 16,
    },
    buttonLater: {
        flex: 1,
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonLaterText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonUpdate: {
        flex: 1,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonUpdateText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
