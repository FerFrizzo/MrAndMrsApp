import React from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from '../config/supabaseClient';
import { useToast } from '../contexts/ToastContext';

const SignInWithApple: React.FC = () => {
  const { showToast } = useToast();

  if (Platform.OS !== 'ios') return null;

  const handlePress = async () => {
    try {
      const rawNonceBytes = await Crypto.getRandomBytesAsync(32);
      const rawNonce = Array.from(rawNonceBytes as Uint8Array)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
        nonce: rawNonce,
      });

      if (error) throw error;
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        console.error('Apple sign-in error:', e);
        showToast('Sign in with Apple failed. Please try again.', 'error');
      }
    }
  };

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
      cornerRadius={25}
      style={{ width: '100%', height: 50 }}
      onPress={handlePress}
    />
  );
};

export default SignInWithApple;
