import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/RootStackParamList';
import { useAuth } from '../context/AuthContext';
import { Purple, PurpleLight } from '../utils/Colors';
import { signUpWithEmail } from '../services/authService';
import { useToast } from '../contexts/ToastContext';

type SignUpScreenProps = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { setUser } = useAuth();
  const { showToast, showDialog } = useToast();

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (!fullName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    showDialog(
      'Create Account',
      'Would you like to create your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => { }
        },
        {
          text: 'Create',
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);

              const { data, error } = await signUpWithEmail(email, password, fullName);

              if (error) {
                throw error;
              }

              showToast('Account created successfully!', 'success');
              navigation.navigate('SignIn');
            } catch (error: any) {
              console.error("Sign up error:", error);

              let errorMessage = 'Error signing up';

              // Handle Supabase error messages
              if (error.message) {
                if (error.message.includes('already registered')) {
                  errorMessage = 'This email is already in use. Please try another email or sign in.';
                } else if (error.message.includes('invalid email')) {
                  errorMessage = 'The email address is invalid. Please enter a valid email.';
                } else if (error.message.includes('password')) {
                  errorMessage = 'The password is too weak. Please use a stronger password.';
                } else if (error.message.includes('network')) {
                  errorMessage = 'Network error. Please check your internet connection and try again.';
                } else {
                  errorMessage = error.message;
                }
              }

              showToast(errorMessage, 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ],
      'confirm'
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={[Purple, PurpleLight]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.innerContainer}
        >
          <View style={styles.contentContainer}>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.avatar}
                resizeMode="contain"
              />
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder=""
                placeholderTextColor="#A0A0A0"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder=""
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder=""
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder=""
                placeholderTextColor="#A0A0A0"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.signUpButton}
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.signUpButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backToLoginContainer}
                onPress={() => navigation.navigate('SignIn')}
              >
                <Text style={styles.backToLoginText}>
                  Already have an account? <Text style={styles.backToLoginLink}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 110,
    height: 110,
  },
  formContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  label: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    width: '100%',
  },
  signUpButton: {
    backgroundColor: '#FF7F50',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToLoginContainer: {
    marginTop: 15,
    marginBottom: 15,
  },
  backToLoginText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  backToLoginLink: {
    color: '#FF7F50',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default SignUpScreen; 