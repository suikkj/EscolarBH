import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('@has_seen_onboarding');
      if (hasSeenOnboarding === 'true') {
        navigation.replace('Login');
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    await AsyncStorage.setItem('@has_seen_onboarding', 'true');
    navigation.replace('Login');
  };

  if (loading) return null;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.imageContainer}>
        <Image 
          source={require('../../assets/splash.png')} 
          style={styles.image} 
          resizeMode="contain" 
        />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>Bem-vindo ao Escolar Allyson</Text>
        <Text style={styles.description}>
          O aplicativo que conecta você ao transporte escolar do seu filho com segurança, previsibilidade e informações em tempo real.
        </Text>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📍</Text>
            <Text style={styles.featureText}>Acompanhe a van em tempo real no mapa.</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔔</Text>
            <Text style={styles.featureText}>Receba notificações de embarque e desembarque.</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📄</Text>
            <Text style={styles.featureText}>Gerencie mensalidades e comunicados facilmente.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleStart}>
          <Text style={styles.buttonText}>Começar Agora</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
  },
  contentContainer: {
    flex: 1.2,
    backgroundColor: theme.colors.background.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  featureList: {
    width: '100%',
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  button: {
    backgroundColor: theme.colors.brand[500],
    width: '100%',
    padding: 16,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
