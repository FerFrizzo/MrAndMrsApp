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
import { signInWithEmail } from '../services/authService';
import SignInWithGoogle from '../components/SignInWithGoogle';
import SignInWithApple from '../components/SignInWithApple';
import { useToast } from '../contexts/ToastContext';

type SignInScreenProps = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const { showToast } = useToast();

  const handleSignIn = async () => {
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await signInWithEmail(email, password);
      if (error) throw error;
      if (data?.user) {
        setUser(data.user);
      } else {
        throw new Error('No user data returned');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to sign in', 'error');
    } finally {
      setLoading(false);
    }
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 90}
          style={styles.inner}
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('PasswordRecovery')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleSignIn}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={styles.loginButtonText}>Log In</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createAccount}
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text style={styles.createAccountText}>
                  Don't have an account?{' '}
                  <Text style={styles.createAccountLink}>Create one</Text>
                </Text>
              </TouchableOpacity>

              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>or sign in with</Text>
                <View style={styles.separatorLine} />
              </View>

              <View style={styles.socialButtons}>
                <SignInWithGoogle />
                <SignInWithApple />
              </View>
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
  inner: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    overflow: 'hidden',
  },
  logo: {
    width: 100,
    height: 100,
  },
  form: {
    width: '100%',
    maxWidth: 320,
  },
  label: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 18,
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -6,
  },
  forgotPasswordText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  loginButton: {
    backgroundColor: '#FF7F50',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  createAccount: {
    marginTop: 16,
    alignItems: 'center',
  },
  createAccountText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  createAccountLink: {
    color: '#FF7F50',
    fontWeight: '700',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 10,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  separatorText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
  },
  socialButtons: {
    gap: 12,
  },
});

export default SignInScreen;
