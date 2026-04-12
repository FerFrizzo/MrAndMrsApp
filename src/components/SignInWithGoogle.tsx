import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from '../config/supabaseClient';

const SignInWithGoogle: React.FC = () => {
  const handlePress = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No ID token returned from Google');

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) throw error;
    } catch (e: any) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return;
      console.error('Google sign-in error:', e);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress} activeOpacity={0.85}>
      <AntDesign name="google" size={20} color="#4285F4" />
      <Text style={styles.text}>Continue with Google</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'white',
    borderRadius: 25,
    height: 50,
    width: '100%',
  },
  text: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignInWithGoogle;
