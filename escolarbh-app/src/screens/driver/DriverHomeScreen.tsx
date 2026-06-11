import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/AuthProvider';

export default function DriverHomeScreen({ navigation }: any) {
  const { user } = useAuth();

  const startRoute = (period: 'MANHA' | 'TARDE') => {
    // Navigate to map and pass the period parameter
    navigation.navigate('Map', { period });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, Motorista!</Text>
        <Text style={styles.subtitle}>Pronto para mais um dia de trabalho?</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rotas do Dia</Text>
        
        <TouchableOpacity style={[styles.routeCard, { borderLeftColor: theme.colors.brand[400] }]} onPress={() => startRoute('MANHA')}>
          <View style={styles.routeIcon}>
            <Ionicons name="sunny-outline" size={32} color={theme.colors.brand[500]} />
          </View>
          <View style={styles.routeInfo}>
            <Text style={styles.routeName}>Turno da Manhã</Text>
            <Text style={styles.routeDesc}>Iniciar busca dos alunos</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.routeCard, { borderLeftColor: theme.colors.status.warning }]} onPress={() => startRoute('TARDE')}>
          <View style={styles.routeIcon}>
            <Ionicons name="partly-sunny-outline" size={32} color={theme.colors.status.warning} />
          </View>
          <View style={styles.routeInfo}>
            <Text style={styles.routeName}>Turno da Tarde</Text>
            <Text style={styles.routeDesc}>Iniciar busca dos alunos</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Students')}>
            <MaterialCommunityIcons name="account-group" size={28} color={theme.colors.text.secondary} />
            <Text style={styles.actionText}>Gerenciar Alunos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Contracts')}>
            <MaterialCommunityIcons name="file-document" size={28} color={theme.colors.text.secondary} />
            <Text style={styles.actionText}>Contratos</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  routeIcon: {
    marginRight: 16,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  routeDesc: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
});
