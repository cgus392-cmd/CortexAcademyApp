# RESPALDO TÉCNICO: CORTEX ACADEMY APP (MOBILE HUB)
**Versión de Documentación**: 1.0 (Mobile)  
**Estado**: Iniciado
**Propósito**: Registro técnico detallado de la arquitectura móvil para respaldo legal y técnico.

---

## 1. CONTEXTO Y ARQUITECTURA CORE (MOBILE)
La Cortex Academy App es el nodo principal de interacción para el estudiante, diseñada para funcionar como un "Sistema Operativo Académico" portátil.

### Stack Tecnológico:
- **Framework**: React Native 0.83.4 con Expo 55.0 (Versión de vanguardia).
- **Lenguaje**: TypeScript 5.9.
- **Gestión de Estado**: Context API + Hooks personalizados para persistencia híbrida.
- **Navegación**: React Navigation (Native Stack + Bottom Tabs) con transiciones optimizadas para fluidez Matte OS.

### Estructura de Navegación:
- **Root Stack**: Controladores de autenticación y carga del sistema.
- **Main Tabs**: Hub principal que contiene:
    - **Cortex Dashboard**: Vista central de widgets.
    - **Academic Hub**: Gestión de materias y horarios.
    - **Nexus AI**: Interfaz de chat y asistente de voz.
    - **Settings/Profile**: Centro de configuración de identidad.

---

## 2. MÓDULO: CORTEX ALPHA SYNC (MOBILE CLIENT)
Este módulo gestiona la integridad de los datos entre el dispositivo local y la nube (Firestore).

### Protocolo de Sincronización:
- **Guarded Writes**: Sistema de escritura protegida que evita condiciones de carrera durante actualizaciones simultáneas.
- **Debouncing (1.5s)**: Optimización de escrituras en la nube para reducir el consumo de datos y evitar el spam de actualizaciones.
- **Offline First**: Persistencia local mediante `@react-native-async-storage/async-storage` con reconciliación automática al recuperar conectividad.
- **Identity Sync**: Sincronización transparente de la identidad del usuario, incluyendo el `expoPushToken` para el motor de notificaciones.

---

## 3. MÓDULO: MATTE OS - MOBILE IMPLEMENTATION
El sistema de diseño "Matte OS" en dispositivos móviles se enfoca en una experiencia táctil premium, utilizando superficies sólidas y micro-interacciones de alta fidelidad.

### Componentes UI Patentables:
- **MatteCard**: La unidad atómica de diseño. Implementa un sistema de capas con `BlurView` (Expo Blur) y fondos sólidos con opacidad controlada. Soporta modos de rendimiento dinámicos (`eco`, `ahorro`, `ultra`) para garantizar fluidez en diversos dispositivos.
- **Widgets de Dashboard**: Sistema de tarjetas inteligentes con radio de 28px que presentan información académica (Promedios, Tareas, Próximas Clases) de forma no intrusiva.
- **Premium Chat Bubbles**: Interfaz de conversación con geometría asimétrica (radio adaptativo) y contraste optimizado para lectura prolongada.
- **Scientific Formula Engine**: Renderizado nativo de expresiones matemáticas (LaTeX/Courier) con contenedores de seguridad visual.

### Ergonomía y Visualización:
- **Safe Area Integration**: El diseño respeta los límites de hardware (notches, dynamic islands) mediante `react-native-safe-area-context`.
- **Haptic Feedback**: Integración con `expo-haptics` para proporcionar retroalimentación física en acciones críticas del sistema.

---

## 4. MÓDULO: INTELLIGENCE & ACADEMIC ENGINE
Cortex funciona como el cerebro académico del estudiante, procesando datos locales con IA generativa.

### Motores de Inteligencia:
- **Cortex Assistant**: Implementación móvil del SDK de Google GenAI (`gemini-3-flash` / `gemini-3.1-pro`). El motor inyecta automáticamente el historial académico para proporcionar mentoría personalizada.
- **Vision Hub**: Capacidad de analizar imágenes de horarios y documentos mediante el procesamiento multimodal de Gemini, extrayendo estructuras de datos JSON directamente al estado de la aplicación.
- **Smart Context**: Sistema de "Smart Banners" que detectan automáticamente la necesidad de apoyo académico basándose en el calendario y las tareas pendientes.

### Gestión Académica:
- **Grade Calculator**: Algoritmos de cálculo de promedios ponderados y proyección de metas.
- **Interactive Schedule**: Sistema de gestión de horarios con soporte para detección de cruces y alertas de proximidad.

---

## 5. MÓDULO: SYSTEM INTEGRATION (ALPHA ECOSYSTEM)
Integración global de la red Cortex.

- **Global Broadcast Receiver**: Componente que escucha en tiempo real la colección de transmisiones de Firestore para mostrar anuncios de la administración (Cortex Tower).
- **Security Score Mobile**: El cliente calcula y envía métricas de integridad (ej: posesión de token de notificación) para asegurar el acceso al Admin Tower.

---

*(Fin de la documentación técnica de Cortex Academy App v1.0)*
