---
name: cortex-release-protocol
description: Protocolo estricto y pasos obligatorios a seguir cuando el usuario solicita compilar y lanzar una nueva versión de Cortex Hub OS.
---

# Cortex Hub OS: Protocolo de Lanzamiento (Release Protocol)

Esta skill debe activarse de forma automática cuando el usuario indique que desea lanzar o compilar una nueva actualización de la aplicación Cortex Hub OS (ej. "vamos a lanzar la versión 1.8", "compila la app", "lanza nueva versión").

Al activar esta skill, tú (el agente) debes seguir estos pasos en orden estricto:

## 1. Actualización de Código (Pre-Compilación)
Antes de darle el comando de compilación al usuario, debes:
1. Preguntar cuál será el número de la nueva versión (ej. `1.8.0`).
2. Actualizar el archivo `app.json`:
   - Incrementar el `"version"` a la nueva versión.
   - Incrementar el `"versionCode"` (sumar 1 al valor anterior).
3. Actualizar el archivo `package.json`:
   - Incrementar el `"version"` a la nueva versión para mantener la paridad.

## 2. Compilación
Una vez actualizados los archivos, entrégale al usuario el comando exacto para construir el APK:
```bash
npx eas-cli build -p android --profile production
```

## 3. Generación del Kit de Lanzamiento (Release Kit)
Mientras el usuario espera que se compile la app en la nube de Expo, debes generar y entregarle el **Kit de Lanzamiento** para que él solo tenga que copiar y pegar. El formato de tu respuesta debe ser exactamente así:

**🏷️ Nombre del Archivo (Renombre):**
`CortexAcademy-v[VERSIÓN].apk`

**🚀 Título del Release (GitHub):**
`Cortex Hub OS v[VERSIÓN] ([Nombre del Update, ej. Smart Check Update])`

**📝 Notas del Parche (Changelog):**
[Escribe una lista en bullet-points con emojis destacando los 3 o 4 cambios técnicos y visuales más importantes que se hicieron durante esta sesión. Debe sonar profesional pero emocionante.]

**🔥 Instrucciones para Firebase:**
Recuérdale al usuario que debe ir a Firebase (`system/config`) y actualizar:
- `currentVersion`: "[VERSIÓN]"
- `releaseSize`: "[Dejar que el usuario lo calcule o poner aproximado de 30.0 MB]"
- `updateUrl`: "El link directo al .apk recién subido en GitHub"
- `releaseNotes`: [Array de strings con las notas del parche generadas arriba]

## 4. Confirmación
Espera la confirmación del usuario de que el APK fue descargado, subido a GitHub y de que Firebase fue actualizado exitosamente. Finalmente, celebra el lanzamiento.
