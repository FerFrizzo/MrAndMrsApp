import { useState, useCallback } from 'react';
import { View } from 'react-native';
import { SplashScreen } from './src/components/SplashScreen';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ToastProvider } from './src/contexts/ToastContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  const handleSplashComplete = useCallback(() => {
    setIsAppReady(true);
  }, []);

  if (!isAppReady) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

