import { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "../../constants/api";
import { authHeaders } from "../../utils/auth";

interface AuthUser { id: number; tenant_id: number | null; }
interface QRData { qr_base64: string; menu_url: string; }

export default function QRCodeScreen() {
  const [baseUrl, setBaseUrl] = useState("https://menufacil.vercel.app");
  const [generate, setGenerate] = useState(false);

  const { data: user } = useQuery<AuthUser>({
    queryKey: ["mobile-me"],
    queryFn: async () => {
      const headers = await authHeaders();
      return axios.get(`${API_URL}/auth/me`, { headers }).then((r) => r.data);
    },
  });

  const { data: qrData, isFetching } = useQuery<QRData>({
    queryKey: ["mobile-qr", user?.tenant_id, baseUrl, generate],
    queryFn: async () => {
      const headers = await authHeaders();
      return axios
        .get(
          `${API_URL}/tenants/${user!.tenant_id}/qrcode?base_url=${encodeURIComponent(baseUrl)}`,
          { headers }
        )
        .then((r) => r.data);
    },
    enabled: !!user?.tenant_id && generate,
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>QR Code do Cardápio</Text>
      <Text style={styles.hint}>
        Clientes escaneiam este QR code para ver o cardápio no navegador.
      </Text>

      <Text style={styles.label}>URL base</Text>
      <TextInput
        style={styles.input}
        value={baseUrl}
        onChangeText={(v) => { setBaseUrl(v); setGenerate(false); }}
        placeholder="https://menufacil.vercel.app"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => setGenerate(true)}
      >
        <Text style={styles.buttonText}>Gerar QR Code</Text>
      </TouchableOpacity>

      {isFetching && <ActivityIndicator color="#2563eb" style={{ marginTop: 24 }} />}

      {qrData && !isFetching && (
        <View style={styles.qrContainer}>
          <Image
            source={{ uri: `data:image/png;base64,${qrData.qr_base64}` }}
            style={styles.qrImage}
          />
          <Text style={styles.url}>{qrData.menu_url}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#f9fafb",
    flexGrow: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 6,
    textAlign: "center",
  },
  hint: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    padding: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  qrContainer: { alignItems: "center", gap: 12 },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  url: { color: "#64748b", fontSize: 12, textAlign: "center" },
});
