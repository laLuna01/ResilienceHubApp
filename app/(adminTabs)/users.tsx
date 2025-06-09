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
  ActivityIndicator,
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
} from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/FirebaseConfig';

type Shelter = {
  id: string;
  name: string;
  occupants: Array<{
    userId: string;
    status?: string;
    checkInTime?: string;
    checkOutTime?: string;
  }>;
  currentOccupancy?: number;
  [key: string]: any;
};

const AdminUsersScreen = () => {
  const { userProfile } = useAuth();
  const [shelter, setShelter] = useState<Shelter | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
            name: shelterData.name ?? '',
            occupants: shelterData.occupants ?? [],
            currentOccupancy: shelterData.currentOccupancy,
            ...shelterData,
        });

        // Buscar usuários hospedados no abrigo
        const occupants = shelterData.occupants || [];
        const userIds = occupants.map((occupant: { userId: any; }) => occupant.userId);

        if (userIds.length > 0) {
          const usersData = [];

          // Buscar dados completos de cada usuário
          for (const userId of userIds) {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();

              // Encontrar dados de check-in deste usuário
              const checkInData = occupants.find((o: { userId: any; }) => o.userId === userId);

              usersData.push({
                id: userId,
                name: userData.name ?? '',
                email: userData.email ?? '',
                phone: userData.phone ?? '',
                emergencyContact: userData.emergencyContact ?? '',
                checkInTime: checkInData?.checkInTime,
                status: checkInData?.status || 'checked-in',
                checkInHistory: userData.checkInHistory ?? [],
                ...userData,
              });
            }
          }

          setUsers(usersData);
        } else {
          setUsers([]);
        }
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

  const handleCheckOut = async (user: UserItem) => {
      Alert.alert(
        'Confirmar Check-out',
        `Deseja confirmar o check-out de ${user.name}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: async () => {
              try {
                // Atualizar status do usuário no abrigo
                if (!shelter) {
                  Alert.alert('Erro', 'Abrigo não encontrado.');
                  return;
                }
                const updatedOccupants = shelter.occupants.map(occupant => {
                  if (occupant.userId === user.id) {
                    return {
                      ...occupant,
                      status: 'checked-out',
                      checkOutTime: new Date().toISOString(),
                    };
                  }
                  return occupant;
                });
  
                // Atualizar documento do abrigo
                await updateDoc(doc(db, 'shelters', shelter.id), {
                  occupants: updatedOccupants,
                  currentOccupancy: (shelter.currentOccupancy || 0) - 1,
                  lastUpdated: new Date().toISOString(),
                });
  
                // Atualizar documento do usuário
                await updateDoc(doc(db, 'users', user.id), {
                  currentShelter: null,
                  checkInHistory: [...(user.checkInHistory || []), {
                    shelterId: shelter?.id ?? '',
                    shelterName: shelter?.name ?? '',
                    checkInTime: user.checkInTime,
                    checkOutTime: new Date().toISOString(),
                    status: 'checked-out',
                  }],
                });
  
                Alert.alert('Sucesso', 'Check-out realizado com sucesso!');
                loadData();
              } catch (error) {
                console.error('Erro ao realizar check-out:', error);
                Alert.alert('Erro', 'Falha ao realizar check-out. Tente novamente.');
              }
            },
          },
        ]
      );
    };

  const formatDateTime = (dateString: string | number | Date) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  type UserItem = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    emergencyContact?: string;
    checkInTime?: string;
    status?: string;
    checkInHistory?: any[];
    [key: string]: any;
  };

  const renderUserItem = ({ item }: { item: UserItem }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userAvatar}>
          <Icon name="account" size={24} color="#1a365d" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => handleCheckOut(item)}
        >
          <Icon name="logout" size={20} color="#e53e3e" />
        </TouchableOpacity>
      </View>

      <View style={styles.userDetails}>
        <View style={styles.detailItem}>
          <Icon name="phone" size={16} color="#4a5568" />
          <Text style={styles.detailText}>
            {item.phone || 'Telefone não informado'}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Icon name="clock" size={16} color="#4a5568" />
          <Text style={styles.detailText}>
            Check-in: {formatDateTime(item.checkInTime ?? '')}
          </Text>
        </View>

        {item.emergencyContact && (
          <View style={styles.detailItem}>
            <Icon name="alert" size={16} color="#4a5568" />
            <Text style={styles.detailText}>
              Contato de emergência: {item.emergencyContact}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="account-group" size={64} color="#a0aec0" />
      <Text style={styles.emptyText}>Nenhum usuário hospedado</Text>
      <Text style={styles.emptySubtext}>
        Não há usuários hospedados neste abrigo no momento
      </Text>
    </View>
  );

  if (!shelter) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noShelterContainer}>
          <Icon name="home-alert" size={64} color="#a0aec0" />
          <Text style={styles.noShelterText}>
            Nenhum abrigo encontrado para gerenciar usuários
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Usuários Hospedados</Text>
      </View>

      <View style={styles.shelterInfo}>
        <Text style={styles.shelterName}>{shelter.name}</Text>
        <Text style={styles.userCount}>
          {users.length} {users.length === 1 ? 'usuário' : 'usuários'} hospedados
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a365d" />
          <Text style={styles.loadingText}>Carregando usuários...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
  userCount: {
    fontSize: 14,
    color: '#4a5568',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a365d',
  },
  userEmail: {
    fontSize: 14,
    color: '#4a5568',
    marginTop: 2,
  },
  checkoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fed7d7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f7fafc',
    paddingTop: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4a5568',
    marginLeft: 8,
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
});

export default AdminUsersScreen;

