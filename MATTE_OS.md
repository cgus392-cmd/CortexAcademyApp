# Cortex Matte OS (Identity Manual)

Este manual documenta el sistema de diseño oficial de **Cortex Hub OS**, diseñado para ofrecer una experiencia visual premium, coherente y personalizable, similar a la estética de widgets de Apple.

---

## 🎨 Principios de Diseño
Cortex Matte OS se basa en el concepto de **Solid Glass** (Vidrio Sólido). A diferencia del vidrio tradicional (cristalino), el acabado Matte esmerila la luz, ofreciendo mayor legibilidad sin perder la profundidad del fondo dinámico Nebula.

### 1. La Capa "Solid Heart"
Cada componente visual se construye sobre un núcleo de desenfoque Gaussiano de alta intensidad (Gaussian Blur 40/80), rematado con una capa de color sólido semi-transparente (Opacidad base: 35-40%).

### 2. El Ecosistema Nebula
El fondo dinámico de nebulosas intergalácticas proporciona el contexto visual. La interfaz Matte OS interactúa con este fondo permitiendo que los colores de las nebulosas se filtren suavemente a través de las tarjetas.

### 3. Renderizado Ultra-Limpio (No Shadows / No Elevation)
Para lograr la estética premium de **Hub OS**, el sistema **prohíbe el uso de sombras nativas (`elevation` en Android o `shadowOpacity` tradicional)**. Las tarjetas deben descansar sobre el fondo sin bordes oscuros o proyecciones pesadas, utilizando únicamente sutiles bordes de contraste (`borderWidth: 1`) para separarse del fondo. Esto garantiza una interfaz ligera, rápida y moderna.

---

## 🛠 Componentes Core (`src/components/design-system/CortexMatte.tsx`)

### `<MatteCard />`
El bloque de construcción fundamental para tarjetas, widgets y contenedores.
- **Radius:** Standard (28px - 30px).
- **Glass Factor:** Configurable (0.05 a 0.7).
- **Blur Power:** Dinámico (0 a 95).

### `<MatteUnderlay />`
Utilizado para fondos de pantalla, modales y barras de navegación.
- **Intensidad:** Sincronizada con el modo del sistema (Claro/Oscuro).

---

## 🔘 Segmented Control System (Pillas UI)
El sistema de selección de Matte OS utiliza un patrón de "Píldoras Flotantes":
1. **Track Base:** Fondo unificado con borde redondeado suave (`rgba(0,0,0,0.04)` en claro, `rgba(255,255,255,0.05)` en oscuro).
2. **Active Pill:** El elemento seleccionado debe resaltar como una superficie física e independiente que "flota" sobre el track (Fondo blanco/gris sólido con una sombra microscópica de profundidad).
3. **Aislamiento:** No se utilizan bordes individuales entre botones; el espacio se gestiona mediante el contraste del objeto activo.

---

## ⚙️ Tokens de Personalización (Appearance Context)

El sistema responde en tiempo real a los siguientes parámetros:

| Token | Rango | Descripción |
| :--- | :--- | :--- |
| `nebulaIntensity` | 0.2 - 1.0 | Potencia del fondo dinámico. |
| `glassOpacity` | 0.05 - 0.7 | Nivel de transparencia de la capa Matte. |
| `glassBlur` | 0 - 95 | Fuerza del desenfoque gaussiano. |

---

## 🚀 Guía de Implementación
Para implementar nuevos componentes en la aplicación, **siempre** utilice el sistema de diseño unificado:

```tsx
import { MatteCard } from '../components/design-system/CortexMatte';

// Ejemplo: Widget de Usuario
const UserWidget = () => (
    <MatteCard radius={30}>
        <Text>Contenido Premium</Text>
    </MatteCard>
);
```

---

## 🌑 Excelencia en Modo Oscuro (Cortex Midnight)
Para asegurar que el sistema se sienta premium en la oscuridad:
1. **Fondo "Ink Drop":** Evitar el negro puro (#000) si es posible; usar tonos como `#0B0C14` para dar profundidad a las nebulosas.
2. **Bordes Luminosos:** Sustituir los bordes tradicionales por auras del color `primary` al 10-15% de opacidad para que las tarjetas parezcan autoluminosas.
3. **Contraste Suavizado:** Los textos secundarios deben heredar sutilmente el tinte del color de la marca (ej: un Cyan muy oscuro) para mantener la armonía galáctica.

---

*Cortex Hub OS 3.1 - Identidad Visual Protegida por el Equipo Nexus*
