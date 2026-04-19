import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScanResultScreen from './src/screens/ScanResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import FavouritesScreen from './src/screens/FavouritesScreen';
import AIAssistantScreen from './src/screens/AIAssistantScreen';

import LabelScanScreen from './src/screens/LabelScanScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createStackNavigator();

// Auth screens — shown when nobody is logged in
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}


// App screens — shown when user is logged in
function AppStack() {
  return (

    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ScanResult" component={ScanResultScreen} />
      
      <Stack.Screen name="LabelScan" component={LabelScanScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Favourites" component={FavouritesScreen} />
      <Stack.Screen name="AIAssistant" component={AIAssistantScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen}/>
    </Stack.Navigator>
  );
}

// Decides which stack to show based on login status
function RootNavigator() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking if user is logged in
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0E8' }}>
        <ActivityIndicator size="large" color="#2D4A3E" />
      </View>
    );
  }

  // If user is logged in show app screens, otherwise show auth screens
  return user ? <AppStack /> : <AuthStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
  <Stack.Screen name="Profile" component={ProfileScreen} />
}
