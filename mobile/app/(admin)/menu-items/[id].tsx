import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert, Switch, Image, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { API_URL } from "../../../constants/api";
import { authHeaders } from "../../../utils/auth";

interface Category { id: number; name: string; emoji: string | null; }
interface MenuItem {
  id: number; name: string; description: string | null;
  price: string; category_id: number; is_available: boolean; image_url: string | null;
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isNew) {
        setName("");
        setDescription("");
        setPrice("");
        setCategoryId(null);
        setIsAvailable(true);
        setImageUrl(null);
      }
    }, [isNew])
  );

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Permita acesso à galeria para selecionar imagens.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const headers = await authHeaders();
      const form = new FormData();
      form.append("file", {
        uri: asset.uri,
        name: asset.fileName ?? "photo.jpg",
        type: asset.mimeType ?? "image/jpeg",
      } as any);
      const res = await axios.post(`${API_URL}/upload/image`, form, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      setImageUrl(res.data.url);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      Alert.alert("Erro no upload", typeof detail === "string" ? detail : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handlePrice = (text: string) => {
    const normalized = text.replace(",", ".");
    if (/^\d*\.?\d{0,2}$/.test(normalized)) {
      setPrice(text);
    }
  };

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
        setImageUrl(existing.image_url ?? null);
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
        image_url: imageUrl || null,
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
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Informações básicas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações básicas</Text>
        <Text style={styles.label}>Nome *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nome do prato" placeholderTextColor="#94a3b8" />
        <Text style={styles.label}>Descrição</Text>
        <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription}
          multiline numberOfLines={3} placeholder="Descrição (opcional)" placeholderTextColor="#94a3b8" />
      </View>

      {/* Preço e categoria */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preço e categoria</Text>
        <Text style={styles.label}>Preço (R$) *</Text>
        <TextInput style={styles.input} value={price} onChangeText={handlePrice}
          keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor="#94a3b8" />
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
      </View>

      {/* Imagem */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Imagem</Text>
        {imageUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.imagePreview} resizeMode="cover" />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUrl(null)}>
              <Ionicons name="close-circle" size={22} color="#ef4444" />
              <Text style={styles.removeImageText}>Remover</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color="#2563eb" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={24} color="#3b82f6" />
                <Text style={styles.imagePickerText}>Selecionar imagem</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Disponibilidade */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disponibilidade</Text>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Disponível no cardápio</Text>
            <Text style={styles.switchSubLabel}>{isAvailable ? "Visível para clientes" : "Oculto do cardápio"}</Text>
          </View>
          <Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ false: "#e2e8f0", true: "#2563eb" }} thumbColor="#fff" />
        </View>
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
  container: { flex: 1, backgroundColor: "#f8fafc" },
  section: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 16,
    borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "600", color: "#475569", marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0",
    borderRadius: 12, padding: 13, fontSize: 15, color: "#1e293b",
  },
  multiline: { height: 90, textAlignVertical: "top" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: "#f8fafc",
  },
  chipSelected: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipText: { fontSize: 13, color: "#475569", fontWeight: "500" },
  chipTextSelected: { color: "#fff", fontWeight: "700" },
  imageContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  imagePreview: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  removeImageBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  removeImageText: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
  imagePicker: {
    borderWidth: 1.5, borderColor: "#e2e8f0", borderStyle: "dashed",
    borderRadius: 12, paddingVertical: 20, alignItems: "center", gap: 8,
    backgroundColor: "#f8fafc",
  },
  imagePickerText: { color: "#3b82f6", fontSize: 13, fontWeight: "600" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  switchLabel: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  switchSubLabel: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  button: {
    backgroundColor: "#2563eb", borderRadius: 14, padding: 16,
    alignItems: "center", marginTop: 20, marginHorizontal: 16,
    shadowColor: "#2563eb", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
