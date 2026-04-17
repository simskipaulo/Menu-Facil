import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import axios from "axios";
import { API_URL } from "../../../constants/api";
import { authHeaders } from "../../../utils/auth";

interface MenuItem {
  id: number; name: string; price: string;
  category_id: number; is_available: boolean;
  tags: { id: number; name: string; color: string; text_color: string; emoji: string | null }[];
}

export default function MenuItemsScreen() {
  const qc = useQueryClient();
  const router = useRouter();

  const { data: items = [], isLoading, refetch, isFetching } = useQuery<MenuItem[]>({
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

  const confirmRemove = (item: MenuItem) =>
    Alert.alert("Remover prato", `Remover "${item.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => remove.mutate(item.id) },
    ]);

  if (isLoading) return <View style={styles.center}><ActivityIndicator color="#2563eb" /></View>;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/(admin)/menu-items/new")}>
        <Text style={styles.addBtnText}>+ Novo Prato</Text>
      </TouchableOpacity>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#2563eb" colors={["#2563eb"]} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>R$ {parseFloat(item.price).toFixed(2).replace(".", ",")}</Text>
              {!item.is_available && <Text style={styles.unavailable}>Indisponível</Text>}
              {item.tags.length > 0 && (
                <View style={styles.tags}>
                  {item.tags.map((t) => (
                    <View key={t.id} style={[styles.tag, { backgroundColor: t.color }]}>
                      <Text style={[styles.tagText, { color: t.text_color }]}>{t.emoji} {t.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => router.push(`/(admin)/menu-items/${item.id}`)}>
                <Text style={styles.editBtn}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmRemove(item)}>
                <Text style={styles.deleteBtn}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>Nenhum prato cadastrado</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eff6ff", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#eff6ff" },
  addBtn: {
    backgroundColor: "#2563eb", borderRadius: 14,
    padding: 14, alignItems: "center", marginBottom: 14,
    shadowColor: "#2563eb", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 8,
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#bfdbfe",
    shadowColor: "#2563eb", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  itemName: { fontWeight: "700", fontSize: 15, color: "#1e3a8a" },
  itemPrice: { color: "#2563eb", fontSize: 13, fontWeight: "600", marginTop: 2 },
  unavailable: { color: "#ef4444", fontSize: 11, marginTop: 2, fontWeight: "500" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  tag: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 11, fontWeight: "600" },
  actions: { gap: 10, alignItems: "flex-end" },
  editBtn: { color: "#2563eb", fontSize: 13, fontWeight: "600" },
  deleteBtn: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { color: "#93c5fd", fontSize: 14 },
});
