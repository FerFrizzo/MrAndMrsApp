import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/RootStackParamList';
import { useAuth } from '../context/AuthContext';
import { Purple, PurpleLight } from '../utils/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserProfile, UserProfile } from '../services/userService';
import { useToast } from '../contexts/ToastContext';
import { Dialog } from '../components/Dialog';
import { deleteAccount, signOut } from '../services/authService';

type AccountScreenProps = NativeStackScreenProps<RootStackParamList, 'Account'>;

const AccountScreen: React.FC<AccountScreenProps> = ({ navigation }) => {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { profile, error } = await getUserProfile(user.id);

      if (error) {
        showToast('Failed to load profile information', 'error');
      } else if (profile) {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast('An error occurred while loading profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await deleteAccount();
      if (error) {
        showToast('Failed to delete account. Please try again.', 'error');
        return;
      }
      await signOut();
      setUser(null);
    } catch {
      showToast('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleContactSupport = async () => {
    try {
      const url = 'mailto:fernando@mrandmrs.tech?subject=MrAndMrs Support Request';
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showToast('Could not open email client. Please email fernando@mrandmrs.tech for support.', 'error');
      }
    } catch (error) {
      console.error('Error opening email:', error);
      showToast('Failed to open email client', 'error');
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[Purple, PurpleLight]}
        style={[styles.container, styles.loadingContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ActivityIndicator size="large" color="white" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[Purple, PurpleLight]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.mainContainer}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                {userProfile?.avatar_url ? (
                  <Image
                    source={{ uri: userProfile.avatar_url }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialCommunityIcons name="account-circle" size={80} color="white" />
                )}
              </View>
              <Text style={styles.userName}>{userProfile?.display_name || userProfile?.email || 'User'}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Information</Text>
              <View style={styles.infoContainer}>

                {userProfile?.display_name && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Full Name</Text>
                    <Text style={styles.infoValue}>{userProfile.display_name}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{userProfile?.email}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>
                    {userProfile?.created_at
                      ? new Date(userProfile.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                      : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteDialog(true)}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <>
                <MaterialCommunityIcons name="delete-outline" size={24} color="#FF3B30" />
                <Text style={styles.deleteButtonText}>Delete Account</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleContactSupport}
          >
            <MaterialCommunityIcons name="email-outline" size={24} color={Purple} />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Dialog
        visible={showDeleteDialog}
        title="Delete Account"
        message="This will permanently delete your account and all your data. This action cannot be undone."
        type="warning"
        onDismiss={() => setShowDeleteDialog(false)}
        buttons={[
          {
            text: 'Delete Permanently',
            style: 'destructive',
            onPress: handleDeleteAccount,
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setShowDeleteDialog(false),
          },
        ]}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    padding: 8,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoValue: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 22,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  supportButton: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 22,
    marginVertical: 16,
  },
  supportButtonText: {
    color: Purple,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AccountScreen; 