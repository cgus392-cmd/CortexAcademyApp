# Cortex Media Branding Skill

This skill defines the visual identity and marketing prompt generation engine for the Cortex Ecosystem. Use this skill whenever generating advertising, social media posts, or promotional visuals to ensure a consistent, premium "Matte OS" aesthetic.

## Core Identity: The "Matte OS" Look

### Visual Tokens
- **Backgrounds**: Pure studio white or soft gradients (e.g., Slate 50 to Cyan 50). Avoid vibrant colors; prioritize minimalist, clean spaces.
- **Lighting**: Cinematic studio lighting with soft shadows and high-end depth of field.
- **Materials**: Matte finishes on all objects (specifically robots and hardware). Glassmorphism for floating UI widgets.
- **Subject**: Corty (Official Mascot). A white matte spherical robot with glowing cyan circuit patterns and a digital pixel face.

### Layout Hierarchy
1. **Header (Top-Left)**: Clean, bold sans-serif "Cortex Labs" or "Cortex Academy" logo.
2. **Title (Top)**: High-contrast professional typography (Modern Sans).
3. **Core (Center)**: Corty performing an action (Waving, thinking, celebrating).
4. **Context (Floating)**: UI widgets (pills) with real-time data or version info.
5. **Call to Action (Bottom)**: Standardized App Store and Google Play buttons.
6. **Footer (Very Bottom)**: Clean URL `cortexweb.org`.

## The Cortex Media Prompt Engine

Use this template to generate prompts for DALL-E or other image models:

```text
A premium, minimalist vertical marketing poster (9:16 aspect ratio) for {{BRAND}}.

[1. HEADER]: {{BRAND}} logo at the top-left in bold modern sans-serif.
[2. CORE MESSAGE]: High-contrast 3D typography at the top reading: "{{MESSAGE}}".
[3. SUBJECT]: In the center, Corty (the futuristic matte white sphere bot with cyan glowing brain-circuits and a digital pixelated face) {{ACTION}}.
[4. UI WIDGET]: A floating pill-shaped glass widget near Corty showing: {{WIDGET_DATA}}.

[STYLE]: Soft studio lighting on a Slate 50 gradient background, subtle glassmorphism, App Store and Google Play buttons at the bottom center, and "{{URL}}" at the very bottom. 8K resolution, hyper-realistic.
```

## Example Variables
- **BRAND**: "Cortex Labs"
- **MESSAGE**: "¡173+ usuarios ya están ganando el semestre!"
- **ACTION**: "celebrando con una mano levantada"
- **WIDGET_DATA**: "173+ LIVE - Descargas en tiempo real"
- **URL**: "cortexweb.org"
