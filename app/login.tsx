import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { signInWithEmailAndPassword } from "@firebase/auth";
import { router } from "expo-router";
import { auth, db } from "@/FirebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

const DisasterShelterApp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { login, userProfile } = useAuth();

  const validateForm = () => {
    let isValid = true;
    const newErrors: { [key: string]: string } = {};

    // Validar email
    if (!email.trim()) {
      newErrors.email = "E-mail é obrigatório";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "E-mail inválido";
      isValid = false;
    }

    // Validar senha
    if (!password) {
      newErrors.password = "Senha é obrigatória";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "A senha deve ter pelo menos 6 caracteres";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const signIn = async () => {
    if (!validateForm()) {return;}

    setLoading(true);
    try {
      const result = await login(email, password);

      if (result.success) {
        if (userProfile.userType === 'admin') {
          router.replace('/(adminTabs)')
        } else {
          router.replace('/(userTabs)/(home)')
        }
      } else {
        // Tratar erros específicos do Firebase
        let errorMessage = 'Falha no login. Verifique suas credenciais.';

        if (result.error.includes('user-not-found')) {
          errorMessage = 'Usuário não encontrado. Verifique seu e-mail.';
        } else if (result.error.includes('wrong-password')) {
          errorMessage = 'Senha incorreta. Tente novamente.';
        } else if (result.error.includes('too-many-requests')) {
          errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
        }

        Alert.alert('Erro de Login', errorMessage);
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao fazer login. Tente novamente.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Bem-vindo de volta</Text>
            <Text style={styles.subtitle}>
              Entre com sua conta para acessar o ResilienceHub
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Seu e-mail"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Sua senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => {
                // Implementar recuperação de senha
                Alert.alert(
                  "Recuperação de Senha",
                  "Não deu tempo de fazer professor kkkk."
                );
              }}
            >
              <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={signIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem uma conta?</Text>
            <TouchableOpacity onPress={() => router.navigate("/register")}>
              <Text style={styles.registerText}>Criar conta</Text>
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
    backgroundColor: "#f7fafc",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#4a5568",
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2d3748",
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  inputError: {
    borderColor: "#e53e3e",
  },
  errorText: {
    color: "#e53e3e",
    fontSize: 14,
    marginTop: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#3182ce",
    fontSize: 14,
  },
  button: {
    height: 56,
    backgroundColor: "#1a365d",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#90cdf4",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
    marginBottom: 24,
  },
  footerText: {
    fontSize: 16,
    color: "#4a5568",
    marginRight: 4,
  },
  registerText: {
    fontSize: 16,
    color: "#3182ce",
    fontWeight: "600",
  },
});

export default DisasterShelterApp;
