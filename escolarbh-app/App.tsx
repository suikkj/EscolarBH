import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/hooks/AuthProvider';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { theme } from './src/theme';
import * as Notifications from './src/services/notifications';

// Screens
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ProfileScreen from './src/screens/shared/ProfileScreen';
import AnnouncementsScreen from './src/screens/shared/AnnouncementsScreen';

// Driver Screens
import DriverDashboardScreen from './src/screens/driver/DriverDashboardScreen';
import DriverFinanceScreen from './src/screens/driver/DriverFinanceScreen';
import MapScreen from './src/screens/driver/MapScreen';
import StudentsScreen from './src/screens/driver/StudentsScreen';
import ContractsScreen from './src/screens/driver/ContractsScreen';

// Parent Screens
import HomeScreen from './src/screens/parent/HomeScreen';
import PaymentsScreen from './src/screens/parent/PaymentsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DriverTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background.surface },
        headerTintColor: theme.colors.text.primary,
        tabBarStyle: { backgroundColor: theme.colors.background.surface, borderTopColor: theme.colors.border },
        tabBarActiveTintColor: theme.colors.brand[500],
        tabBarInactiveTintColor: theme.colors.text.tertiary,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DriverDashboardScreen} 
        options={{
          title: 'Visão Geral',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="Finance" 
        component={DriverFinanceScreen} 
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="currency-usd" color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="map-marker-radius" color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="Students" 
        component={StudentsScreen} 
        options={{
          title: 'Alunos',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group" color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="Contracts" 
        component={ContractsScreen} 
        options={{
          title: 'Contratos',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="file-document" color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="Announcements" 
        component={AnnouncementsScreen} 
        options={{
          title: 'Avisos',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="bullhorn" color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" color={color} size={size} />
        }} 
      />
    </Tab.Navigator>
  );
}

function ParentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background.surface },
        headerTintColor: theme.colors.text.primary,
        tabBarStyle: { backgroundColor: theme.colors.background.surface, borderTopColor: theme.colors.border },
        tabBarActiveTintColor: theme.colors.brand[500],
        tabBarInactiveTintColor: theme.colors.text.tertiary,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          title: 'Resumo',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="Payments" 
        component={PaymentsScreen} 
        options={{
          title: 'Pagamentos',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="currency-usd" color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="Announcements" 
        component={AnnouncementsScreen} 
        options={{
          title: 'Avisos',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="bullhorn" color={color} size={size} />
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" color={color} size={size} />
        }} 
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (user) {
      Notifications.registerForPushNotificationsAsync();
    }
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background.main }}>
        <ActivityIndicator size="large" color={theme.colors.brand[500]} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : role === 'CONTRATANTE' ? (
          <Stack.Screen name="ParentApp" component={ParentTabNavigator} />
        ) : (
          <Stack.Screen name="DriverApp" component={DriverTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </AuthProvider>
  );
}
