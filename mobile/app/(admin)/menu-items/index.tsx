import { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, RefreshControl, Modal, Pressable,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { API_URL } from "../../../constants/api";
import { authHeaders } from "../../../utils/auth";

interface MenuItem {
  id: number; name: string; description: string | null; price: string;
  category_id: number; is_available: boolean; image_url: string | null;
  tags: { id: number; name: string; color: string; text_color: string; emoji: string | null }[];
}

type Filter = "available" | "unavailable" | null;

export default function MenuItemsScreen() {
  const qc = useQueryClient();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data: items = [], isLoading, refetch, isFetching } = useQuery<MenuItem[]>({
    queryKey: ["mobile-items"],
    queryFn: async () => {
      const headers = await authHeaders();
      return axios.get(`${API_URL}/menu-items/`, { headers }).then((r) => r.data);
    },
  });

  const available = items.filter((i) => i.is_available).length;
  const unavailable = items.length - available;
  const filtered = filter === null ? items
    : items.filter((i) => filter === "available" ? i.is_available : !i.is_available);

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

  const toggleFilter = (f: "available" | "unavailable") =>
    setFilter((prev) => prev === f ? null : f);

  if (isLoading) return <View style={styles.center}><ActivityIndicator color="#2563eb" size="large" /></View>;

  return (
    <View style={styles.container}>
      <Modal visible={!!lightbox} transparent animationType="fade" onRequestClose={() => setLightbox(null)}>
        <Pressable style={styles.lightboxOverlay} onPress={() => setLightbox(null)}>
          {lightbox && <Image source={{ uri: lightbox }} style={styles.lightboxImage} resizeMode="contain" />}
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightbox(null)}>
            <Text style={styles.lightboxCloseText}>✕</Text>
          </TouchableOpacity>
        </Pressable>
      </Modal>

      <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/(admin)/menu-items/new")}>
        <Text style={styles.addBtnText}>+ Novo Prato</Text>
      </TouchableOpacity>

      {/* Stats bar */}
      {items.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{items.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#16a34a" }]}>{available}</Text>
            <Text style={styles.statLabel}>Disponíveis</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#ef4444" }]}>{unavailable}</Text>
            <Text style={styles.statLabel}>Indisponíveis</Text>
          </View>
        </View>
      )}

      {/* Filter chips */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === "available" && styles.filterChipAvailable]}
          onPress={() => toggleFilter("available")}
        >
          <Text style={[styles.filterChipText, filter === "available" && styles.filterChipTextActive]}>
            Disponível
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === "unavailable" && styles.filterChipUnavailable]}
          onPress={() => toggleFilter("unavailable")}
        >
          <Text style={[styles.filterChipText, filter === "unavailable" && styles.filterChipTextActive]}>
            Indisponível
          </Text>
        </TouchableOpacity>
        {filter !== null && (
          <Text style={styles.filterCount}>{filtered.length} de {items.length}</Text>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#2563eb" colors={["#2563eb"]} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.image_url ? (
              <TouchableOpacity onPress={() => setLightbox(item.image_url!)}>
                <Image source={{ uri: item.image_url }} style={styles.thumbnail} />
              </TouchableOpacity>
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Text style={{ fontSize: 20 }}>🍽️</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>R$ {parseFloat(item.price).toFixed(2).replace(".", ",")}</Text>
              {item.description ? (
                <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
              ) : null}
              {!item.is_available && <Text style={styles.unavailable}>Indisponível</Text>}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push(`/(admin)/menu-items/${item.id}`)}>
                <Ionicons name="create-outline" size={18} color="#2563eb" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => confirmRemove(item)}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Text style={{ fontSize: 32 }}>{filter ? "🔍" : "🍽️"}</Text>
            </View>
            <Text style={styles.emptyTitle}>
              {filter === "available" ? "Nenhum disponível"
                : filter === "unavailable" ? "Nenhum indisponível"
                : "Cardápio vazio"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter ? "Tente outro filtro" : "Adicione o primeiro prato"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
  addBtn: {
    backgroundColor: "#2563eb", borderRadius: 14,
    padding: 14, alignItems: "center", marginBottom: 12,
    shadowColor: "#2563eb", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  statsBar: {
    flexDirection: "row", backgroundColor: "#fff",
    borderRadius: 16, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#2563eb", shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 22, fontWeight: "800", color: "#1e3a8a" },
  statLabel: { fontSize: 10, color: "#94a3b8", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: "#e2e8f0" },

  filterRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 14 },
  filterChip: {
    borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, backgroundColor: "#fff",
  },
  filterChipAvailable: { backgroundColor: "#22c55e", borderColor: "#22c55e" },
  filterChipUnavailable: { backgroundColor: "#f87171", borderColor: "#f87171" },
  filterChipText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  filterChipTextActive: { color: "#fff" },
  filterCount: { fontSize: 12, color: "#94a3b8", marginLeft: 4 },

  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 8,
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  itemName: { fontWeight: "700", fontSize: 15, color: "#1e293b" },
  itemPrice: { color: "#2563eb", fontSize: 13, fontWeight: "600", marginTop: 2 },
  itemDesc: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  unavailable: { color: "#ef4444", fontSize: 11, marginTop: 2, fontWeight: "500" },
  thumbnail: { width: 52, height: 52, borderRadius: 12, marginRight: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  thumbnailPlaceholder: { width: 52, height: 52, borderRadius: 12, marginRight: 12, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },

  lightboxOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" },
  lightboxImage: { width: "90%", height: "70%" },
  lightboxClose: { position: "absolute", top: 50, right: 20, backgroundColor: "#fff", width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  lightboxCloseText: { fontSize: 14, fontWeight: "700", color: "#333" },

  actions: { gap: 8, alignItems: "flex-end" },
  iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },

  empty: { alignItems: "center", paddingTop: 60 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 20, backgroundColor: "#eff6ff", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  emptySubtitle: { fontSize: 13, color: "#94a3b8", marginTop: 4 },
});
