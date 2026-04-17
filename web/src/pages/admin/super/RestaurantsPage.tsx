import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api/client";
import type { Tenant } from "../../../types/api";
import AdminLayout from "../../../components/layouts/AdminLayout";

interface TenantForm {
  name: string;
  slug: string;
  primary_color: string;
  opening_hours: string;
}

interface AdminForm {
  tenantId: number | null;
  email: string;
  password: string;
}

const emptyTenant: TenantForm = {
  name: "",
  slug: "",
  primary_color: "#e63946",
  opening_hours: "",
};

const emptyAdmin: AdminForm = { tenantId: null, email: "", password: "" };

function autoSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function RestaurantsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<TenantForm>(emptyTenant);
  const [showForm, setShowForm] = useState(false);
  const [adminForm, setAdminForm] = useState<AdminForm>(emptyAdmin);

  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: () => api.get("/tenants/").then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post("/tenants/", {
        ...form,
        opening_hours: form.opening_hours || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      setForm(emptyTenant);
      setShowForm(false);
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.patch(`/tenants/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants"] }),
  });

  const createAdmin = useMutation({
    mutationFn: () =>
      api.post(`/tenants/${adminForm.tenantId}/users`, {
        email: adminForm.email,
        password: adminForm.password,
      }),
    onSuccess: () => {
      setAdminForm(emptyAdmin);
      alert("Admin criado com sucesso!");
    },
  });

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          Restaurantes ({tenants.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Novo Restaurante
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-4 mb-6 space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Nome do restaurante"
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                name: e.target.value,
                slug: autoSlug(e.target.value),
              }))
            }
          />
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Slug (URL: menufacil.com/menu/slug)"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Horário (ex: Seg–Sex 18h–23h)"
            value={form.opening_hours}
            onChange={(e) =>
              setForm((f) => ({ ...f, opening_hours: e.target.value }))
            }
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Cor principal</label>
            <input
              type="color"
              value={form.primary_color}
              onChange={(e) =>
                setForm((f) => ({ ...f, primary_color: e.target.value }))
              }
              className="w-8 h-8 rounded cursor-pointer border"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => create.mutate()}
              disabled={!form.name || !form.slug || create.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Criar
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="border px-4 py-2 rounded-lg text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {tenants.map((t) => (
          <div
            key={t.id}
            className="bg-white border rounded-xl px-4 py-3 flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: t.primary_color }}
              />
              <div>
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-xs text-gray-400">/menu/{t.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  t.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {t.is_active ? "Ativo" : "Inativo"}
              </span>
              <button
                onClick={() =>
                  setAdminForm((f) => ({ ...f, tenantId: t.id }))
                }
                className="text-xs text-purple-600 hover:underline"
              >
                + Admin
              </button>
              <button
                onClick={() =>
                  toggleActive.mutate({ id: t.id, is_active: !t.is_active })
                }
                className="text-xs text-blue-600 hover:underline"
              >
                {t.is_active ? "Desativar" : "Ativar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create admin modal */}
      {adminForm.tenantId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-3 shadow-xl">
            <h3 className="font-bold">Criar Admin do Restaurante</h3>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Email"
              type="email"
              value={adminForm.email}
              onChange={(e) =>
                setAdminForm((f) => ({ ...f, email: e.target.value }))
              }
            />
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Senha"
              type="password"
              value={adminForm.password}
              onChange={(e) =>
                setAdminForm((f) => ({ ...f, password: e.target.value }))
              }
            />
            <div className="flex gap-2">
              <button
                onClick={() => createAdmin.mutate()}
                disabled={
                  !adminForm.email ||
                  !adminForm.password ||
                  createAdmin.isPending
                }
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex-1 disabled:opacity-50"
              >
                Criar
              </button>
              <button
                onClick={() => setAdminForm(emptyAdmin)}
                className="border px-4 py-2 rounded-lg text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
