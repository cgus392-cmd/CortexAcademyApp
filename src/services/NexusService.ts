import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { auth } from './firebase';

export interface LocalResource {
  id: string;
  title: string;
  type: 'video' | 'link' | 'photo' | 'file';
  uri: string; // File:// local or Link manually entered
  courseId: string;
  date: string;
  fileName?: string;
  fileSize?: number;
}

const NEXUS_DIR = `${FileSystem.documentDirectory}nexus_files/`;

export const NexusService = {
  initialize: async () => {
    const dirInfo = await FileSystem.getInfoAsync(NEXUS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(NEXUS_DIR, { intermediates: true });
    }
  },

  pickImage: async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
        const asset = result.assets[0];
        const fileName = `${Date.now()}_${asset.fileName || 'image.jpg'}`;
        const dest = `${NEXUS_DIR}${fileName}`;
        await FileSystem.copyAsync({ from: asset.uri, to: dest });
        return { uri: dest, fileName, fileSize: asset.fileSize };
    }
    return null;
  },

  pickDocument: async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
        const asset = result.assets[0];
        const fileName = `${Date.now()}_${asset.name}`;
        const dest = `${NEXUS_DIR}${fileName}`;
        
        // Guardado puramente local
        await FileSystem.copyAsync({ from: asset.uri, to: dest });
        return { uri: dest, fileName: asset.name, fileSize: asset.size };
    }
    return null;
  },

  deleteFile: async (uri: string) => {
    if (uri.startsWith('file://')) {
        const info = await FileSystem.getInfoAsync(uri);
        if (info.exists) {
            await FileSystem.deleteAsync(uri);
        }
    }
  },

  renameFile: async (oldUri: string, newFileName: string) => {
    if (oldUri.startsWith('file://')) {
        const newUri = `${NEXUS_DIR}${newFileName}`;
        await FileSystem.moveAsync({ from: oldUri, to: newUri });
        return newUri;
    }
    return oldUri;
  }
};
