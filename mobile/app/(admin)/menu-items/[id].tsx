import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "../../../constants/api";
import { authHeaders } from "../../../utils/auth";

interface Category { id: number; name: string; emoji: string | null; }
interface Tag { id: number; name: string; color: string; text_color: string; emoji: string | null; }
interface MenuItem {
  id: number; name: string; description: string | null;
  price: string; category_id: number; is_available: boolean;
  tags: Tag[];
}

export default function MenuItemFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const router = useRouter();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["mobile-categories"],
    queryFn: async () => {
      const headers = await authHeaders();
      return axios.get(`${API_URL}/categories/`, { headers }).then((r) => r.data);
    },
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["mobile-tags"],
    queryFn: async () => {
      const headers = await authHeaders();
      return axios.get(`${API_URL}/tags/`, { headers }).then((r) => r.data);
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
        setSelectedTagIds(existing.tags.map((t) => t.id));
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
        price,
        category_id: categoryId,
        tag_ids: selectedTagIds,
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
    onError: () => Alert.alert("Erro", "Não foi possível salvar o prato."),
  });

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((x) => x !== tagId) : [...prev, tagId]
    );
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Nome *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Nome do prato"
      />

      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        placeholder="Descrição (opcional)"
      />

      <Text style={styles.label}>Preço (R$) *</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />

      <Text style={styles.label}>Categoria *</Text>
      <View style={styles.chipsRow}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c.id}
            onPress={() => setCategoryId(c.id)}
            style={[styles.chip, categoryId === c.id && styles.chipSelected]}
          >
            <Text style={[styles.chipText, categoryId === c.id && styles.chipTextSelected]}>
              {c.emoji} {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tags.length > 0 && (
        <>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.chipsRow}>
            {tags.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => toggleTag(t.id)}
                style={[
                  styles.chip,
                  { backgroundColor: t.color, borderColor: t.color },
                  selectedTagIds.includes(t.id) && styles.chipTagSelected,
                ]}
              >
                <Text style={[styles.chipText, { color: t.text_color }]}>
                  {t.emoji} {t.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <View style={styles.switchRow}>
        <Text style={styles.label}>Disponível</Text>
        <Switch
          value={isAvailable}
          onValueChange={setIsAvailable}
          trackColor={{ true: "#2563eb" }}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (!name || !price || !categoryId) && styles.buttonDisabled,
        ]}
        onPress={() => save.mutate()}
        disabled={!name || !price || !categoryId}
      >
        <Text style={styles.buttonText}>
          {isNew ? "Adicionar Prato" : "Salvar Alterações"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#1e293b",
  },
  multiline: { height: 80, textAlignVertical: "top" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  chipSelected: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipTagSelected: { borderWidth: 2.5, borderColor: "#1d4ed8" },
  chipText: { fontSize: 13, color: "#374151" },
  chipTextSelected: { color: "#fff" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 28,
    marginBottom: 40,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
