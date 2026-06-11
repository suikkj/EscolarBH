import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, ScrollView } from 'react-native';
import { theme } from '../../theme';
import { appApi, Student } from '../../services/api';
import * as Location from 'expo-location';

export default function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'TODOS' | 'MANHA' | 'TARDE' | 'INTEGRAL'>('TODOS');

  const fetchStudents = async () => {
    setRefreshing(true);
    try {
      const data = await appApi.getMyStudents();
      setStudents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleStatusChange = async (student: Student) => {
    const newStatus = student.status === 'PENDING' ? 'BOARDED' : student.status === 'BOARDED' ? 'DROPPED_OFF' : 'PENDING';
    
    // Optimistic update
    setStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: newStatus } : s));

    try {
      let lat = 0;
      let lng = 0;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      } else {
        Alert.alert("Aviso", "Permissão de localização não concedida. O registro será feito sem GPS.");
      }

      if (newStatus === 'BOARDED') {
        await appApi.checkInStudent(student.id, student.contractId || '', lat, lng);
      } else if (newStatus === 'DROPPED_OFF') {
        await appApi.checkOutStudent(student.id, student.contractId || '', lat, lng);
      }
    } catch (e) {
      console.error('Erro ao registrar presença:', e);
      Alert.alert("Erro", "Falha ao sincronizar presença no servidor.");
      // Revert optimistic update
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: student.status } : s));
    }
  };

  const moveStudent = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === students.length - 1) return;

    const newStudents = [...students];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    
    // Swap
    const temp = newStudents[index];
    newStudents[index] = newStudents[targetIndex];
    newStudents[targetIndex] = temp;

    setStudents(newStudents);
    // Idealmente, chamaríamos uma API para persistir a nova ordem de rota
  };

  const renderStudent = ({ item, index }: { item: Student, index: number }) => {
    const statusColor = 
      item.status === 'PENDING' ? theme.colors.status.warning :
      item.status === 'BOARDED' ? theme.colors.status.info :
      theme.colors.status.success;

    const statusText = 
      item.status === 'PENDING' ? 'A Caminho' :
      item.status === 'BOARDED' ? 'Embarcado' :
      'Desembarcado';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{statusText}</Text>
          </View>
        </View>
        <Text style={styles.info}>{item.schoolName}</Text>
        <Text style={styles.info}>{item.address}</Text>

        <View style={styles.orderControls}>
          <TouchableOpacity 
            style={[styles.orderBtn, index === 0 && { opacity: 0.3 }]} 
            onPress={() => moveStudent(index, 'UP')}
            disabled={index === 0}
          >
            <Text style={styles.orderIcon}>▲</Text>
          </TouchableOpacity>
          <Text style={styles.orderNumber}>{index + 1}º</Text>
          <TouchableOpacity 
            style={[styles.orderBtn, index === students.length - 1 && { opacity: 0.3 }]} 
            onPress={() => moveStudent(index, 'DOWN')}
            disabled={index === students.length - 1}
          >
            <Text style={styles.orderIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleStatusChange(item)}
        >
          <Text style={styles.actionButtonText}>
            {item.status === 'PENDING' ? 'Fazer Check-in' : item.status === 'BOARDED' ? 'Fazer Check-out' : 'Resetar Status'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const filteredStudents = students.filter(s => filter === 'TODOS' || (s as any).turno === filter);

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', padding: 16, paddingBottom: 0, gap: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['TODOS', 'MANHA', 'TARDE', 'INTEGRAL'] as const).map(f => (
            <TouchableOpacity 
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.colors.border,
                marginRight: 8,
                backgroundColor: filter === f ? theme.colors.brand[500] : theme.colors.background.surface,
              }}
            >
              <Text style={{ 
                color: filter === f ? '#fff' : theme.colors.text.secondary,
                fontWeight: filter === f ? 'bold' : 'normal'
              }}>
                {f === 'TODOS' ? 'Todos' : f === 'MANHA' ? 'Manhã' : f === 'TARDE' ? 'Tarde' : 'Integral'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={item => item.id}
        renderItem={renderStudent}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchStudents} tintColor={theme.colors.brand[500]} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum aluno encontrado.</Text>
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
    marginBottom: 4,
  },
  actionButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.background.elevated,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    color: theme.colors.brand[500],
    fontWeight: 'bold',
  },
  emptyText: {
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  orderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 8,
  },
  orderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.background.main,
    borderRadius: 4,
  },
  orderIcon: {
    color: theme.colors.text.primary,
    fontSize: 16,
  },
  orderNumber: {
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    fontSize: 16,
    marginHorizontal: 16,
  },
});
