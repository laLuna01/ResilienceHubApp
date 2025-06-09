import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/FirebaseConfig';

type Resource = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  description?: string;
  [key: string]: any;
};

const AdminResourcesScreen = () => {
  const { userProfile } = useAuth();
  type Shelter = {
    id: string;
    name: string;
    [key: string]: any;
  };
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resourceForm, setResourceForm] = useState({
    name: '',
    category: 'food',
    quantity: '',
    unit: 'unidades',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true);

      // Buscar abrigo do administrador
      const sheltersQuery = query(
        collection(db, 'shelters'),
        where('adminId', '==', userProfile?.uid)
      );

      const sheltersSnapshot = await getDocs(sheltersQuery);

      if (!sheltersSnapshot.empty) {
        const shelterData = sheltersSnapshot.docs[0].data();
        const shelterId = sheltersSnapshot.docs[0].id;

        setShelter({
            id: shelterId,
            ...shelterData,
            name: ''
        });

        // Buscar recursos do abrigo
        const resourcesQuery = query(
          collection(db, 'resources'),
          where('shelterId', '==', shelterId)
        );

        const resourcesSnapshot = await getDocs(resourcesQuery);
        const resourcesData = resourcesSnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name ?? '',
            category: data.category ?? '',
            quantity: typeof data.quantity === 'number' ? data.quantity : 0,
            unit: data.unit ?? '',
            description: data.description ?? '',
            ...data,
          };
        });

        setResources(resourcesData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Falha ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openResourceModal = (resource: Resource | null = null) => {
    if (resource) {
      setEditingResource(resource);
      setResourceForm({
        name: resource.name,
        category: resource.category,
        quantity: resource.quantity.toString(),
        unit: resource.unit,
        description: resource.description || '',
      });
    } else {
      setEditingResource(null);
      setResourceForm({
        name: '',
        category: 'food',
        quantity: '',
        unit: 'unidades',
        description: '',
      });
    }
    setModalVisible(true);
  };

  const handleSaveResource = async () => {
    // Validar formulário
    if (!resourceForm.name.trim()) {
      Alert.alert('Erro', 'O nome do recurso é obrigatório');
      return;
    }

    if (!resourceForm.quantity.trim() || isNaN(Number(resourceForm.quantity))) {
      Alert.alert('Erro', 'A quantidade deve ser um número válido');
      return;
    }

    try {
      if (!shelter) {
        Alert.alert('Erro', 'Abrigo não encontrado. Não é possível salvar o recurso.');
        return;
      }
      const resourceDataBase = {
        name: resourceForm.name,
        category: resourceForm.category,
        quantity: parseInt(resourceForm.quantity),
        unit: resourceForm.unit,
        description: resourceForm.description,
        shelterId: shelter.id,
        shelterName: shelter.name,
        updatedAt: new Date().toISOString(),
      };

      if (editingResource) {
        // Atualizar recurso existente
        await updateDoc(doc(db, 'resources', editingResource.id), resourceDataBase);
        Alert.alert('Sucesso', 'Recurso atualizado com sucesso!');
      } else {
        // Criar novo recurso
        const resourceData = {
          ...resourceDataBase,
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'resources'), resourceData);
        Alert.alert('Sucesso', 'Recurso adicionado com sucesso!');
      }

      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar recurso:', error);
      Alert.alert('Erro', 'Falha ao salvar recurso. Tente novamente.');
    }
  };

  const handleDeleteResource = (resource: { name: any; id: string; }) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o recurso "${resource.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'resources', resource.id));
              Alert.alert('Sucesso', 'Recurso excluído com sucesso!');
              loadData();
            } catch (error) {
              console.error('Erro ao excluir recurso:', error);
              Alert.alert('Erro', 'Falha ao excluir recurso. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: any) => {
    switch (category) {
      case 'food': return 'food';
      case 'water': return 'water';
      case 'medicine': return 'medical-bag';
      case 'clothing': return 'tshirt-crew';
      case 'hygiene': return 'shower';
      case 'bedding': return 'bed';
      case 'tools': return 'tools';
      default: return 'package-variant';
    }
  };

  const getCategoryName = (category: any) => {
    switch (category) {
      case 'food': return 'Alimentos';
      case 'water': return 'Água';
      case 'medicine': return 'Medicamentos';
      case 'clothing': return 'Roupas';
      case 'hygiene': return 'Higiene';
      case 'bedding': return 'Cama/Roupa de Cama';
      case 'tools': return 'Ferramentas';
      default: return 'Outros';
    }
  };

  const renderResourceItem = ({ item }: { item: any }) => (
    <View style={styles.resourceCard}>
      <View style={styles.resourceHeader}>
        <View style={styles.resourceIcon}>
          <Icon name={getCategoryIcon(item.category)} size={24} color="#1a365d" />
        </View>
        <View style={styles.resourceInfo}>
          <Text style={styles.resourceName}>{item.name}</Text>
          <Text style={styles.resourceCategory}>
            {getCategoryName(item.category)}
          </Text>
        </View>
        <View style={styles.resourceActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openResourceModal(item)}
          >
            <Icon name="pencil" size={20} color="#3182ce" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteResource(item)}
          >
            <Icon name="delete" size={20} color="#e53e3e" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.resourceDetails}>
        <Text style={styles.resourceQuantity}>
          {item.quantity} {item.unit}
        </Text>
        {item.description && (
          <Text style={styles.resourceDescription}>{item.description}</Text>
        )}
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="package-variant-closed" size={64} color="#a0aec0" />
      <Text style={styles.emptyText}>Nenhum recurso cadastrado</Text>
      <Text style={styles.emptySubtext}>
        Adicione recursos para gerenciar o estoque do seu abrigo
      </Text>
    </View>
  );

  const renderResourceModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingResource ? 'Editar Recurso' : 'Adicionar Recurso'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Icon name="close" size={24} color="#4a5568" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
          <View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome do Recurso</Text>
              <TextInput
                style={styles.input}
                value={resourceForm.name}
                onChangeText={(text) => setResourceForm(prev => ({ ...prev, name: text }))}
                placeholder="Ex: Água mineral, Arroz, Cobertores..."
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Categoria</Text>
              <View style={styles.categoryGrid}>
                {[
                  { key: 'food', label: 'Alimentos', icon: 'food' },
                  { key: 'water', label: 'Água', icon: 'water' },
                  { key: 'medicine', label: 'Medicamentos', icon: 'medical-bag' },
                  { key: 'clothing', label: 'Roupas', icon: 'tshirt-crew' },
                  { key: 'hygiene', label: 'Higiene', icon: 'shower' },
                  { key: 'bedding', label: 'Cama', icon: 'bed' },
                ].map((category) => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.categoryOption,
                      resourceForm.category === category.key && styles.categoryOptionActive,
                    ]}
                    onPress={() => setResourceForm(prev => ({ ...prev, category: category.key }))}
                  >
                    <Icon
                      name={category.icon}
                      size={20}
                      color={resourceForm.category === category.key ? '#ffffff' : '#4a5568'}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        resourceForm.category === category.key && styles.categoryTextActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 2 }]}>
                <Text style={styles.label}>Quantidade</Text>
                <TextInput
                  style={styles.input}
                  value={resourceForm.quantity}
                  onChangeText={(text) => setResourceForm(prev => ({ ...prev, quantity: text }))}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Unidade</Text>
                <TextInput
                  style={styles.input}
                  value={resourceForm.unit}
                  onChangeText={(text) => setResourceForm(prev => ({ ...prev, unit: text }))}
                  placeholder="unidades"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Descrição (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={resourceForm.description}
                onChangeText={(text) => setResourceForm(prev => ({ ...prev, description: text }))}
                placeholder="Informações adicionais sobre o recurso..."
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveResource}
            >
              <Text style={styles.saveButtonText}>
                {editingResource ? 'Atualizar' : 'Adicionar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!shelter) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noShelterContainer}>
          <Icon name="home-alert" size={64} color="#a0aec0" />
          <Text style={styles.noShelterText}>
            Nenhum abrigo encontrado para gerenciar recursos
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recursos do Abrigo</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openResourceModal()}
        >
          <Icon name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.shelterInfo}>
        <Text style={styles.shelterName}>{shelter.name}</Text>
        <Text style={styles.resourceCount}>
          {resources.length} {resources.length === 1 ? 'recurso' : 'recursos'} cadastrados
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a365d" />
          <Text style={styles.loadingText}>Carregando recursos...</Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          renderItem={renderResourceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {renderResourceModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
    paddingVertical: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a365d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shelterInfo: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  shelterName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a365d',
  },
  resourceCount: {
    fontSize: 14,
    color: '#4a5568',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  resourceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a365d',
  },
  resourceCategory: {
    fontSize: 14,
    color: '#4a5568',
    marginTop: 2,
  },
  resourceActions: {
    flexDirection: 'row',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ebf8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fed7d7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f7fafc',
    paddingTop: 12,
  },
  resourceQuantity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#4a5568',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a5568',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  noShelterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noShelterText: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
    marginTop: 16,
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
  formRow: {
    flexDirection: 'row',
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
    height: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    margin: 4,
    minWidth: '30%',
  },
  categoryOptionActive: {
    backgroundColor: '#1a365d',
    borderColor: '#1a365d',
  },
  categoryText: {
    fontSize: 12,
    color: '#4a5568',
    marginLeft: 4,
  },
  categoryTextActive: {
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
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1a365d',
    borderRadius: 8,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default AdminResourcesScreen;

