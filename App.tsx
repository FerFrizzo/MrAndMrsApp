import React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SplashScreen } from './src/components/SplashScreen';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ToastProvider } from './src/contexts/ToastContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import Purchases from 'react-native-purchases';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const apiKey = Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

    if (apiKey) {
      try {
        Purchases.configure({ apiKey });
      } catch (e) {
        console.warn('RevenueCat configure failed:', e);
      }
    }

    const iosClientId = process.env.EXPO_PUBLIC_FIREBASE_IOS_ID;
    const webClientId = process.env.EXPO_PUBLIC_FIREBASE_WEB_ID;
    if (iosClientId && webClientId) {
      GoogleSignin.configure({ iosClientId, webClientId });
    }
  }, []);

  const handleSplashComplete = useCallback(() => {
    setIsAppReady(true);
  }, []);

  if (!isAppReady) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <StatusBar backgroundColor="#8A2BE2" translucent={false} />
        <SafeAreaProvider>
          <ToastProvider>
            <AuthProvider>
              <AppNavigator />
            </AuthProvider>
          </ToastProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

