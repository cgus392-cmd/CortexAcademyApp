/**
 * Compara dos versiones semánticas y determina si la versión remota es mayor a la local.
 * @param remoteVersion Versión disponible en la nube (ej. '1.7.0')
 * @param localVersion Versión instalada en el dispositivo (ej. '1.6.0')
 * @returns {boolean} true si hay una actualización disponible
 */
export const isUpdateAvailable = (remoteVersion: string, localVersion: string): boolean => {
    if (!remoteVersion || !localVersion) return false;
    
    // Convertir "1.6.0" en [1, 6, 0]
    const remoteParts = remoteVersion.split('.').map(Number);
    const localParts = localVersion.split('.').map(Number);
    
    // Iterar comparando de mayor a menor jerarquía (Mayor, Menor, Parche)
    for (let i = 0; i < Math.max(remoteParts.length, localParts.length); i++) {
        const r = remoteParts[i] || 0;
        const l = localParts[i] || 0;
        
        if (r > l) return true;  // Nube es mayor -> Hay actualización
        if (r < l) return false; // Local es mayor -> Nube está desactualizada
    }
    
    // Son exactamente iguales
    return false;
};
