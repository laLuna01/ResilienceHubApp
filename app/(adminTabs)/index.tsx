import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/FirebaseConfig';
import { router } from 'expo-router';

type Shelter = {
  id: string;
  name: string;
  address: string;
  active: boolean;
  capacity?: number;
  currentOccupancy?: number;
  [key: string]: any; // Add this if there are more dynamic fields
};

const AdminHomeScreen = () => {
  const { userProfile } = useAuth();
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertForm, setAlertForm] = useState({
    title: '',
    description: '',
    type: 'flood',
    severity: 'medium',
    location: '',
  });

  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onRefresh();
  }, []);

  const loadShelterData = async () => {
    try {
      setLoading(true);

      // Buscar abrigo associado ao administrador
      const sheltersQuery = query(
        collection(db, 'shelters'),
        where('adminId', '==', userProfile?.uid)
      );

      console.log(userProfile.uid)

      const sheltersSnapshot = await getDocs(sheltersQuery);

      console.log(sheltersSnapshot)

      if (!sheltersSnapshot.empty) {
        const shelterData = sheltersSnapshot.docs[0].data();
        setShelter({
          id: sheltersSnapshot.docs[0].id,
          name: shelterData.name || '',
          address: shelterData.address || '',
          active: shelterData.active ?? false,
          capacity: shelterData.capacity,
          currentOccupancy: shelterData.currentOccupancy,
          ...shelterData,
        });
      } else {
        // Caso o administrador ainda não tenha um abrigo associado
        setShelter(null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do abrigo:', error);
      Alert.alert('Erro', 'Falha ao carregar dados do abrigo. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadShelterData();
  };

  const handleCreateAlert = async () => {
    // Validar formulário
    if (!alertForm.title.trim()) {
      Alert.alert('Erro', 'O título do alerta é obrigatório');
      return;
    }

    if (!alertForm.description.trim()) {
      Alert.alert('Erro', 'A descrição do alerta é obrigatória');
      return;
    }

    try {
      const alertData = {
        title: alertForm.title,
        description: alertForm.description,
        type: alertForm.type,
        severity: alertForm.severity,
        location: alertForm.location || shelter?.address || 'Localização não especificada',
        active: true,
        createdBy: userProfile?.uid,
        createdByName: userProfile?.name,
        shelterId: shelter?.id,
        shelterName: shelter?.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'alerts'), alertData);

      Alert.alert(
        'Sucesso',
        'Alerta criado com sucesso!',
        [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]
      );

      // Limpar formulário
      setAlertForm({
        title: '',
        description: '',
        type: 'flood',
        severity: 'medium',
        location: '',
      });

    } catch (error) {
      console.error('Erro ao criar alerta:', error);
      Alert.alert('Erro', 'Falha ao criar alerta. Tente novamente.');
    }
  };

  const toggleShelterStatus = async () => {
    if (!shelter) {return;}

    try {
      const newStatus = !shelter.active;

      await updateDoc(doc(db, 'shelters', shelter.id), {
        active: newStatus,
        updatedAt: new Date().toISOString(),
      });

      setShelter(prev => prev ? { ...prev, active: newStatus } : prev);

      Alert.alert(
        'Status Atualizado',
        `O abrigo foi ${newStatus ? 'ativado' : 'desativado'} com sucesso.`
      );
    } catch (error) {
      console.error('Erro ao atualizar status do abrigo:', error);
      Alert.alert('Erro', 'Falha ao atualizar status do abrigo. Tente novamente.');
    }
  };

  const renderAlertModal = () => (
    <Modal
      visible={alertModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setAlertModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Criar Novo Alerta</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setAlertModalVisible(false)}
            >
              <Icon name="close" size={24} color="#4a5568" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Título</Text>
              <TextInput
                style={styles.input}
                value={alertForm.title}
                onChangeText={(text) => setAlertForm(prev => ({ ...prev, title: text }))}
                placeholder="Título do alerta"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={alertForm.description}
                onChangeText={(text) => setAlertForm(prev => ({ ...prev, description: text }))}
                placeholder="Descrição detalhada do alerta"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipo de Alerta</Text>
              <View style={styles.selectContainer}>
                <TouchableOpacity
                  style={[
                    styles.selectOption,
                    alertForm.type === 'flood' && styles.selectOptionActive,
                  ]}
                  onPress={() => setAlertForm(prev => ({ ...prev, type: 'flood' }))}
                >
                  <Icon name="weather-flood" size={20} color={alertForm.type === 'flood' ? '#ffffff' : '#4a5568'} />
                  <Text style={[styles.selectText, alertForm.type === 'flood' && styles.selectTextActive]}>Inundação</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.selectOption,
                    alertForm.type === 'fire' && styles.selectOptionActive,
                  ]}
                  onPress={() => setAlertForm(prev => ({ ...prev, type: 'fire' }))}
                >
                  <Icon name="fire" size={20} color={alertForm.type === 'fire' ? '#ffffff' : '#4a5568'} />
                  <Text style={[styles.selectText, alertForm.type === 'fire' && styles.selectTextActive]}>Incêndio</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.selectOption,
                    alertForm.type === 'storm' && styles.selectOptionActive,
                  ]}
                  onPress={() => setAlertForm(prev => ({ ...prev, type: 'storm' }))}
                >
                  <Icon name="weather-lightning" size={20} color={alertForm.type === 'storm' ? '#ffffff' : '#4a5568'} />
                  <Text style={[styles.selectText, alertForm.type === 'storm' && styles.selectTextActive]}>Tempestade</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Severidade</Text>
              <View style={styles.selectContainer}>
                <TouchableOpacity
                  style={[
                    styles.selectOption,
                    alertForm.severity === 'low' && styles.selectOptionLow,
                  ]}
                  onPress={() => setAlertForm(prev => ({ ...prev, severity: 'low' }))}
                >
                  <Text style={[styles.selectText, alertForm.severity === 'low' && styles.selectTextActive]}>Baixa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.selectOption,
                    alertForm.severity === 'medium' && styles.selectOptionMedium,
                  ]}
                  onPress={() => setAlertForm(prev => ({ ...prev, severity: 'medium' }))}
                >
                  <Text style={[styles.selectText, alertForm.severity === 'medium' && styles.selectTextActive]}>Média</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.selectOption,
                    alertForm.severity === 'high' && styles.selectOptionHigh,
                  ]}
                  onPress={() => setAlertForm(prev => ({ ...prev, severity: 'high' }))}
                >
                  <Text style={[styles.selectText, alertForm.severity === 'high' && styles.selectTextActive]}>Alta</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Localização (opcional)</Text>
              <TextInput
                style={styles.input}
                value={alertForm.location}
                onChangeText={(text) => setAlertForm(prev => ({ ...prev, location: text }))}
                placeholder="Localização específica do alerta"
              />
              <Text style={styles.helperText}>
                Se não preenchido, será usado o endereço do abrigo
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setAlertModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateAlert}
            >
              <Text style={styles.createButtonText}>Criar Alerta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard do Administrador</Text>
        </View>

        {/* Admin Info */}
        <View style={styles.adminCard}>
          <View style={styles.adminInfo}>
            <Text style={styles.greeting}>Olá, {userProfile?.name || 'Administrador'}!</Text>
            <Text style={styles.subtitle}>Gerencie seu abrigo e emita alertas</Text>
          </View>
        </View>

        {/* Shelter Info */}
        {shelter ? (
          <View style={styles.shelterCard}>
            <View style={styles.shelterHeader}>
              <View>
                <Text style={styles.shelterName}>{shelter.name}</Text>
                <Text style={styles.shelterAddress}>{shelter.address}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  shelter.active ? styles.statusActive : styles.statusInactive,
                ]}
              >
                <Text style={styles.statusText}>
                  {shelter.active ? 'Ativo' : 'Inativo'}
                </Text>
              </View>
            </View>

            <View style={styles.shelterStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{shelter.currentOccupancy || 0}</Text>
                <Text style={styles.statLabel}>Ocupantes</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{shelter.capacity || 0}</Text>
                <Text style={styles.statLabel}>Capacidade</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {shelter.capacity
                    ? Math.round((shelter.currentOccupancy || 0) / shelter.capacity * 100)
                    : 0}%
                </Text>
                <Text style={styles.statLabel}>Ocupação</Text>
              </View>
            </View>

            <View style={styles.shelterActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  shelter.active ? styles.deactivateButton : styles.activateButton,
                ]}
                onPress={toggleShelterStatus}
              >
                <Icon
                  name={shelter.active ? 'close-circle' : 'check-circle'}
                  size={20}
                  color="#ffffff"
                />
                <Text style={styles.actionButtonText}>
                  {shelter.active ? 'Desativar Abrigo' : 'Ativar Abrigo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => router.navigate('/(adminTabs)/resources')}
              >
                <Icon name="eye" size={20} color="#1a365d" />
                <Text style={styles.viewButtonText}>Ver Detalhes</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noShelterCard}>
            <Icon name="home-alert" size={48} color="#a0aec0" />
            <Text style={styles.noShelterTitle}>Nenhum Abrigo Encontrado</Text>
            <Text style={styles.noShelterText}>
              Você ainda não tem um abrigo associado à sua conta. Entre em contato com o administrador do sistema.
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => setAlertModalVisible(true)}
              disabled={!shelter}
            >
              <View
                style={[
                  styles.actionIcon,
                  !shelter && styles.actionDisabled,
                ]}
              >
                <Icon name="bell-plus" size={24} color={shelter ? '#1a365d' : '#a0aec0'} />
              </View>
              <Text
                style={[
                  styles.actionText,
                  !shelter && styles.actionTextDisabled,
                ]}
              >
                Emitir Alerta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.navigate('/(adminTabs)/users')}
              disabled={!shelter}
            >
              <View
                style={[
                  styles.actionIcon,
                  !shelter && styles.actionDisabled,
                ]}
              >
                <Icon name="account-group" size={24} color={shelter ? '#1a365d' : '#a0aec0'} />
              </View>
              <Text
                style={[
                  styles.actionText,
                  !shelter && styles.actionTextDisabled,
                ]}
              >
                Gerenciar Usuários
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.navigate('/(adminTabs)/resources')}
              disabled={!shelter}
            >
              <View
                style={[
                  styles.actionIcon,
                  !shelter && styles.actionDisabled,
                ]}
              >
                <Icon name="package-variant" size={24} color={shelter ? '#1a365d' : '#a0aec0'} />
              </View>
              <Text
                style={[
                  styles.actionText,
                  !shelter && styles.actionTextDisabled,
                ]}
              >
                Recursos
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atividade Recente</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>
              Nenhuma atividade recente para exibir.
            </Text>
          </View>
        </View>
      </ScrollView>

      {renderAlertModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  scrollView: {
    flex: 1,
    paddingVertical: 20
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  adminCard: {
    backgroundColor: '#1a365d',
    padding: 20,
  },
  adminInfo: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0aec0',
  },
  shelterCard: {
    margin: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shelterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  shelterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  shelterAddress: {
    fontSize: 14,
    color: '#4a5568',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#c6f6d5',
  },
  statusInactive: {
    backgroundColor: '#fed7d7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  shelterStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  statLabel: {
    fontSize: 12,
    color: '#4a5568',
    marginTop: 4,
  },
  shelterActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  activateButton: {
    backgroundColor: '#38a169',
  },
  deactivateButton: {
    backgroundColor: '#e53e3e',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a365d',
    marginLeft: 8,
  },
  viewButtonText: {
    color: '#1a365d',
    fontWeight: '600',
    marginLeft: 8,
  },
  noShelterCard: {
    margin: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  noShelterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginTop: 16,
    marginBottom: 8,
  },
  noShelterText: {
    fontSize: 14,
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionDisabled: {
    backgroundColor: '#f7fafc',
  },
  actionText: {
    fontSize: 12,
    color: '#1a365d',
    textAlign: 'center',
  },
  actionTextDisabled: {
    color: '#a0aec0',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
  },
  activityText: {
    fontSize: 14,
    color: '#4a5568',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#a0aec0',
    marginTop: 4,
  },
  selectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectOptionActive: {
    backgroundColor: '#1a365d',
    borderColor: '#1a365d',
  },
  selectOptionLow: {
    backgroundColor: '#38a169',
    borderColor: '#38a169',
  },
  selectOptionMedium: {
    backgroundColor: '#dd6b20',
    borderColor: '#dd6b20',
  },
  selectOptionHigh: {
    backgroundColor: '#e53e3e',
    borderColor: '#e53e3e',
  },
  selectText: {
    fontSize: 14,
    color: '#4a5568',
    marginLeft: 4,
  },
  selectTextActive: {
    color: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#4a5568',
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1a365d',
    borderRadius: 8,
    marginLeft: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default AdminHomeScreen;

