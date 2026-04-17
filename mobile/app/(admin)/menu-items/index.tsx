import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import axios from "axios";
import { API_URL } from "../../../constants/api";
import { authHeaders } from "../../../utils/auth";

interface MenuItem {
  id: number;
  name: string;
  price: string;
  category_id: number;
  is_available: boolean;
  tags: { id: number; name: string; color: string; text_color: string; emoji: string | null }[];
}

export default function MenuItemsScreen() {
  const qc = useQueryClient();
  const router = useRouter();

  const { data: items = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["mobile-items"],
    queryFn: async () => {
      const headers = await authHeaders();
      return axios.get(`${API_URL}/menu-items/`, { headers }).then((r) => r.data);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const headers = await authHeaders();
      return axios.delete(`${API_URL}/menu-items/${id}`, { headers });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mobile-items"] }),
  });

  const confirmRemove = (item: MenuItem) => {
    Alert.alert("Remover prato", `Remover "${item.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: () => remove.mutate(item.id),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => router.push("/(admin)/menu-items/new")}
      >
        <Text style={styles.addBtnText}>+ Novo Prato</Text>
      </TouchableOpacity>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>
                R$ {parseFloat(item.price).toFixed(2).replace(".", ",")}
              </Text>
              {!item.is_available && (
                <Text style={styles.unavailable}>Indisponível</Text>
              )}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => router.push(`/(admin)/menu-items/${item.id}`)}
              >
                <Text style={styles.editBtn}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmRemove(item)}>
                <Text style={styles.deleteBtn}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum prato cadastrado.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  addBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  itemName: { fontWeight: "600", fontSize: 15, color: "#1e293b" },
  itemPrice: { color: "#2563eb", fontSize: 13, marginTop: 2 },
  unavailable: { color: "#ef4444", fontSize: 11, marginTop: 2 },
  actions: { gap: 10 },
  editBtn: { color: "#2563eb", fontSize: 13, fontWeight: "500" },
  deleteBtn: { color: "#ef4444", fontSize: 13, fontWeight: "500" },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 40, fontSize: 14 },
});
