import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: { borderTopColor: "#e2e8f0" },
        headerShown: true,
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#1e293b",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="menu-items/index"
        options={{ title: "Cardápio", tabBarLabel: "Cardápio" }}
      />
      <Tabs.Screen
        name="categories/index"
        options={{ title: "Categorias", tabBarLabel: "Categorias" }}
      />
      <Tabs.Screen
        name="qrcode"
        options={{ title: "QR Code", tabBarLabel: "QR Code" }}
      />
    </Tabs>
  );
}
