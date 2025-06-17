import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/RootStackParamList';
import { useAuth } from '../context/AuthContext';
import { Purple, PurpleLight } from '../utils/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserProfile, UserProfile } from '../services/userService';
import { useToast } from '../contexts/ToastContext';

type AccountScreenProps = NativeStackScreenProps<RootStackParamList, 'Account'>;

const AccountScreen: React.FC<AccountScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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
            style={styles.supportButton}
            onPress={handleContactSupport}
          >
            <MaterialCommunityIcons name="email-outline" size={24} color={Purple} />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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