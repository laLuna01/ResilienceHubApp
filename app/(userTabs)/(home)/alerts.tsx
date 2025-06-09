import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/FirebaseConfig';

type AlertType = {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  active: boolean;
  location?: string;
  createdAt: number | string | Date;
};

const AlertsScreen = () => {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive'

  useEffect(() => {
    loadAlerts();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAlerts = async () => {
    try {
      setLoading(true);

      let alertsQuery;

      if (filter === 'all') {
        alertsQuery = query(
          collection(db, 'alerts'),
          orderBy('createdAt', 'desc')
        );
      } else {
        const isActive = filter === 'active';
        alertsQuery = query(
          collection(db, 'alerts'),
          where('active', '==', isActive),
          orderBy('createdAt', 'desc')
        );
      }

      const alertsSnapshot = await getDocs(alertsQuery);
      const alertsData = alertsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title ?? '',
          description: data.description ?? '',
          type: data.type ?? '',
          severity: data.severity ?? '',
          active: data.active ?? false,
          location: data.location ?? '',
          createdAt: data.createdAt ?? Date.now(),
        } as AlertType;
      });

      setAlerts(alertsData);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      Alert.alert('Erro', 'Falha ao carregar alertas. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const getAlertIcon = (type: any) => {
    switch (type) {
      case 'flood': return 'weather-flood';
      case 'fire': return 'fire';
      case 'earthquake': return 'earth';
      case 'storm': return 'weather-lightning';
      case 'landslide': return 'landslide';
      case 'chemical': return 'flask';
      case 'biological': return 'biohazard';
      default: return 'alert';
    }
  };

  const getAlertColor = (severity: any) => {
    switch (severity) {
      case 'high': return '#e53e3e';
      case 'medium': return '#dd6b20';
      case 'low': return '#38a169';
      default: return '#3182ce';
    }
  };

  const getAlertTypeText = (type: any) => {
    switch (type) {
      case 'flood': return 'Inundação';
      case 'fire': return 'Incêndio';
      case 'earthquake': return 'Terremoto';
      case 'storm': return 'Tempestade';
      case 'landslide': return 'Deslizamento';
      case 'chemical': return 'Químico';
      case 'biological': return 'Biológico';
      default: return 'Alerta';
    }
  };

  const getSeverityText = (severity: any) => {
    switch (severity) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return 'Desconhecida';
    }
  };

  const renderAlertItem = ({ item }: { item: AlertType }) => (
    <TouchableOpacity
      style={[
        styles.alertCard,
        { borderLeftColor: getAlertColor(item.severity) },
      ]}
      onPress={() => {
        // Navegar para detalhes do alerta (a ser implementado)
        Alert.alert(
          item.title,
          item.description,
          [{ text: 'OK' }]
        );
      }}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertIconContainer}>
          <Icon
            name={getAlertIcon(item.type)}
            size={24}
            color={getAlertColor(item.severity)}
          />
        </View>
        <View style={styles.alertInfo}>
          <Text style={styles.alertTitle}>{item.title}</Text>
          <View style={styles.alertMeta}>
            <Text style={styles.alertType}>
              {getAlertTypeText(item.type)}
            </Text>
            <Text style={styles.alertDot}>•</Text>
            <Text style={styles.alertSeverity}>
              Severidade: {getSeverityText(item.severity)}
            </Text>
          </View>
        </View>
        <View style={styles.alertStatus}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: item.active ? '#38a169' : '#a0aec0' },
            ]}
          />
          <Text style={styles.statusText}>
            {item.active ? 'Ativo' : 'Inativo'}
          </Text>
        </View>
      </View>

      <Text style={styles.alertDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.alertFooter}>
        <Text style={styles.alertLocation}>
          <Icon name="map-marker" size={14} color="#4a5568" /> {item.location || 'Localização não especificada'}
        </Text>
        <Text style={styles.alertTime}>
          {new Date(item.createdAt).toLocaleString('pt-BR')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bell-off" size={64} color="#a0aec0" />
      <Text style={styles.emptyText}>
        Nenhum alerta encontrado
      </Text>
      <Text style={styles.emptySubtext}>
        {filter === 'all'
          ? 'Não há alertas registrados no sistema.'
          : filter === 'active'
          ? 'Não há alertas ativos no momento.'
          : 'Não há alertas inativos para exibir.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alertas</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'active' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('active')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'active' && styles.filterTextActive,
            ]}
          >
            Ativos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'inactive' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('inactive')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'inactive' && styles.filterTextActive,
            ]}
          >
            Inativos
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a365d" />
          <Text style={styles.loadingText}>Carregando alertas...</Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlertItem}
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
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: '#ebf8ff',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a5568',
  },
  filterTextActive: {
    color: '#3182ce',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a365d',
    marginBottom: 4,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertType: {
    fontSize: 12,
    color: '#4a5568',
  },
  alertDot: {
    fontSize: 12,
    color: '#a0aec0',
    marginHorizontal: 4,
  },
  alertSeverity: {
    fontSize: 12,
    color: '#4a5568',
  },
  alertStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#4a5568',
  },
  alertDescription: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 12,
    lineHeight: 20,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertLocation: {
    fontSize: 12,
    color: '#4a5568',
  },
  alertTime: {
    fontSize: 12,
    color: '#718096',
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
});

export default AlertsScreen;