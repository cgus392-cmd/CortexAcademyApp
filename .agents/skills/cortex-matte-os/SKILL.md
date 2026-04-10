---
name: Cortex Matte OS Design System
description: Instructions and guidelines for implementing the brand's signature solid, Apple-weather-like widget aesthetic across Cortex Hub OS.
---

# Cortex Matte OS Design System

When the user asks you to "implement the Matte OS design", "use the patentable design", or "refactor to Matte OS", you **MUST** follow these specific guidelines securely established for the Cortex Academy App. 

## 1. Goal
The primary visual identity is inspired by modern Apple Widgets (e.g. Health, Weather). It completely avoids heavy `blur` or glassmorphism in favor of a very solid, highly-performant, "matte" look that has a tiny fraction of frosted transparency.

## 2. The Core Component
Do not create custom backgrounds inline or use `GlassSurface`/`SiliconGlass`. Your one source of truth is `CortexMatte.tsx`. Always import:

```tsx
import { MatteCard, MatteActionBtn, MatteBanner, MatteMemoCard, MatteCourseCard } from '../components/design-system/CortexMatte';
```

### `<MatteCard>` (The Foundation)
Whenever you need a container card (for stats, menus, text blocks), use `MatteCard`. It handles the drop-shadow depth, base colors, fine borders, and the subtle 5% frosted blur automatically.

**Key visual specs automatically handled by `<MatteCard>`:**
- **Elevation / Shadow:** 3 (soft `shadowOpacity: 0.04` on light, `0.3` on dark).
- **Backgrounds:** `rgba(255, 255, 255, 0.88)` on Light Mode, `rgba(28, 28, 30, 0.88)` on Dark Mode.
- **Glass Effect:** Behind the main card exists a `BlurView` of intensity 40 (Dark) / 80 (Light) to let underlying scrolls peer through infinitesimally faintly.
- **Radii:** Broad curves ranging from 20 to 30. Usually `radius={28}` for big panels, `24` for action tiles.

## 4. Standard Navigation & Action Controls

Para mantener la integridad "Premium" del sistema, todos los controles de acción en la cabecera (Retroceso, Agregar, Menú) **DEBEN** seguir el estándar de 44px.

- **Componente:** `MatteIconButton`
- **Dimensiones:** `size={44}`, `radius={22}` (Círculo perfecto).
- **Iconografía:** `size={20}`, `strokeWidth={2.5}`.
- **Ubicación:** Padding superior de `insets.top + 15` para alineación perfecta con la barra de estado.

Cualquier desviación de estas medidas (ej. botones de 40px) se considera un error de diseño ("masacote") y debe ser refactorizado inmediatamente.

By following this skill correctly, you maintain the official, performant, and premium identity of **Cortex Hub OS**.

## 5. Sistema Iconográfico "Iconly Pro" (Premium Vector)
Para secciones de ajustes, listas de control y navegación lateral, se debe usar el estándar **Iconly**:
- **Trazo (Stroke):** Siempre `strokeWidth={1.5}` para un look fino y minimalista.
- **Color:** Unificado al `theme.text` para evitar "ruido visual" multicolor.
- **Contenedor:** Círculo perfecto con `width: 42`, `height: 42`, `borderRadius: 21`.
- **Fondo:** Neutro Matte (`rgba(255,255,255,0.06)` en Dark, `rgba(0,0,0,0.04)` en Light).
- **Animación:** Siempre envolver en `MotiView` con escala suave en `from` (0.8) y `animate` (1).

## 6. Profile Identity & Hero Sections
La identidad del usuario debe ser el punto focal en las pantallas de ajustes y perfil:
- **Layout:** Siempre **centrado** (`alignItems: 'center'`).
- **Avatar:** Círculo con `borderWidth: 4`, `borderColor` de contraste sutil y sombra de elevación 10. Medida estándar: `110x110`.
- **Typography:** Saludo "Hola, [Nombre]" usando `fontSize: 30` y `fontWeight: '900'`.
- **Subtexto:** Email institucional con opacidad 0.8 para jerarquía secundaria.
