import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { theme } from '../../theme';
import { appApi, Contract } from '../../services/api';

export default function ContractsScreen() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContracts = async () => {
    setRefreshing(true);
    try {
      const data = await appApi.getMyContracts();
      setContracts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const renderContract = ({ item }: { item: Contract }) => {
    const statusColor = 
      item.status === 'ACTIVE' ? theme.colors.status.success :
      item.status === 'SUSPENDED' ? theme.colors.status.warning :
      theme.colors.status.error;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.parentName}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.info}>
          Vigência: {new Date(item.startDate).toLocaleDateString()} a {new Date(item.endDate).toLocaleDateString()}
        </Text>
        <Text style={styles.price}>R$ {item.monthlyFee.toFixed(2)} / mês</Text>
        
        {item.isDelinquent && (
          <View style={styles.alertBox}>
            <Text style={styles.alertText}>Inadimplente - Contate o responsável</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={contracts}
        keyExtractor={item => item.id}
        renderItem={renderContract}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchContracts} tintColor={theme.colors.brand[500]} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum contrato encontrado.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  list: {
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  info: {
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.brand[500],
    marginBottom: 8,
  },
  alertBox: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.status.error,
  },
  alertText: {
    color: theme.colors.status.error,
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
