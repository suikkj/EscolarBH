import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from '../../components/Map';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { appApi, Student, Contract, Subscription } from '../../services/api';

export default function HomeScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Usando mock para parent
      const [sData, cData, subData] = await Promise.all([
        appApi.getMyStudents(),
        appApi.getMyContracts(),
        appApi.getMySubscriptions(),
      ]);
      setStudents(sData);
      setContracts(cData);
      setSubscriptions(subData);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const nextPayment = subscriptions.find(s => s.status === 'PENDING' || s.status === 'OVERDUE');

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={theme.colors.brand[500]} />}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
        <View style={styles.card}>
          {nextPayment ? (
            <>
              <Text style={styles.label}>Próximo Vencimento</Text>
              <Text style={styles.value}>{new Date(nextPayment.dueDate).toLocaleDateString()}</Text>
              <Text style={styles.price}>R$ {nextPayment.amount.toFixed(2)}</Text>
              <View style={[
                styles.badge, 
                { backgroundColor: nextPayment.status === 'OVERDUE' ? theme.colors.status.error : theme.colors.status.warning }
              ]}>
                <Text style={styles.badgeText}>{nextPayment.status === 'OVERDUE' ? 'ATRASADO' : 'PENDENTE'}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>Tudo em dia! Nenhum pagamento pendente.</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meus Filhos (Alunos)</Text>
        {students.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum aluno vinculado.</Text>
        ) : (
          students.map(student => (
            <View key={student.id} style={styles.card}>
              <Text style={styles.name}>{student.firstName} {student.lastName}</Text>
              <Text style={styles.info}>{student.schoolName}</Text>
              <View style={[
                styles.badge, 
                { alignSelf: 'flex-start', marginTop: 8, backgroundColor: student.status === 'PENDING' ? theme.colors.status.warning : theme.colors.status.info }
              ]}>
                <Text style={styles.badgeText}>
                  {student.status === 'PENDING' ? 'Aguardando Busca' : student.status === 'BOARDED' ? 'Na Van' : 'Entregue'}
                </Text>
              </View>

              {/* Live Tracking Map - Mostrar se a rota estiver ativa (simulado) */}
              {student.status !== 'DROPPED_OFF' && (
                <View style={styles.trackingContainer}>
                  <View style={styles.etaHeader}>
                    <Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />
                    <Text style={styles.etaText}>
                      ETA: Aprox. {Math.max(5, (student.ordemRota || 1) * 7)} mins
                    </Text>
                  </View>
                  <View style={styles.mapWrapper}>
                    {Platform.OS === 'web' ? (
                      <View style={[styles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0e0e0' }]}>
                        <Text>📍 Mapa de Tracking (Apenas no Celular)</Text>
                      </View>
                    ) : (
                      <MapView
                        provider={PROVIDER_DEFAULT}
                        style={styles.map}
                        scrollEnabled={false}
                        initialRegion={{
                          latitude: -19.916681,
                          longitude: -43.934493,
                          latitudeDelta: 0.02,
                          longitudeDelta: 0.02,
                        }}
                      >
                        {/* Posição da Van (Simulada) */}
                        <Marker
                          coordinate={{ latitude: -19.916681, longitude: -43.934493 }}
                          title="Van Escolar"
                          pinColor={theme.colors.brand[500]}
                        />
                        {/* Ponto de Busca do Aluno (Simulado se não houver) */}
                        <Marker
                          coordinate={{ latitude: -19.92, longitude: -43.94 }}
                          title={student.firstName}
                          pinColor={theme.colors.status.warning}
                        />
                      </MapView>
                    )}
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.brand[500],
    marginBottom: theme.spacing.sm,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  info: {
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyText: {
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
  trackingContainer: {
    marginTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  etaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  etaText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  mapWrapper: {
    height: 150,
    width: '100%',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
