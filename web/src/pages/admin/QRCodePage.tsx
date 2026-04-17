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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-warning-50 mb-3">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-neutral-700 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 bg-danger-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-danger-600 transition-colors">
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
        <h2 className="page-title">QR Code do Cardápio</h2>
        <p className="text-neutral-500 text-sm mt-0.5">Clientes escaneiam para acessar o cardápio digital</p>
      </div>

      <div className="max-w-md">
        {isLoading && (
          <div className="card p-8 text-center">
            <p className="text-neutral-400 text-sm">Carregando...</p>
          </div>
        )}

        {!isLoading && hasQR && (
          <div className="card p-8">
            <div className="flex flex-col items-center gap-6">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200">
                <img src={`data:image/png;base64,${qrData.qr_base64}`} alt="QR Code" className="w-56 h-56 rounded-xl" />
              </div>

              <div className="w-full">
                <p className="field-label text-center">Link do Cardápio</p>
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5">
                  <p className="text-sm text-neutral-700 font-mono break-all text-center">{qrData.menu_url}</p>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <a href={`data:image/png;base64,${qrData.qr_base64}`} download="qrcode-cardapio.png"
                  className="btn-primary flex-1 text-center">
                  Baixar PNG
                </a>
                <button onClick={() => setConfirm("regenerate")} className="btn-ghost flex-1">
                  Regenerar
                </button>
                <button onClick={() => setConfirm("delete")} className="btn-danger px-4">
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !hasQR && (
          <div className="card p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-neutral-100 mx-auto mb-4 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-brand-400">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h2v2h-2z" /><path d="M18 14h3" /><path d="M14 18h2" /><path d="M18 18h3v3" /><path d="M20 21h1" />
              </svg>
            </div>
            <h3 className="font-bold text-neutral-900 text-lg mb-1">Gerar QR Code</h3>
            <p className="text-sm text-neutral-500 mb-6">Clientes escaneiam para acessar o cardápio digital</p>
            <label className="field-label text-left">URL base</label>
            <input
              className="form-input mb-4"
              placeholder="https://menufacil.vercel.app"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
            <button onClick={() => generate.mutate()} disabled={!baseUrl || generate.isPending} className="btn-primary w-full py-3">
              {generate.isPending ? "Gerando..." : "Gerar QR Code"}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
