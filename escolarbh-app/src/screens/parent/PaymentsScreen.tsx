import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { theme } from '../../theme';
import { appApi, Subscription } from '../../services/api';

export default function PaymentsScreen() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubscriptions = async () => {
    setRefreshing(true);
    try {
      const data = await appApi.getMySubscriptions();
      setSubscriptions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const renderItem = ({ item }: { item: Subscription }) => {
    const statusColor = 
      item.status === 'PAID' ? theme.colors.status.success :
      item.status === 'PENDING' ? theme.colors.status.warning :
      theme.colors.status.error;

    const statusText = 
      item.status === 'PAID' ? 'PAGO' :
      item.status === 'PENDING' ? 'PENDENTE' :
      'ATRASADO';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.price}>R$ {item.amount.toFixed(2)}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{statusText}</Text>
          </View>
        </View>
        
        <Text style={styles.info}>
          Vencimento: {new Date(item.dueDate).toLocaleDateString()}
        </Text>
        
        {item.paymentDate && (
          <Text style={styles.info}>
            Pago em: {new Date(item.paymentDate).toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={subscriptions}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchSubscriptions} tintColor={theme.colors.brand[500]} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum pagamento encontrado.</Text>
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
  price: {
    fontSize: 20,
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
    marginTop: 4,
  },
  emptyText: {
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
