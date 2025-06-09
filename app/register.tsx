import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/FirebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'user',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  type Errors = {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
  };
  const [errors, setErrors] = useState<Errors>({});

  const { register } = useAuth();

  const validateForm = () => {
    let isValid = true;
    const newErrors: Errors = {};

    // Validar nome
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
      isValid = false;
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
      isValid = false;
    }

    // Validar senha
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
      isValid = false;
    }

    // Validar confirmação de senha
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
      isValid = false;
    }

    // Validar telefone (opcional, mas se preenchido deve ser válido)
    if (formData.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Formato de telefone inválido. Use (XX) XXXXX-XXXX';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const signUp = async () => {
    if (!validateForm()) {return;}

    setLoading(true);
    try {
      const result = await register(formData.email, formData.password, {
        name: formData.name,
        userType: formData.userType,
        phone: formData.phone,
      });

      if (result.success) {
        if (formData.userType === 'admin') {
          router.replace('/(adminTabs)')
        } else {
          router.replace('/(userTabs)/(home)')
        }
      } else {
        // Tratar erros específicos do Firebase
        let errorMessage = 'Falha ao criar conta. Tente novamente.';

        if (result.error.includes('email-already-in-use')) {
          errorMessage = 'Este e-mail já está em uso. Tente fazer login ou use outro e-mail.';
        } else if (result.error.includes('weak-password')) {
          errorMessage = 'A senha é muito fraca. Use uma senha mais forte.';
        } else if (result.error.includes('invalid-email')) {
          errorMessage = 'E-mail inválido. Verifique o formato do e-mail.';
        }

        Alert.alert('Erro ao Criar Conta', errorMessage);
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao criar a conta. Tente novamente.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPhone = (text: string) => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');

    // Aplica a máscara (XX) XXXXX-XXXX
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>
              Junte-se ao ResilienceHub e mantenha-se seguro
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Seu nome completo"
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
                autoCapitalize="words"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Seu e-mail"
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefone (Opcional)</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="(XX) XXXXX-XXXX"
                value={formData.phone}
                onChangeText={(text) => updateFormData('phone', formatPhone(text))}
                keyboardType="phone-pad"
                maxLength={15}
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tipo de Usuário</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.userType}
                  onValueChange={(value) => updateFormData('userType', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Usuário Comum" value="user" />
                  <Picker.Item label="Administrador de Abrigo" value="admin" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Sua senha"
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                secureTextEntry
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="Confirme sua senha"
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                secureTextEntry
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={signUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Criar Conta</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta?</Text>
            <TouchableOpacity onPress={() => router.navigate('/login')}>
              <Text style={styles.loginText}>Fazer login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4a5568',
  },
  form: {
    marginBottom: 24,
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
    height: 56,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  picker: {
    height: 56,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    height: 56,
    backgroundColor: '#1a365d',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#90cdf4',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  footerText: {
    fontSize: 16,
    color: '#4a5568',
    marginRight: 4,
  },
  loginText: {
    fontSize: 16,
    color: '#3182ce',
    fontWeight: '600',
  },
});

export default RegisterScreen;

