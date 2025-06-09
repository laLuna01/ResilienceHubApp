import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Platform,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  DocumentData,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/FirebaseConfig";
import { router } from "expo-router";
import CameraScanner from "@/components/CameraScanner";

const QRCheckInScreen = () => {
  const { user, userProfile } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  type CheckIn = {
    shelterName: string;
    checkInTime: string;
    [key: string]: any; // Add other properties as needed
  };
  const [checkInHistory, setCheckInHistory] = useState<CheckIn[]>([]);
  const [qrCode, setQrCode] = useState("");
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    loadCheckInHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCheckInHistory = async () => {
    try {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCheckInHistory(userData.checkInHistory || []);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar histórico de check-in:", error);
    }
  };

  const handleQRCodeRead = async (e: { data: any }) => {
    setScanning(false);
    setLoading(true);

    try {
      // Extrair ID do abrigo do QR code
      const qrData = e.data;
      let shelterId;

      // Verificar se é um JSON ou apenas o ID
      try {
        const parsed = JSON.parse(qrData);
        shelterId = parsed.shelterId || parsed.id;
      } catch {
        // Se não for JSON, assumir que é o ID direto
        shelterId = qrData;
      }

      if (!shelterId) {
        Alert.alert("Erro", "QR Code inválido. Tente novamente.");
        setLoading(false);
        return;
      }

      // Buscar informações do abrigo
      const shelterDoc = await getDoc(doc(db, "shelters", shelterId));

      if (!shelterDoc.exists()) {
        Alert.alert("Erro", "Abrigo não encontrado. Verifique o QR Code.");
        setLoading(false);
        return;
      }

      const shelterData = shelterDoc.data();

      // Verificar se o abrigo está ativo
      if (!shelterData.active) {
        Alert.alert("Aviso", "Este abrigo não está ativo no momento.");
        setLoading(false);
        return;
      }

      // Verificar capacidade
      const currentOccupancy = shelterData.currentOccupancy || 0;
      const capacity = shelterData.capacity || 0;

      if (currentOccupancy >= capacity) {
        Alert.alert(
          "Abrigo Lotado",
          `O abrigo ${shelterData.name} está com capacidade máxima. Procure outro abrigo próximo.`
        );
        setLoading(false);
        return;
      }

      // Realizar check-in
      await performCheckIn(shelterId, shelterData);
    } catch (error) {
      console.error("Erro ao processar QR Code:", error);
      Alert.alert("Erro", "Falha ao processar o check-in. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const performCheckIn = async (
    shelterId: string,
    shelterData: DocumentData
  ) => {
    try {
      const checkInData = {
        userId: user.uid,
        userName: userProfile?.name || "Usuário",
        userEmail: user.email,
        shelterId: shelterId,
        shelterName: shelterData.name,
        checkInTime: new Date().toISOString(),
        status: "checked-in",
      };

      // Adicionar usuário à lista de ocupantes do abrigo
      await updateDoc(doc(db, "shelters", shelterId), {
        occupants: arrayUnion(checkInData),
        currentOccupancy: (shelterData.currentOccupancy || 0) + 1,
        lastUpdated: new Date().toISOString(),
      });

      // Adicionar check-in ao histórico do usuário
      await updateDoc(doc(db, "users", user.uid), {
        checkInHistory: arrayUnion(checkInData),
        currentShelter: {
          shelterId: shelterId,
          shelterName: shelterData.name,
          checkInTime: checkInData.checkInTime,
        },
      });

      // Atualizar histórico local
      setCheckInHistory((prev) => [checkInData, ...prev]);

      Alert.alert(
        "Check-in Realizado!",
        `Você fez check-in no abrigo ${shelterData.name} com sucesso.`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Erro ao realizar check-in:", error);
      Alert.alert("Erro", "Falha ao realizar check-in. Tente novamente.");
    }
  };

  const handleManualCheckIn = () => {
    setManualModalVisible(true);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      Alert.alert("Erro", "Por favor, digite o código do abrigo");
      return;
    }
    setManualModalVisible(false);
    handleQRCodeRead({ data: manualCode });
    setManualCode("");
  };

  const formatDateTime = (dateString: string | number | Date) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-left" size={24} color="#1a365d" />
        </TouchableOpacity>
        <Text style={styles.title}>Check-in no Abrigo</Text>
        <View style={styles.placeholder} />
      </View>

      {!scanning ? (
        <View style={styles.content}>
          <View style={styles.instructionCard}>
            <Icon name="qrcode-scan" size={64} color="#1a365d" />
            <Text style={styles.instructionTitle}>
              Escaneie o QR Code do Abrigo
            </Text>
            <Text style={styles.instructionText}>
              Posicione a câmera sobre o QR Code do abrigo para fazer seu
              check-in automaticamente.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => setScanning(true)}
            >
              <Icon name="camera" size={24} color="#ffffff" />
              <Text style={styles.scanButtonText}>Escanear QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manualButton}
              onPress={handleManualCheckIn}
            >
              <Icon name="keyboard" size={24} color="#1a365d" />
              <Text style={styles.manualButtonText}>Inserir Código Manual</Text>
            </TouchableOpacity>
          </View>

          {/* Histórico de Check-ins */}
          {checkInHistory.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Histórico Recente</Text>
              {checkInHistory.slice(0, 3).map((checkIn, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyName}>
                      {checkIn.shelterName}
                    </Text>
                    <Text style={styles.historyTime}>
                      {formatDateTime(checkIn.checkInTime)}
                    </Text>
                  </View>
                  <Icon name="check-circle" size={20} color="#38a169" />
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <Modal animationType="slide">
          <View style={styles.scannerContainer}>
            <CameraScanner
              onScan={(data: any) => {
                handleQRCodeRead(data);
                setScanning(false);
              }}
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => setScanning(false)}
            >
              <Text style={styles.scanButtonText}>Fechar Câmera</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* Loading Modal */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a365d" />
            <Text style={styles.loadingText}>Processando check-in...</Text>
          </View>
        </View>
      </Modal>

      {/* Modal para Check-in Manual */}
      <Modal
        visible={manualModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setManualModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setManualModalVisible(false)}
            >
              <Icon name="close" size={24} color="#6b7280" />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <Icon name="keyboard" size={32} color="#1a365d" />
              <Text style={styles.modalTitle}>Check-in Manual</Text>
            </View>

            <Text style={styles.modalSubtitle}>
              Digite o código do abrigo conforme fornecido pela administração
            </Text>

            <View style={styles.inputContainer}>
              <Icon
                name="qrcode"
                size={24}
                color="#6b7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Código do abrigo"
                placeholderTextColor="#9ca3af"
                value={manualCode}
                onChangeText={setManualCode}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleManualSubmit}
              disabled={!manualCode.trim()}
            >
              <Text style={styles.modalButtonText}>Confirmar Check-in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7fafc",
    paddingVertical: 20
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f7fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a365d",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionCard: {
    backgroundColor: "#ffffff",
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 32,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a365d",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 16,
    color: "#4a5568",
    textAlign: "center",
    lineHeight: 24,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a365d",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  scanButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  manualButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#1a365d",
    padding: 16,
    borderRadius: 12,
  },
  manualButtonText: {
    color: "#1a365d",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  historySection: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f7fafc",
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2d3748",
  },
  historyTime: {
    fontSize: 14,
    color: "#4a5568",
    marginTop: 2,
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    height: "100%",
  },
  marker: {
    borderColor: "#1a365d",
    borderWidth: 2,
  },
  scannerText: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#e53e3e",
    padding: 16,
    borderRadius: 8,
    margin: 20,
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "#ffffff",
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#1a365d",
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "100%",
  },
  modalCloseButton: {
    alignSelf: "flex-end",
    padding: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a365d",
    marginLeft: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  modalInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#1f2937",
  },
  modalButton: {
    backgroundColor: "#1a365d",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonDisabled: {
    backgroundColor: "#e5e7eb",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default QRCheckInScreen;
