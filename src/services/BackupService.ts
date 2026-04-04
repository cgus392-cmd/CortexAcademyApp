import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';

export interface BackupData {
  version: string;
  timestamp: string;
  userProfile: any;
  courses: any[];
  tasks: any[];
  scheduleBlocks: any[];
  notes: string;
  notifications: any[];
  completedAchievements: any[];
}

const { StorageAccessFramework } = FileSystem;

class BackupService {
  /**
   * Exporta los datos actuales a un archivo JSON usando SAF en Android 
   * o Sharing en iOS.
   */
  async exportData(data: Omit<BackupData, 'version' | 'timestamp'>) {
    try {
      const backup: BackupData = {
        version: '3.1',
        timestamp: new Date().toISOString(),
        ...data,
      };

      const jsonStr = JSON.stringify(backup, null, 2);
      const fileName = `CortexBackup_${new Date().toISOString().split('T')[0]}`; // sin extension para SAF

      // --- LOGICA ANDROID (SAF: Save As) ---
      if (Platform.OS === 'android') {
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
        
        if (permissions.granted) {
          // El usuario eligió una carpeta
          const directoryUri = permissions.directoryUri;
          
          try {
            // Crear el archivo en la ubicación seleccionada
            const fileUri = await StorageAccessFramework.createFileAsync(
              directoryUri,
              fileName,
              'application/json'
            );

            // Escribir el contenido
            await FileSystem.writeAsStringAsync(fileUri, jsonStr, { encoding: 'utf8' as any });
            
            Alert.alert('¡Éxito!', 'Copia de seguridad guardada exitosamente en la carpeta seleccionada.');
            return;
          } catch (e: any) {
             console.error('SAF Write Error:', e);
             Alert.alert('Error', 'No se pudo guardar el archivo en la ubicación seleccionada.');
             return;
          }
        }
      }

      // --- FALLBACK / IOS (Sharing Sheet) ---
      const cacheUri = `${FileSystem.cacheDirectory}${fileName}.json`;
      await FileSystem.writeAsStringAsync(cacheUri, jsonStr, { encoding: 'utf8' as any });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(cacheUri, {
          mimeType: 'application/json',
          dialogTitle: 'Exportar Respaldo Cortex',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Error', 'No se pudo abrir el menú de exportación.');
      }

    } catch (error: any) {
      console.error('Export Error:', error);
      Alert.alert('Error Crítico', `Detalle: ${error.message || 'Falla de sistema'}`);
    }
  }

  /**
   * Abre el selector de documentos para importar un archivo JSON de respaldo.
   */
  async importData(): Promise<BackupData | null> {
    try {
      if (!DocumentPicker || typeof DocumentPicker.getDocumentAsync !== 'function') {
        Alert.alert('Módulo No Detectado', 'El selector de archivos no está vinculado correctamente.');
        return null;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return null;

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: 'utf8' as any });
      const backup = JSON.parse(fileContent);

      if (this.validateBackup(backup)) {
        return backup;
      } else {
        Alert.alert('Respaldo Inválido', 'El archivo no tiene el formato correcto de Cortex Academy.');
        return null;
      }
    } catch (error: any) {
      console.error('Import Error:', error);
      Alert.alert('Error de Importación', `Detalle: ${error.message || 'Error al leer archivo'}`);
      return null;
    }
  }

  private validateBackup(data: any): data is BackupData {
    return (
      data &&
      typeof data.version === 'string' &&
      Array.isArray(data.courses) &&
      Array.isArray(data.tasks) &&
      data.userProfile !== undefined
    );
  }
}

export default new BackupService();
