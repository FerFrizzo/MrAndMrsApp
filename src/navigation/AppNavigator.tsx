// src/navigation/AppNavigator.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text } from 'react-native';
import { supabase } from '../config/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { RootStackParamList } from '../types/RootStackParamList';
import { Purple } from '../utils/Colors';
import { AntDesign, Ionicons } from '@expo/vector-icons';

// Auth Screens
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import PasswordRecoveryScreen from '../screens/PasswordRecoveryScreen';

// Main Screens
import DashboardScreen from '../screens/DashboardScreen';
import CreateGameScreen from '../screens/CreateGameScreen';
import GameDetailsScreen from '../screens/GameDetailsScreen';
import GameQuestionScreen from '../screens/GameQuestionScreen';
import ReviewAnswersScreen from '../screens/ReviewAnswersScreen';
import GameResultScreen from '../screens/GameResultScreen';
import AccountScreen from '../screens/AccountScreen';
// Uncomment these when the screens are created
// import ProfileScreen from '../screens/ProfileScreen';
// import PlayGameScreen from '../screens/PlayGameScreen';
// import ResultsScreen from '../screens/ResultsScreen';

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<RootStackParamList>();
const MainStack = createStackNavigator<RootStackParamList>();

// Auth Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <AuthStack.Screen name="SignIn" component={SignInScreen} />
    <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    <AuthStack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />
  </AuthStack.Navigator>
);

// Main App Navigator with Stack Navigator containing the screens
const MainAppNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{ headerShown: false }}
    />
    <MainStack.Screen
      name="CreateGame"
      component={CreateGameScreen}
      options={{ headerShown: false }}
    />
    <MainStack.Screen
      name="GameDetails"
      component={GameDetailsScreen}
      options={{ headerShown: false }}
    />
    <MainStack.Screen
      name="GameQuestion"
      component={GameQuestionScreen}
      options={{ headerShown: false }}
    />
    <MainStack.Screen
      name="ReviewAnswers"
      component={ReviewAnswersScreen}
      options={{ headerShown: false }}
    />
    <MainStack.Screen
      name="GameResult"
      component={GameResultScreen}
      options={{ headerShown: false }}
    />
    <MainStack.Screen
      name="Account"
      component={AccountScreen}
      options={{ headerShown: false }}
    />
    {/* Uncomment these when the screens are created
    <MainStack.Screen 
      name="PlayGame" 
      component={PlayGameScreen}
      options={{ title: 'Play Game' }}
    />
    <MainStack.Screen 
      name="Results" 
      component={ResultsScreen}
      options={{ title: 'Results' }}
    />
    */}
  </MainStack.Navigator>
);

// Root Navigator
const AppNavigator = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setLoading(false);
      }
    );

    // Check for an existing session
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setLoading(false);
    };

    checkSession();

    // Clean up the subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8A4FFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? <MainAppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;