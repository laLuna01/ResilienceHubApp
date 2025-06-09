import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ProfileScreen = () => {
  const { user, userProfile, logout, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    address: userProfile?.address || '',
    emergencyContact: userProfile?.emergencyContact || '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateUserProfile(formData);

      if (result.success) {
        setIsEditing(false);
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      } else {
        Alert.alert('Erro', result.error || 'Falha ao atualizar perfil');
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar o perfil');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            const result = await logout();
            if (!result.success) {
              Alert.alert('Erro', 'Falha ao fazer logout');
              return
            }
            router.replace('/login')
          },
        },
      ]
    );
  };

  const formatPhone = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Meu Perfil</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Icon
              name={isEditing ? 'close' : 'pencil'}
              size={20}
              color="#1a365d"
            />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Icon name="account" size={48} color="#1a365d" />
            </View>
            <Text style={styles.userName}>{userProfile?.name || 'Usuário'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.userTypeBadge}>
              <Text style={styles.userTypeText}>
                {userProfile?.userType === 'admin' ? 'Administrador' : 'Usuário'}
              </Text>
            </View>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              editable={isEditing}
              placeholder="Seu nome completo"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user?.email}
              editable={false}
              placeholder="Seu e-mail"
            />
            <Text style={styles.helperText}>
              O e-mail não pode ser alterado
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={formData.phone}
              onChangeText={(text) => updateFormData('phone', formatPhone(text))}
              editable={isEditing}
              placeholder="(XX) XXXXX-XXXX"
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Endereço</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={formData.address}
              onChangeText={(text) => updateFormData('address', text)}
              editable={isEditing}
              placeholder="Seu endereço completo"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contato de Emergência</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={formData.emergencyContact}
              onChangeText={(text) => updateFormData('emergencyContact', text)}
              editable={isEditing}
              placeholder="Nome e telefone do contato de emergência"
              multiline
              numberOfLines={2}
            />
          </View>

          {isEditing && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsEditing(false);
                  setFormData({
                    name: userProfile?.name || '',
                    phone: userProfile?.phone || '',
                    address: userProfile?.address || '',
                    emergencyContact: userProfile?.emergencyContact || '',
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Configurações da Conta</Text>

          <TouchableOpacity style={styles.actionItem}>
            <Icon name="shield-key" size={24} color="#4a5568" />
            <Text style={styles.actionText}>Alterar Senha</Text>
            <Icon name="chevron-right" size={24} color="#a0aec0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Icon name="bell-outline" size={24} color="#4a5568" />
            <Text style={styles.actionText}>Notificações</Text>
            <Icon name="chevron-right" size={24} color="#a0aec0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Icon name="help-circle-outline" size={24} color="#4a5568" />
            <Text style={styles.actionText}>Ajuda e Suporte</Text>
            <Icon name="chevron-right" size={24} color="#a0aec0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Icon name="information-outline" size={24} color="#4a5568" />
            <Text style={styles.actionText}>Sobre o App</Text>
            <Icon name="chevron-right" size={24} color="#a0aec0" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={20} color="#e53e3e" />
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 8,
  },
  userTypeBadge: {
    backgroundColor: '#3182ce',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userTypeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  formSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  inputContainer: {
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
    backgroundColor: '#ffffff',
  },
  inputDisabled: {
    backgroundColor: '#f7fafc',
    color: '#a0aec0',
  },
  helperText: {
    fontSize: 12,
    color: '#a0aec0',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#4a5568',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#1a365d',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#90cdf4',
  },
  actionsSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#2d3748',
    marginLeft: 12,
  },
  logoutSection: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  logoutText: {
    color: '#e53e3e',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProfileScreen;

