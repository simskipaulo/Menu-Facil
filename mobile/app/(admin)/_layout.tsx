import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, Alert } from "react-native";
import { useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { API_URL } from "../../constants/api";

function useAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    SecureStore.getItemAsync("token").then(async (t) => {
      if (!t) { router.replace("/(auth)/login"); return; }
      try {
        await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${t}` },
          timeout: 6000,
        });
      } catch {
        await SecureStore.deleteItemAsync("token");
        router.replace("/(auth)/login");
      }
    });
  }, []);
}

function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja encerrar a sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("token");
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
      <Ionicons name="log-out-outline" size={22} color="#93c5fd" />
    </TouchableOpacity>
  );
}

export default function AdminLayout() {
  useAuthGuard();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#60a5fa",
        tabBarInactiveTintColor: "#6b8ab8",
        tabBarStyle: { backgroundColor: "#1e3a8a", borderTopColor: "#1d4ed8", borderTopWidth: 1 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerShown: true,
        headerStyle: { backgroundColor: "#1e3a8a" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700", color: "#fff" },
        headerRight: () => <LogoutButton />,
      }}
    >
      <Tabs.Screen
        name="menu-items/index"
        options={{
          title: "Cardápio",
          tabBarLabel: "Cardápio",
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="categories/index"
        options={{
          title: "Categorias",
          tabBarLabel: "Categorias",
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="qrcode"
        options={{
          title: "QR Code",
          tabBarLabel: "QR Code",
          tabBarIcon: ({ color, size }) => <Ionicons name="qr-code-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="menu-items/[id]" options={{ href: null }} />
    </Tabs>
  );
}
