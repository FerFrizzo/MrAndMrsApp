import { supabase } from '../config/supabaseClient';
import { launchImageLibraryAsync, MediaType, requestMediaLibraryPermissionsAsync } from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export interface MediaFile {
  uri: string;
  type: 'image' | 'video';
  name: string;
  size?: number;
}

export const pickMedia = async (): Promise<MediaFile | null> => {
  try {
    // Request permissions
    const permissionResult = await requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      throw new Error('Permission to access media library was denied');
    }

    // Launch image picker
    const result = await launchImageLibraryAsync({
      mediaTypes: ['images', 'videos', 'livePhotos'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // Determine media type
      const mediaType = asset.type === 'video' ? 'video' : 'image';
      
      // Generate filename with answer_id if provided
      const extension = asset.uri.split('.').pop() || (mediaType === 'video' ? 'mp4' : 'jpg');
      const filename =`${Date.now()}.${extension}`

      return {
        uri: asset.uri,
        type: mediaType,
        name: filename,
        size: asset.fileSize,
      };
    }

    return null;
  } catch (error) {
    console.error('Error picking media:', error);
    throw error;
  }
};

export const uploadMediaToSupabase = async (
  file: MediaFile
): Promise<{ mediaUrl: string; mediaType: 'image' | 'video' }> => {
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }
    
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Upload base64 data directly to Supabase Storage
    const { data, error } = await supabase.storage
      .from('answers')      
      .upload(file.name, decode(base64), {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type === 'image' ? 'image/png' : 'video/mp4',
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('answers')
      .getPublicUrl(file.name);

    return {
      mediaUrl: urlData.publicUrl,
      mediaType: file.type,
    };
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
};

// Helper function to decode base64 to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const deleteMediaFromSupabase = async (filename: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from('answers')
      .remove([filename]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
}; 