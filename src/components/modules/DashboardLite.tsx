import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DeviceEventEmitter } from 'react-native';
import { Play } from 'lucide-react-native';

export const DashboardLite: React.FC = () => {

    // Simula iniciar un temporizador de estudio para que la "Isla Dinámica" (Widget) se active
    const startDemoTimer = () => {
        DeviceEventEmitter.emit('timer-update', {
            timeLeft: 1500, // 25 Minutos
            focusMode: 'work',
            isActive: true
        });
    };

    const stopDemoTimer = () => {
        DeviceEventEmitter.emit('timer-update', {
            timeLeft: 0,
            focusMode: 'work',
            isActive: false
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Cortex Hub OS</Text>
                <Text style={styles.subtitle}>Demo Lite</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>📱 Ligas Mayores 100% Nativo</Text>
                <Text style={styles.cardText}>
                    La pantalla de bloqueo biométrica ya fue superada.{'\n'}
                    El "Cerebro" de Types, Firebase y Gemini ya está incrustado.
                </Text>

                <TouchableOpacity style={styles.button} onPress={startDemoTimer}>
                    <Play color="white" size={20} />
                    <Text style={styles.buttonText}>Probar Widget Flotante</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.buttonStop]} onPress={stopDemoTimer}>
                    <Text style={styles.buttonText}>Ocultar Widget</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        padding: 20,
        paddingTop: 60,
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4f46e5',
        marginTop: 5,
    },
    card: {
        backgroundColor: 'rgba(20,20,20,0.8)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 10,
    },
    cardText: {
        fontSize: 14,
        color: '#a3a3a3',
        lineHeight: 22,
        marginBottom: 30,
    },
    button: {
        backgroundColor: '#4f46e5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 10,
        marginBottom: 15,
    },
    buttonStop: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
