import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { User } from "../../types/api";
import AdminLayout from "../../components/layouts/AdminLayout";

interface QRData { qr_base64: string; menu_url: string; }

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-3">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-600 transition-colors">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QRCodePage() {
  const qc = useQueryClient();
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [confirm, setConfirm] = useState<"regenerate" | "delete" | null>(null);

  const { data: user } = useQuery<User>({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me").then((r) => r.data),
  });

  const { data: qrData, isLoading, isError } = useQuery<QRData>({
    queryKey: ["qrcode", user?.tenant_id],
    queryFn: () => api.get(`/tenants/${user!.tenant_id}/qrcode`).then((r) => r.data),
    enabled: !!user?.tenant_id,
    retry: false,
  });

  const generate = useMutation({
    mutationFn: () => api.post(`/tenants/${user!.tenant_id}/qrcode`, { base_url: baseUrl }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qrcode", user?.tenant_id] }),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/tenants/${user!.tenant_id}/qrcode`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qrcode", user?.tenant_id] }),
  });

  const hasQR = !!qrData && !isError;

  return (
    <AdminLayout>
      {confirm === "regenerate" && (
        <ConfirmModal
          message="Tem certeza que deseja gerar um novo QR Code? O QR Code atual será substituído."
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

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900">QR Code do Cardápio</h2>
        <p className="text-blue-500 text-sm mt-1">Clientes escaneiam para acessar o cardápio digital</p>
      </div>

      {isLoading && (
        <div className="bg-white/70 rounded-2xl p-8 text-center border border-blue-100">
          <p className="text-blue-400 text-sm">Carregando...</p>
        </div>
      )}

      {!isLoading && hasQR && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-2xl border-2 border-blue-100 bg-blue-50">
              <img src={`data:image/png;base64,${qrData.qr_base64}`} alt="QR Code" className="w-52 h-52" />
            </div>
            <div className="text-center">
              <p className="text-xs text-blue-400 font-mono bg-blue-50 px-3 py-1.5 rounded-lg">{qrData.menu_url}</p>
            </div>
            <div className="flex gap-3 w-full max-w-xs">
              <a href={`data:image/png;base64,${qrData.qr_base64}`} download="qrcode-cardapio.png"
                className="flex-1 bg-blue-600 text-white text-center rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors">
                Download
              </a>
              <button onClick={() => setConfirm("regenerate")}
                className="flex-1 border border-blue-200 text-blue-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-50 transition-colors">
                Regenerar
              </button>
              <button onClick={() => setConfirm("delete")}
                className="px-4 border border-red-200 text-red-500 rounded-xl py-2.5 text-sm font-semibold hover:bg-red-50 transition-colors">
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !hasQR && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">
          <h3 className="font-semibold text-blue-900 mb-1">Nenhum QR Code gerado</h3>
          <p className="text-sm text-blue-400 mb-4">Configure a URL base e gere o QR Code do cardápio.</p>
          <div className="flex gap-2">
            <input
              className="border border-blue-200 rounded-xl px-4 py-2.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="https://menufacil.vercel.app"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
            <button onClick={() => generate.mutate()} disabled={!baseUrl || generate.isPending}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {generate.isPending ? "Gerando..." : "Gerar"}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
