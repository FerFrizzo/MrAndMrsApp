import { useState, useCallback } from 'react';
import { View } from 'react-native';
import { SplashScreen } from './src/components/SplashScreen';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ToastProvider } from './src/contexts/ToastContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  const handleSplashComplete = useCallback(() => {
    setIsAppReady(true);
  }, []);

  if (!isAppReady) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
      urlScheme="mrandmrsapp"
    >
      <SafeAreaProvider>
        <ToastProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </StripeProvider>
  );
}

