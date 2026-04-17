import { useState } from "react";
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Alert, Modal, RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { API_URL } from "../../../constants/api";
import { authHeaders } from "../../../utils/auth";

interface Category { id: number; name: string; emoji: string | null; order: number; }

const EMOJIS = [
  "🍕","🍔","🌮","🍣","🍜","🍗","🥩","🥗","🍰","🍩",
  "🥤","🍺","☕","🧃","🍷","🍹","🥪","🌯","🍱","🍛",
  "🦐","🐟","🥚","🧆","🥞","🫕","🍲","🥘","🫔","🧁",
];

export default function CategoriesScreen() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const { data: categories = [], refetch, isFetching } = useQuery<Category[]>({
    queryKey: ["mobile-categories"],
    queryFn: async () => {
      const headers = await authHeaders();
      return axios.get(`${API_URL}/categories/`, { headers }).then((r) => r.data);
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const headers = await authHeaders();
      return axios.post(`${API_URL}/categories/`, { name, emoji: emoji || null, order: categories.length }, { headers });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mobile-categories"] }); setName(""); setEmoji(""); },
    onError: () => Alert.alert("Erro", "Não foi possível criar a categoria."),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const headers = await authHeaders();
      return axios.delete(`${API_URL}/categories/${id}`, { headers });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mobile-categories"] }),
    onError: () => Alert.alert("Erro", "Não foi possível remover a categoria."),
  });

  return (
    <View style={styles.container}>
      {/* Create form card */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Nova Categoria</Text>
        <View style={styles.form}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Nome da categoria"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
          />
          <TouchableOpacity style={styles.emojiBtn} onPress={() => setShowPicker(true)}>
            <Text style={styles.emojiBtnText}>{emoji || "😀"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addBtn, !name && styles.addBtnDisabled]}
            onPress={() => create.mutate()}
            disabled={!name}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#2563eb" colors={["#2563eb"]} />}
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <View style={styles.orderBadge}>
              <Text style={styles.orderText}>{index + 1}</Text>
            </View>
            <View style={styles.emojiTile}>
              <Text style={{ fontSize: 20 }}>{item.emoji || "📂"}</Text>
            </View>
            <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
            <TouchableOpacity
              style={styles.trashBtn}
              onPress={() =>
                Alert.alert("Remover", `Remover "${item.name}"?`, [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Remover", style: "destructive", onPress: () => remove.mutate(item.id) },
                ])
              }
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Text style={{ fontSize: 32 }}>📂</Text>
            </View>
            <Text style={styles.emptyTitle}>Nenhuma categoria</Text>
            <Text style={styles.emptySubtitle}>Crie categorias para organizar o cardápio</Text>
          </View>
        }
      />

      <Modal visible={showPicker} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.pickerTitle}>Escolha um emoji</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiOption, emoji === e && styles.emojiOptionSelected]}
                  onPress={() => { setEmoji(e); setShowPicker(false); }}
                >
                  <Text style={styles.emojiOptionText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.clearBtn} onPress={() => { setEmoji(""); setShowPicker(false); }}>
              <Text style={styles.clearBtnText}>Sem emoji</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },

  formCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  formTitle: { fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  form: { flexDirection: "row", gap: 8 },
  input: {
    backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0",
    borderRadius: 12, padding: 12, fontSize: 14, color: "#1e293b",
  },
  emojiBtn: {
    backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0",
    borderRadius: 12, width: 48, alignItems: "center", justifyContent: "center",
  },
  emojiBtnText: { fontSize: 22 },
  addBtn: { backgroundColor: "#2563eb", borderRadius: 12, width: 46, alignItems: "center", justifyContent: "center" },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { color: "#fff", fontSize: 24, fontWeight: "300" },

  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 8,
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  orderBadge: { width: 24, height: 24, borderRadius: 8, backgroundColor: "#eff6ff", alignItems: "center", justifyContent: "center" },
  orderText: { fontSize: 11, fontWeight: "700", color: "#3b82f6" },
  emojiTile: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#eff6ff", alignItems: "center", justifyContent: "center" },
  categoryName: { flex: 1, fontWeight: "600", fontSize: 16, color: "#1e293b" },
  trashBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center" },

  empty: { alignItems: "center", paddingTop: 60 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 20, backgroundColor: "#eff6ff", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  emptySubtitle: { fontSize: 13, color: "#94a3b8", marginTop: 4, textAlign: "center" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  pickerSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 16 },
  pickerTitle: { fontSize: 15, fontWeight: "700", color: "#1e293b", textAlign: "center", marginBottom: 16 },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  emojiOption: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#f1f5f9" },
  emojiOptionSelected: { backgroundColor: "#dbeafe", borderWidth: 2, borderColor: "#2563eb" },
  emojiOptionText: { fontSize: 26 },
  clearBtn: { marginTop: 16, alignItems: "center", padding: 10 },
  clearBtnText: { color: "#94a3b8", fontSize: 14 },
});
