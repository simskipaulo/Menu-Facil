import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, Switch,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "../../../constants/api";
import { authHeaders } from "../../../utils/auth";

interface Category { id: number; name: string; emoji: string | null; }
interface MenuItem {
  id: number; name: string; description: string | null;
  price: string; category_id: number; is_available: boolean;
  tags: any[];
}

export default function MenuItemFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const router = useRouter();
  const navigation = useNavigation();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: isNew ? "Novo Prato" : "Editar Prato",
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 4, padding: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [isNew]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["mobile-categories"],
    queryFn: async () => {
      const headers = await authHeaders();
      return axios.get(`${API_URL}/categories/`, { headers }).then((r) => r.data);
    },
  });

  const { data: allItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["mobile-items"],
    queryFn: async () => {
      const headers = await authHeaders();
      return axios.get(`${API_URL}/menu-items/`, { headers }).then((r) => r.data);
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (!isNew) {
      const existing = allItems.find((i) => i.id === Number(id));
      if (existing) {
        setName(existing.name);
        setDescription(existing.description ?? "");
        setPrice(existing.price);
        setCategoryId(existing.category_id);
        setIsAvailable(existing.is_available);
      }
    }
  }, [allItems, id, isNew]);

  const save = useMutation({
    mutationFn: async () => {
      const headers = await authHeaders();
      const payload = {
        name,
        description: description || null,
        price: price.replace(",", "."),
        category_id: categoryId,
        tag_ids: [],
        is_available: isAvailable,
      };
      return isNew
        ? axios.post(`${API_URL}/menu-items/`, payload, { headers })
        : axios.patch(`${API_URL}/menu-items/${id}`, payload, { headers });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mobile-items"] });
      router.back();
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : "Verifique os campos e tente novamente.";
      Alert.alert("Erro ao salvar", msg);
    },
  });

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Nome *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nome do prato" placeholderTextColor="#93c5fd" />

      <Text style={styles.label}>Descrição</Text>
      <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription}
        multiline numberOfLines={3} placeholder="Descrição (opcional)" placeholderTextColor="#93c5fd" />

      <Text style={styles.label}>Preço (R$) *</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice}
        keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#93c5fd" />

      <Text style={styles.label}>Categoria *</Text>
      <View style={styles.chipsRow}>
        {categories.map((c) => (
          <TouchableOpacity key={c.id} onPress={() => setCategoryId(c.id)}
            style={[styles.chip, categoryId === c.id && styles.chipSelected]}>
            <Text style={[styles.chipText, categoryId === c.id && styles.chipTextSelected]}>
              {c.emoji} {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Disponível</Text>
        <Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ true: "#2563eb" }} thumbColor="#fff" />
      </View>

      <TouchableOpacity
        style={[styles.button, (!name || !price || !categoryId) && styles.buttonDisabled]}
        onPress={() => save.mutate()}
        disabled={!name || !price || !categoryId || save.isPending}
      >
        <Text style={styles.buttonText}>{isNew ? "Adicionar Prato" : "Salvar Alterações"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eff6ff", padding: 16 },
  label: { fontSize: 12, fontWeight: "700", color: "#3b82f6", marginTop: 16, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#bfdbfe",
    borderRadius: 12, padding: 13, fontSize: 15, color: "#1e3a8a",
  },
  multiline: { height: 90, textAlignVertical: "top" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1.5, borderColor: "#bfdbfe", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: "#fff",
  },
  chipSelected: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipText: { fontSize: 13, color: "#1e3a8a", fontWeight: "500" },
  chipTextSelected: { color: "#fff", fontWeight: "700" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  button: {
    backgroundColor: "#2563eb", borderRadius: 14, padding: 16,
    alignItems: "center", marginTop: 28, marginBottom: 48,
    shadowColor: "#2563eb", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
