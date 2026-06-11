import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { theme } from '../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const mockFinanceData = [
  { id: '1', nome: 'João Pedro', responsavel: 'Carlos Santos', valor: 350.0, status: 'EM_DIA' },
  { id: '2', nome: 'Maria Clara', responsavel: 'Ana Silva', valor: 400.0, status: 'PENDENTE' },
  { id: '3', nome: 'Lucas Silva', responsavel: 'Roberto Silva', valor: 350.0, status: 'EM_DIA' },
  { id: '4', nome: 'Ana Beatriz', responsavel: 'Fernanda Lima', valor: 450.0, status: 'PENDENTE' },
];

export default function DriverFinanceScreen() {
  const [studentsData, setStudentsData] = useState(mockFinanceData);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [pendingChanges, setPendingChanges] = useState<{ id: string, name: string, oldVal: number, newVal: number }[]>([]);

  const handleValueChange = (id: string, newValue: string) => {
    if (!isEditing) return;
    const cleanValue = newValue.replace(/[^0-9.,]/g, '').replace(',', '.');
    const numericValue = parseFloat(cleanValue);

    setStudentsData(prev => prev.map(student => {
      if (student.id === id) {
        return { ...student, inputValue: newValue, valor: isNaN(numericValue) ? 0 : numericValue };
      }
      return student;
    }));
  };

  const handleSave = () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    const changes = studentsData.filter(s => {
      const newVal = (s as any).valor;
      const oldVal = mockFinanceData.find(m => m.id === s.id)?.valor || 0;
      return newVal !== oldVal;
    }).map(s => ({
      id: s.id,
      name: s.nome,
      oldVal: mockFinanceData.find(m => m.id === s.id)?.valor || 0,
      newVal: (s as any).valor
    }));

    if (changes.length === 0) {
      setIsEditing(false);
      return;
    }

    setPendingChanges(changes);
    setModalStep(1);
    setShowModal(true);
  };

  const confirmSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setModalStep(2);
    }, 1500);
  };

  const closeModal = () => {
    setShowModal(false);
    if (modalStep === 2) {
      mockFinanceData.forEach(m => {
        const changed = pendingChanges.find(p => p.id === m.id);
        if (changed) m.valor = changed.newVal;
      });
      setIsEditing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Financeiro e Mensalidades</Text>
          <Text style={styles.subtitle}>Gerencie os valores cobrados de cada aluno.</Text>
        </View>
        <TouchableOpacity style={[styles.saveBtn, isEditing && { backgroundColor: theme.colors.status.success }]} onPress={handleSave} disabled={saving}>
          <MaterialCommunityIcons name={isEditing ? "content-save" : "pencil"} size={20} color="#fff" />
          <Text style={styles.saveBtnText}>{saving ? '...' : isEditing ? 'Salvar' : 'Editar'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.listContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        {studentsData.map(student => (
          <View key={student.id} style={styles.card}>
            <View style={styles.studentInfoRow}>
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="currency-usd" size={24} color={theme.colors.brand[500]} />
              </View>
              <View style={styles.studentTextInfo}>
                <Text style={styles.studentName}>{student.nome}</Text>
                <Text style={styles.studentResp}>Resp: {student.responsavel}</Text>
              </View>
            </View>

            <View style={styles.inputsRow}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>MENSALIDADE</Text>
                <View style={styles.currencyInputContainer}>
                  <Text style={styles.currencySymbol}>R$</Text>
                  <TextInput
                    style={[styles.input, !isEditing && { opacity: 0.7, backgroundColor: theme.colors.background.main }]}
                    value={(student as any).inputValue ?? student.valor.toFixed(2)}
                    onChangeText={(text) => handleValueChange(student.id, text)}
                    keyboardType="numeric"
                    editable={isEditing}
                  />
                </View>
              </View>

              <View style={styles.statusWrapper}>
                <Text style={styles.label}>STATUS</Text>
                {student.status === 'EM_DIA' ? (
                  <View style={styles.statusBadge}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.status.success} />
                    <Text style={[styles.statusText, { color: theme.colors.status.success }]}>Em Dia</Text>
                  </View>
                ) : (
                  <View style={styles.statusBadge}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color={theme.colors.status.error} />
                    <Text style={[styles.statusText, { color: theme.colors.status.error }]}>Atrasado</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {modalStep === 1 ? (
              <>
                <Text style={styles.modalTitle}>Confirmar Alterações</Text>
                <Text style={styles.modalDesc}>
                  Você está alterando o valor da mensalidade para os seguintes alunos. Ao confirmar, um e-mail automático será enviado aos responsáveis.
                </Text>

                <ScrollView style={styles.changesList}>
                  {pendingChanges.map(change => (
                    <View key={change.id} style={styles.changeItem}>
                      <Text style={styles.changeName}>{change.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.oldVal}>R$ {change.oldVal.toFixed(2)}</Text>
                        <MaterialCommunityIcons name="arrow-right" size={16} color={theme.colors.text.tertiary} />
                        <Text style={styles.newVal}>R$ {change.newVal.toFixed(2)}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.btnCancel} onPress={closeModal}>
                    <Text style={styles.btnCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnConfirm} onPress={confirmSave} disabled={saving}>
                    <Text style={styles.btnConfirmText}>{saving ? 'Enviando...' : 'Confirmar e Notificar'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <MaterialCommunityIcons name="check-circle" size={64} color={theme.colors.status.success} style={{ marginBottom: 16 }} />
                <Text style={styles.modalTitle}>Alteração Concluída!</Text>
                <Text style={[styles.modalDesc, { textAlign: 'center' }]}>
                  As mensalidades foram atualizadas e os e-mails informativos foram enviados para os responsáveis.
                </Text>
                <TouchableOpacity style={[styles.btnConfirm, { width: '100%', marginTop: 16 }]} onPress={closeModal}>
                  <Text style={styles.btnConfirmText}>Entendi</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flexWrap: 'wrap',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
    marginBottom: 0,
  },
  saveBtn: {
    backgroundColor: theme.colors.brand[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentTextInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  studentResp: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  inputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
  },
  inputWrapper: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.text.tertiary,
    marginBottom: 8,
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.main,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    color: theme.colors.text.secondary,
    fontWeight: 'bold',
    marginRight: 4,
  },
  input: {
    flex: 1,
    height: 40,
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  statusWrapper: {
    width: 100,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  changesList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  changeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  changeName: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  oldVal: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  newVal: {
    fontSize: 14,
    color: theme.colors.brand[500],
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: theme.colors.background.main,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnCancelText: {
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  btnConfirm: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: theme.colors.brand[500],
  },
  btnConfirmText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
