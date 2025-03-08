import { useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { SplashScreen } from './components/SplashScreen';

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  const handleSplashComplete = useCallback(() => {
    setIsAppReady(true);
  }, []);

  if (!isAppReady) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Text>Bla</Text>
    </View>
  );
}

