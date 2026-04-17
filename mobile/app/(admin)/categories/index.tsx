import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
      return axios.post(
        `${API_URL}/categories/`,
        { name, emoji: emoji || null, order: categories.length },
        { headers }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mobile-categories"] });
      setName("");
      setEmoji("");
    },
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
      <View style={styles.form}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Nome da categoria"
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

      <FlatList
        data={categories}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#2563eb" colors={["#2563eb"]} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.categoryName}>
              {item.emoji} {item.name}
            </Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Remover", `Remover "${item.name}"?`, [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Remover",
                    style: "destructive",
                    onPress: () => remove.mutate(item.id),
                  },
                ])
              }
            >
              <Text style={styles.removeBtn}>Remover</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhuma categoria cadastrada.</Text>
        }
      />

      <Modal visible={showPicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.pickerSheet}>
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
  container: { flex: 1, backgroundColor: "#eff6ff", padding: 16 },
  form: { flexDirection: "row", gap: 8, marginBottom: 16 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#1e293b",
  },
  emojiBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBtnText: { fontSize: 22 },
  addBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    width: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { color: "#fff", fontSize: 24, fontWeight: "300" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    shadowColor: "#2563eb",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryName: { fontWeight: "600", fontSize: 15, color: "#1e3a8a" },
  removeBtn: { color: "#ef4444", fontSize: 13, fontWeight: "500" },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 40, fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 16,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  emojiOption: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  emojiOptionSelected: {
    backgroundColor: "#dbeafe",
    borderWidth: 2,
    borderColor: "#2563eb",
  },
  emojiOptionText: { fontSize: 26 },
  clearBtn: {
    marginTop: 16,
    alignItems: "center",
    padding: 10,
  },
  clearBtnText: { color: "#94a3b8", fontSize: 14 },
});
