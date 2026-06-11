import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { theme } from '../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DriverDashboardScreen() {
  const metrics = {
    totalExpected: 5400,
    totalPending: 1200,
    paidStudents: 18,
    unpaidStudents: 4,
    totalStudents: 22
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Visão Geral</Text>
        <Text style={styles.subtitle}>
          Acompanhe o faturamento, pagamentos do mês e relatórios.
        </Text>
      </View>

      <View style={styles.metricsContainer}>
        {/* Faturamento */}
        <View style={[styles.card, { borderLeftColor: theme.colors.brand[500] }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Faturamento Previsto (Mês)</Text>
            <MaterialCommunityIcons name="currency-usd" size={24} color={theme.colors.brand[500]} />
          </View>
          <Text style={styles.cardValue}>{formatCurrency(metrics.totalExpected)}</Text>
        </View>

        {/* Pendente */}
        <View style={[styles.card, { borderLeftColor: theme.colors.status.warning }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Pendente a Receber</Text>
            <MaterialCommunityIcons name="alert-circle-outline" size={24} color={theme.colors.status.warning} />
          </View>
          <Text style={styles.cardValue}>{formatCurrency(metrics.totalPending)}</Text>
        </View>

        {/* Pagos */}
        <View style={[styles.card, { borderLeftColor: theme.colors.status.success }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Mensalidades Pagas</Text>
            <MaterialCommunityIcons name="check-circle-outline" size={24} color={theme.colors.status.success} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.cardValue}>{metrics.paidStudents}</Text>
            <Text style={styles.cardSubValue}> / {metrics.totalStudents} alunos</Text>
          </View>
        </View>

        {/* Atrasados */}
        <View style={[styles.card, { borderLeftColor: theme.colors.status.error }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Mensalidades Atrasadas</Text>
            <MaterialCommunityIcons name="account-alert-outline" size={24} color={theme.colors.status.error} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.cardValue}>{metrics.unpaidStudents}</Text>
            <Text style={styles.cardSubValue}> alunos</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Relatórios Inteligentes (Power BI)</Text>
        <View style={styles.powerBiPlaceholder}>
          <MaterialCommunityIcons name="chart-bar" size={48} color={theme.colors.text.tertiary} style={{ marginBottom: 12 }} />
          <Text style={styles.powerBiTitle}>Painel do Power BI</Text>
          <Text style={styles.powerBiDesc}>
            Esta área está reservada para exibir os relatórios do Power BI via iframe no app.
          </Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  metricsContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  cardSubValue: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  section: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  powerBiPlaceholder: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 250,
    justifyContent: 'center',
  },
  powerBiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  powerBiDesc: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  }
});
