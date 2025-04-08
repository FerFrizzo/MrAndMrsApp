// src/navigation/AppNavigator.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
// Uncomment these when the screens are created
// import ProfileScreen from '../screens/ProfileScreen';
// import PlayGameScreen from '../screens/PlayGameScreen';
// import ResultsScreen from '../screens/ResultsScreen';

// Define navigation types
type MainTabParamList = {
  Dashboard: undefined;
  CreateGame: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<RootStackParamList>();
const MainStack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

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

// Main Tab Navigator
const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: 'white',
      tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
      headerShown: false,
      tabBarStyle: {
        backgroundColor: Purple,
        borderTopWidth: 0,
        height: 70,
        paddingBottom: 10,
        paddingTop: 10,
      },
      tabBarItemStyle: {
        margin: 5,
      },
      tabBarLabelStyle: {
        fontSize: 12,
      }
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        tabBarLabel: '',
        tabBarIcon: ({ color, size }) => (
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <AntDesign name="home" size={22} color={Purple} />
          </View>
        ),
      }}
    />
    <Tab.Screen
      name="CreateGame"
      component={CreateGameScreen}
      options={{
        tabBarLabel: '',
        tabBarIcon: ({ color, size }) => (
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <AntDesign name="pluscircleo" size={22} color={Purple} />
          </View>
        ),
      }}
    />
    {/* Uncomment when ProfileScreen is created
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{
        tabBarLabel: '',
        tabBarIcon: ({ color, size }) => (
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Ionicons name="person-outline" size={22} color={Purple} />
          </View>
        ),
      }}
    />
    */}
  </Tab.Navigator>
);

// Main App Navigator with Stack Navigator containing the Tab Navigator
const MainAppNavigator = () => (
  <MainStack.Navigator>
    <MainStack.Screen
      name="MainTabs"
      component={MainTabNavigator}
      options={{ headerShown: false }}
    />
    <MainStack.Screen
      name="GameDetails"
      component={GameDetailsScreen}
      options={{ headerShown: false }}
    />
    <MainStack.Screen
      name="GameQuestion"
      component={GameDetailsScreen}
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