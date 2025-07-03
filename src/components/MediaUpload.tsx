import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { pickMedia, MediaFile } from '../services/mediaService';
import { Purple } from '../utils/Colors';
import { useToast } from '../contexts/ToastContext';
import { VideoScreen } from './AnswerCard';

interface MediaUploadProps {
  onMediaSelect: (media: MediaFile | null) => void;
  selectedMedia: MediaFile | null;
  isPremium: boolean;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  onMediaSelect,
  selectedMedia,
  isPremium
}) => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handlePickMedia = async () => {
    if (!isPremium) {
      showToast('Media uploads are only available for premium games. Upgrade to premium to use this feature.', 'warning');
      return;
    }

    try {
      setLoading(true);
      const media = await pickMedia();
      onMediaSelect(media);
    } catch (error: any) {
      showToast(error.message || 'Failed to pick media. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMedia = () => {
    Alert.alert(
      'Remove Media',
      'Are you sure you want to remove this media?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onMediaSelect(null) },
      ]
    );
  };

  if (!isPremium) {
    return null; // Don't show anything for non-premium users
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Why not answering with a photo or video?</Text>
      
      {selectedMedia ? (
        <View style={styles.mediaContainer}>
          <View style={styles.mediaPreview}>
            {selectedMedia.type === 'image' ? (
              <Image source={{ uri: selectedMedia.uri }} style={styles.image} />
            ) : (
              <VideoScreen
                mediaUrl={selectedMedia.uri}
              />
            )}
          </View>
          
          <View style={styles.mediaActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRemoveMedia}
            >
              <MaterialCommunityIcons name="delete" size={20} color="#FF3B30" />
              <Text style={styles.actionText}>Remove</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handlePickMedia}
              disabled={loading}
            >
              <MaterialCommunityIcons name="camera" size={20} color={Purple} />
              <Text style={styles.actionText}>Replace</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handlePickMedia}
          disabled={loading}
        >
          <MaterialCommunityIcons 
            name="camera-plus" 
            size={24} 
            color={Purple} 
          />
          <Text style={styles.uploadText}>
            {loading ? 'Loading...' : 'Select Image or Video'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  label: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  uploadText: {
    color: Purple,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  mediaContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  mediaPreview: {
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  video: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  mediaActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default MediaUpload; 