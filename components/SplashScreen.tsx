import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useSharedValue,
  runOnJS
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1, { damping: 15 }),
      withTiming(1.1, { duration: 1000 }),
      withTiming(1, { duration: 1000 }, (finished) => {
        if (finished) {
          opacity.value = withTiming(0, { duration: 500 }, () => {
            runOnJS(onAnimationComplete)();
          });
        }
      })
    );
  }, []);

  return (
    <View style={styles.container}>
      <Text>Splash Screen</Text>
      <StatusBar style="light" />
      <Animated.View style={[styles.logoContainer, animatedStyles]}>
        <Image
          source={require('../assets/splash-icon.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
}); 