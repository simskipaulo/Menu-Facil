import { useState } from "react";
import {
  View, Text, Image, TouchableOpacity, TextInput,
  StyleSheet, ScrollView, ActivityIndicator, Modal, RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "../../constants/api";
import { authHeaders } from "../../utils/auth";

interface AuthUser { id: number; tenant_id: number | null; }
interface QRData { qr_base64: string; menu_url: string; }

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalIcon}>⚠️</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.modalCancel} onPress={onCancel}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirm} onPress={onConfirm}>
              <Text style={styles.modalConfirmText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function QRCodeScreen() {
  const qc = useQueryClient();
  const [baseUrl, setBaseUrl] = useState("https://menufacil.vercel.app");
  const [confirm, setConfirm] = useState<"regenerate" | "delete" | null>(null);

  const { data: user } = useQuery<AuthUser>({
    queryKey: ["mobile-me"],
    queryFn: async () => {
      const headers = await authHeaders();
      return axios.get(`${API_URL}/auth/me`, { headers }).then((r) => r.data);
    },
  });

  const { data: qrData, isLoading, isError, refetch, isFetching } = useQuery<QRData>({
    queryKey: ["mobile-qr", user?.tenant_id],
    queryFn: async () => {
      const headers = await authHeaders();
      return axios.get(`${API_URL}/tenants/${user!.tenant_id}/qrcode`, { headers }).then((r) => r.data);
    },
    enabled: !!user?.tenant_id,
    retry: false,
  });

  const generate = useMutation({
    mutationFn: async () => {
      const headers = await authHeaders();
      return axios.post(`${API_URL}/tenants/${user!.tenant_id}/qrcode`, { base_url: baseUrl }, { headers });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mobile-qr", user?.tenant_id] }),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const headers = await authHeaders();
      return axios.delete(`${API_URL}/tenants/${user!.tenant_id}/qrcode`, { headers });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mobile-qr", user?.tenant_id] }),
  });

  const hasQR = !!qrData && !isError;

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#60a5fa" colors={["#2563eb"]} />}>
      {confirm === "regenerate" && (
        <ConfirmModal
          message="Tem certeza que deseja gerar um novo QR Code? O atual será substituído."
          onCancel={() => setConfirm(null)}
          onConfirm={() => { setConfirm(null); generate.mutate(); }}
        />
      )}
      {confirm === "delete" && (
        <ConfirmModal
          message="Tem certeza que deseja remover o QR Code? Os clientes não conseguirão mais escanear."
          onCancel={() => setConfirm(null)}
          onConfirm={() => { setConfirm(null); remove.mutate(); }}
        />
      )}

      <Text style={styles.title}>QR Code do Cardápio</Text>
      <Text style={styles.hint}>Clientes escaneiam para acessar o cardápio digital</Text>

      {isLoading && <ActivityIndicator color="#2563eb" style={{ marginTop: 40 }} />}

      {!isLoading && hasQR && (
        <View style={styles.qrCard}>
          <View style={styles.qrImageWrap}>
            <Image source={{ uri: `data:image/png;base64,${qrData.qr_base64}` }} style={styles.qrImage} />
          </View>
          <View style={styles.urlBox}>
            <Text style={styles.urlLabel}>Link do cardápio</Text>
            <Text style={styles.url}>{qrData.menu_url}</Text>
          </View>
          <View style={styles.qrActions}>
            <TouchableOpacity style={styles.regenBtn} onPress={() => setConfirm("regenerate")}>
              <Text style={styles.regenBtnText}>Regenerar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => setConfirm("delete")}>
              <Text style={styles.deleteBtnText}>Remover</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!isLoading && !hasQR && (
        <View style={styles.generateCard}>
          <Text style={styles.generateTitle}>Nenhum QR Code gerado</Text>
          <Text style={styles.generateHint}>Configure a URL base e gere o QR Code.</Text>
          <Text style={styles.label}>URL base</Text>
          <TextInput
            style={styles.input}
            value={baseUrl}
            onChangeText={setBaseUrl}
            placeholder="https://menufacil.vercel.app"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.generateBtn, (!baseUrl || generate.isPending) && styles.generateBtnDisabled]}
            onPress={() => generate.mutate()}
            disabled={!baseUrl || generate.isPending}
          >
            {generate.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.generateBtnText}>Gerar QR Code</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#1e3a8a", textAlign: "center", marginBottom: 4 },
  hint: { fontSize: 13, color: "#60a5fa", textAlign: "center", marginBottom: 24 },

  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 12,
  },
  qrImageWrap: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  qrImage: { width: 220, height: 220, borderRadius: 8 },
  urlBox: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
  },
  urlLabel: { fontSize: 10, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  url: { fontSize: 12, color: "#475569", fontFamily: "monospace" },
  qrActions: { flexDirection: "row", gap: 10, width: "100%" },
  regenBtn: {
    flex: 1, borderWidth: 1.5, borderColor: "#2563eb",
    borderRadius: 14, padding: 12, alignItems: "center",
  },
  regenBtnText: { color: "#2563eb", fontWeight: "600", fontSize: 14 },
  deleteBtn: {
    flex: 1, borderWidth: 1.5, borderColor: "#fca5a5",
    borderRadius: 14, padding: 12, alignItems: "center",
  },
  deleteBtnText: { color: "#ef4444", fontWeight: "600", fontSize: 14 },

  generateCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  generateTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 4 },
  generateHint: { fontSize: 13, color: "#94a3b8", marginBottom: 16 },
  label: { fontSize: 11, fontWeight: "700", color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 12,
  },
  generateBtn: {
    backgroundColor: "#2563eb", borderRadius: 14,
    padding: 14, alignItems: "center",
  },
  generateBtnDisabled: { opacity: 0.5 },
  generateBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center", alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff", borderRadius: 20,
    padding: 24, width: "82%", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
  },
  modalIcon: { fontSize: 36, marginBottom: 12 },
  modalMessage: { fontSize: 14, color: "#334155", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  modalBtns: { flexDirection: "row", gap: 10, width: "100%" },
  modalCancel: {
    flex: 1, borderWidth: 1, borderColor: "#e2e8f0",
    borderRadius: 12, padding: 12, alignItems: "center",
  },
  modalCancelText: { color: "#64748b", fontWeight: "600" },
  modalConfirm: {
    flex: 1, backgroundColor: "#ef4444",
    borderRadius: 12, padding: 12, alignItems: "center",
  },
  modalConfirmText: { color: "#fff", fontWeight: "700" },
});
