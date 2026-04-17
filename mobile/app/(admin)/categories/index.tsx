import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "../../../constants/api";
import { authHeaders } from "../../../utils/auth";

interface Category { id: number; name: string; emoji: string | null; order: number; }

export default function CategoriesScreen() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");

  const { data: categories = [] } = useQuery<Category[]>({
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
        <TextInput
          style={[styles.input, styles.emojiInput]}
          placeholder="🍕"
          value={emoji}
          onChangeText={setEmoji}
        />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
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
  emojiInput: { width: 52, textAlign: "center" },
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
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  categoryName: { fontWeight: "500", fontSize: 15, color: "#1e293b" },
  removeBtn: { color: "#ef4444", fontSize: 13, fontWeight: "500" },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 40, fontSize: 14 },
});
