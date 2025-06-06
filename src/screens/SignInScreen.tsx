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
import { AntDesign } from '@expo/vector-icons';
import { signInWithEmail } from '../services/authService';
import SignInWithGoogle from '../components/SignInWithGoogle';
import { useToast } from '../contexts/ToastContext';

type SignInScreenProps = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
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

      if (error) {
        throw error;
      }

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

  { loading && <ActivityIndicator size="large" color="#7fbf7f" /> }

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

              <TouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={() => navigation.navigate('PasswordRecovery')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Log In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createAccountContainer}
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text style={styles.createAccountText}>
                  Don't have an account? <Text style={styles.createAccountLink}>Create one</Text>
                </Text>
              </TouchableOpacity>

              <View style={styles.separatorContainer}>
                <View style={styles.separatorLine} />
                <Text style={styles.orText}>Or sign in with</Text>
                <View style={styles.separatorLine} />
              </View>

              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton}>
                  <SignInWithGoogle navigation={navigation} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <AntDesign name="facebook-square" size={24} color="#4285F4" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <AntDesign name="apple1" size={24} color="black" />
                </TouchableOpacity>
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
  header: {
    marginTop: 40,
    alignItems: 'flex-start',
  },
  screenTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
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
  welcomeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
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
  loginButton: {
    backgroundColor: '#FF7F50',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    color: 'white',
    textAlign: 'center',
    marginHorizontal: 10,
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  socialButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  createAccountContainer: {
    marginTop: 15,
    marginBottom: 15,
  },
  createAccountText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  createAccountLink: {
    color: '#FF7F50',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'white',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 15,
  },
  forgotPasswordText: {
    color: 'white',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default SignInScreen;
