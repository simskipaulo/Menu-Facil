import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { User } from "../../types/api";
import AdminLayout from "../../components/layouts/AdminLayout";

interface QRData {
  qr_base64: string;
  menu_url: string;
}

export default function QRCodePage() {
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [trigger, setTrigger] = useState(0);

  const { data: user } = useQuery<User>({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me").then((r) => r.data),
  });

  const { data: qrData, isLoading } = useQuery<QRData>({
    queryKey: ["qrcode", user?.tenant_id, baseUrl, trigger],
    queryFn: () =>
      api
        .get(`/tenants/${user!.tenant_id}/qrcode?base_url=${encodeURIComponent(baseUrl)}`)
        .then((r) => r.data),
    enabled: !!user?.tenant_id && trigger > 0,
  });

  return (
    <AdminLayout>
      <h2 className="text-xl font-bold mb-4">QR Code do Cardápio</h2>
      <div className="flex gap-2 mb-6">
        <input
          className="border rounded-lg px-3 py-2 text-sm flex-1"
          placeholder="URL base (ex: https://meudominio.com)"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
        />
        <button
          onClick={() => setTrigger((n) => n + 1)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Gerar
        </button>
      </div>
      {isLoading && <p className="text-gray-400 text-sm">Gerando...</p>}
      {qrData && (
        <div className="flex flex-col items-center gap-4">
          <img
            src={`data:image/png;base64,${qrData.qr_base64}`}
            alt="QR Code"
            className="w-56 h-56 border rounded-xl p-2"
          />
          <p className="text-sm text-gray-500">{qrData.menu_url}</p>
          <a
            href={`data:image/png;base64,${qrData.qr_base64}`}
            download="qrcode-cardapio.png"
            className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium"
          >
            Download PNG
          </a>
        </div>
      )}
    </AdminLayout>
  );
}
