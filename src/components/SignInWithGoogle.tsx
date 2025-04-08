import React from "react";
import { TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from "../types/RootStackParamList";
import { AntDesign } from "@expo/vector-icons";
import { signInWithProvider } from "../services/authService";

interface SignInWithGoogleProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignIn'>;
}

const SignInWithGoogle: React.FC<SignInWithGoogleProps> = ({ navigation }) => {
  const { setUser } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await signInWithProvider('google');

      console.log("🚀 ~ handleGoogleSignIn ~ data:", data);
      if (error) {
        throw error;
      }

      // The OAuth flow will redirect the user, so we don't need to manually set the user
      // Supabase will handle the session and the auth state listener in AuthContext will update the user
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      Alert.alert('Sign In Failed', error.message || 'Failed to sign in with Google');
    }
  };

  return (
    <TouchableOpacity
      onPress={handleGoogleSignIn}
      style={styles.googleButton}
    >
      <AntDesign name="google" size={24} color="#4285F4" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SignInWithGoogle;
