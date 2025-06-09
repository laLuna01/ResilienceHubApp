import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/FirebaseConfig';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

type AlertType = {
  id: string;
  title?: string;
  description?: string;
  type?: string;
  severity?: string;
  createdAt?: string | number | Date;
  [key: string]: any;
};

const HomeScreen = () => {
  const { userProfile } = useAuth();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  type ShelterType = {
    id: string;
    name?: string;
    address?: string;
    capacity?: number;
    currentOccupancy?: number;
    [key: string]: any;
  };
  
  const [nearestShelter, setNearestShelter] = useState<ShelterType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadActiveAlerts(),
        loadNearestShelter(),
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveAlerts = async () => {
    try {
      const alertsQuery = query(
        collection(db, 'alerts'),
        where('active', '==', true),
        orderBy('createdAt', 'desc'),
        limit(3)
      );

      const alertsSnapshot = await getDocs(alertsQuery);
      const alertsData = alertsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAlerts(alertsData);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    }
  };

  const loadNearestShelter = async () => {
    try {
      // Por enquanto, vamos simular a busca do abrigo mais próximo
      // Em uma implementação real, isso usaria geolocalização
      const sheltersQuery = query(
        collection(db, 'shelters'),
        where('active', '==', true),
        limit(1)
      );

      const sheltersSnapshot = await getDocs(sheltersQuery);
      if (!sheltersSnapshot.empty) {
        const shelterData = sheltersSnapshot.docs[0].data();
        setNearestShelter({
          id: sheltersSnapshot.docs[0].id,
          ...shelterData,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar abrigo mais próximo:', error);
    }
  };

  const getAlertIcon = (type: string | undefined) => {
    switch (type) {
      case 'flood': return 'weather-flood';
      case 'fire': return 'fire';
      case 'earthquake': return 'earth';
      case 'storm': return 'weather-lightning';
      default: return 'alert';
    }
  };

  const getAlertColor = (severity: string | undefined) => {
    switch (severity) {
      case 'high': return '#e53e3e';
      case 'medium': return '#dd6b20';
      case 'low': return '#38a169';
      default: return '#3182ce';
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Chamada de Emergência',
      'Deseja ligar para os serviços de emergência?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ligar 190', onPress: () => console.log('Ligando para 190') },
        { text: 'Ligar 193', onPress: () => console.log('Ligando para 193') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {userProfile?.name || 'Usuário'}!</Text>
            <Text style={styles.subtitle}>Mantenha-se seguro e informado</Text>
          </View>
          <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyCall}>
            <Icon name="phone-alert" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Icon name="shield-check" size={24} color="#38a169" />
            <Text style={styles.statusTitle}>Status: Seguro</Text>
          </View>
          <Text style={styles.statusDescription}>
            Nenhum alerta ativo em sua região no momento
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.navigate('/(userTabs)/(home)/checkin')}
            >
              <Icon name="qrcode-scan" size={32} color="#1a365d" />
              <Text style={styles.actionText}>Check-in</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.navigate('/(userTabs)/(home)/alerts')}
            >
              <Icon name="bell" size={32} color="#1a365d" />
              <Text style={styles.actionText}>Alertas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Alert.alert(
                  'Localizar Abrigos',
                  'Tambem nao deu tempo de fazer kkkk'
                );
              }}
            >
              <Icon name="map-marker" size={32} color="#1a365d" />
              <Text style={styles.actionText}>Abrigos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alertas Ativos</Text>
            {alerts.map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <Icon
                    name={getAlertIcon(alert.type)}
                    size={24}
                    color={getAlertColor(alert.severity)}
                  />
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                </View>
                <Text style={styles.alertDescription}>{alert.description}</Text>
                <Text style={styles.alertTime}>
                  {new Date(alert.createdAt ?? 0).toLocaleString('pt-BR')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Nearest Shelter */}
        {nearestShelter && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Abrigo Mais Próximo</Text>
            <View style={styles.shelterCard}>
              <View style={styles.shelterHeader}>
                <Icon name="home-variant" size={24} color="#1a365d" />
                <Text style={styles.shelterName}>{nearestShelter.name}</Text>
              </View>
              <Text style={styles.shelterAddress}>{nearestShelter.address}</Text>
              <View style={styles.shelterInfo}>
                <Text style={styles.shelterCapacity}>
                  Capacidade: {nearestShelter.currentOccupancy || 0}/{nearestShelter.capacity || 0}
                </Text>
                <TouchableOpacity style={styles.directionsButton}>
                  <Text style={styles.directionsText}>Como chegar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dicas de Segurança</Text>
          <View style={styles.tipCard}>
            <Icon name="lightbulb" size={20} color="#dd6b20" />
            <Text style={styles.tipText}>
              Mantenha sempre um kit de emergência em casa com água, alimentos não perecíveis e medicamentos.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  subtitle: {
    fontSize: 14,
    color: '#4a5568',
    marginTop: 4,
  },
  emergencyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e53e3e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    margin: 20,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#38a169',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a365d',
    marginLeft: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#4a5568',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    minWidth: 80,
  },
  actionText: {
    fontSize: 12,
    color: '#1a365d',
    marginTop: 8,
    fontWeight: '500',
  },
  alertCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e53e3e',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a365d',
    marginLeft: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#718096',
  },
  shelterCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
  },
  shelterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shelterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a365d',
    marginLeft: 8,
  },
  shelterAddress: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 12,
  },
  shelterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shelterCapacity: {
    fontSize: 14,
    color: '#4a5568',
  },
  directionsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3182ce',
    borderRadius: 6,
  },
  directionsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#4a5568',
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default HomeScreen;

