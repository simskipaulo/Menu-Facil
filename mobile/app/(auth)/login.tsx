import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/(admin)/menu-items");
    } catch (err: any) {
      const msg =
        err?.code === "ECONNABORTED" || err?.message?.includes("timeout")
          ? "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
          : err?.response?.status === 401
          ? "Email ou senha incorretos"
          : "Erro de conexão. Verifique o IP do servidor no .env";
      Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.logoArea}>
        <View style={styles.logoIcon}>
          <Image source={require("../../assets/icon.png")} style={styles.logoImg} resizeMode="cover" />
        </View>
        <Text style={styles.title}>Menu Fácil</Text>
        <Text style={styles.subtitle}>Painel de administração</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor="#93c5fd"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.label}>SENHA</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="••••••••"
            placeholderTextColor="#93c5fd"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
            <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="#60a5fa" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#1e3a8a",
  },
  logoArea: { alignItems: "center", marginBottom: 32 },
  logoIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.3)",
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  logoImg: { width: "100%", height: "100%", opacity: 0.9 },
  title: { fontSize: 32, fontWeight: "800", color: "#fff", letterSpacing: -0.8 },
  subtitle: { fontSize: 14, color: "#93c5fd", marginTop: 6 },

  card: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  label: {
    fontSize: 10, fontWeight: "700", color: "#93c5fd",
    letterSpacing: 1.8, marginBottom: 6,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 14, padding: 15, fontSize: 15,
    marginBottom: 16, color: "#fff",
  },
  passwordRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 14, marginBottom: 20,
  },
  passwordInput: { flex: 1, padding: 15, fontSize: 15, color: "#fff" },
  eyeBtn: { padding: 12 },
  button: {
    backgroundColor: "#fff", borderRadius: 14,
    padding: 16, alignItems: "center",
    shadowColor: "#fff",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#1e3a8a", fontWeight: "800", fontSize: 16 },
});
