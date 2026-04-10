# 🚀 Guía de Lanzamiento: Cortex Academy (.APK)

Para que los botones de descarga que acabo de instalar en tu Landing Page funcionen, el archivo APK debe estar alojado en GitHub con una configuración específica. Sigue estos 5 pasos:

## 1. Preparar el Binario
Cuando generes tu build de producción (el archivo `.apk`), cámbiale el nombre a:
`CortexHub.apk`

## 2. Crear el Release en GitHub
1. Entra a tu repositorio: `https://github.com/cgus392/CortexAcademyApp`.
2. En la columna derecha, busca la sección **Releases** y haz clic en **"Create a new release"**.

## 3. Configurar la Tag (IMPORTANTE)
Para que los enlaces coincidan, usa exactamente estos datos:
- **Choose a tag**: Escribe `v1.0.0-INDUSTRIAL` y presiona "Create new tag".
- **Release title**: `Cortex Academy: Lanzamiento Industrial v1.0`

## 4. Subir el Archivo
- En el cuadro de **"Attach binaries"**, arrastra tu archivo `CortexHub.apk`.
- Espera a que la barra de carga se complete al 100%.

## 5. Publicar
- Haz clic en el botón verde **"Publish release"**.

---

### ✅ ¡Listo!
Desde ese momento, el botón **"Descargar (.APK)"** de tu web empezará a descargar el archivo directamente sin redirigir a ninguna otra página.

> [!TIP]
> Si en el futuro quieres actualizar la App, solo tienes que editar este release y reemplazar el archivo `CortexHub.apk` por el nuevo, o crear un nuevo Release y avisarme para actualizar la versión en el código de la web.

**¡Felicidades, bro! Ya tienes un sistema de distribución de nivel profesional.** 🏰🛰️🚀
