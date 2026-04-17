import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../api/client";
import type { Tenant } from "../../../types/api";
import AdminLayout from "../../../components/layouts/AdminLayout";

interface TenantForm { name: string; slug: string; primary_color: string; opening_hours: string; }
interface AdminForm { tenantId: number | null; email: string; password: string; }
interface UserOut { id: number; email: string; role: string; }
interface EditUserForm { email: string; password: string; }

const emptyTenant: TenantForm = { name: "", slug: "", primary_color: "#e63946", opening_hours: "" };
const emptyAdmin: AdminForm = { tenantId: null, email: "", password: "" };

function autoSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function EditRestaurantModal({ tenant, onClose }: { tenant: Tenant; onClose: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"info" | "admins">("info");
  const [form, setForm] = useState({ name: tenant.name, opening_hours: tenant.opening_hours ?? "", primary_color: tenant.primary_color });
  const [editingUser, setEditingUser] = useState<{ id: number; form: EditUserForm } | null>(null);
  const [addAdmin, setAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: "", password: "" });

  const { data: users = [], refetch: refetchUsers } = useQuery<UserOut[]>({
    queryKey: ["tenant-users", tenant.id],
    queryFn: () => api.get(`/tenants/${tenant.id}/users`).then((r) => r.data),
    enabled: tab === "admins",
  });

  const updateTenant = useMutation({
    mutationFn: () => api.patch(`/tenants/${tenant.id}`, { name: form.name, opening_hours: form.opening_hours || null, primary_color: form.primary_color }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tenants"] }); onClose(); },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditUserForm }) =>
      api.patch(`/tenants/${tenant.id}/users/${id}`, { email: data.email || undefined, password: data.password || undefined }),
    onSuccess: () => { refetchUsers(); setEditingUser(null); },
  });

  const revokeUser = useMutation({
    mutationFn: (id: number) => api.delete(`/tenants/${tenant.id}/users/${id}`),
    onSuccess: () => refetchUsers(),
  });

  const createAdmin = useMutation({
    mutationFn: () => api.post(`/tenants/${tenant.id}/users`, newAdmin),
    onSuccess: () => { refetchUsers(); setAddAdmin(false); setNewAdmin({ email: "", password: "" }); },
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-50">
          <div>
            <h3 className="font-bold text-blue-900 text-lg">{tenant.name}</h3>
            <p className="text-xs text-blue-400">Editar restaurante</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-blue-50 px-6">
          {(["info", "admins"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              {t === "info" ? "Informações" : "Admins"}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {tab === "info" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-blue-500 uppercase tracking-wide block mb-1.5">Nome do Restaurante</label>
                <input className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-blue-500 uppercase tracking-wide block mb-1.5">Horário de Funcionamento</label>
                <input className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Ex: Seg–Sex 18h–23h" value={form.opening_hours} onChange={(e) => setForm((f) => ({ ...f, opening_hours: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-blue-500 uppercase tracking-wide block mb-1.5">Cor Principal</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.primary_color} onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-blue-200" />
                  <span className="text-sm text-gray-500 font-mono">{form.primary_color}</span>
                </div>
              </div>
              <button onClick={() => updateTenant.mutate()} disabled={!form.name || updateTenant.isPending}
                className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2">
                {updateTenant.isPending ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          )}

          {tab === "admins" && (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="border border-blue-100 rounded-xl p-4 bg-blue-50/40">
                  {editingUser?.id === u.id ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">Editando admin</p>
                      <input className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder={`Email atual: ${u.email}`}
                        value={editingUser.form.email}
                        onChange={(e) => setEditingUser((ev) => ev && ({ ...ev, form: { ...ev.form, email: e.target.value } }))} />
                      <input type="password" className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        placeholder="Nova senha (deixe em branco para manter)"
                        value={editingUser.form.password}
                        onChange={(e) => setEditingUser((ev) => ev && ({ ...ev, form: { ...ev.form, password: e.target.value } }))} />
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => updateUser.mutate({ id: u.id, data: editingUser.form })}
                          disabled={updateUser.isPending}
                          className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                          Salvar
                        </button>
                        <button onClick={() => setEditingUser(null)}
                          className="flex-1 border border-blue-200 text-blue-600 rounded-lg py-2 text-sm font-semibold hover:bg-blue-50 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-900">{u.email}</p>
                        <p className="text-xs text-blue-400 mt-0.5">Admin do restaurante</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingUser({ id: u.id, form: { email: u.email, password: "" } })}
                          className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors px-2 py-1 rounded-lg hover:bg-blue-100">
                          Editar
                        </button>
                        <button onClick={() => { if (confirm(`Revogar acesso de ${u.email}?`)) revokeUser.mutate(u.id); }}
                          className="text-xs text-red-500 font-semibold hover:text-red-700 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
                          Revogar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {users.length === 0 && !addAdmin && (
                <p className="text-center text-blue-300 text-sm py-6">Nenhum admin cadastrado</p>
              )}

              {addAdmin ? (
                <div className="border border-blue-200 rounded-xl p-4 space-y-2 bg-blue-50/40">
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">Novo Admin</p>
                  <input type="email" className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Email" value={newAdmin.email} onChange={(e) => setNewAdmin((f) => ({ ...f, email: e.target.value }))} />
                  <input type="password" className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Senha" value={newAdmin.password} onChange={(e) => setNewAdmin((f) => ({ ...f, password: e.target.value }))} />
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => createAdmin.mutate()} disabled={!newAdmin.email || !newAdmin.password || createAdmin.isPending}
                      className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      Criar
                    </button>
                    <button onClick={() => setAddAdmin(false)}
                      className="flex-1 border border-blue-200 text-blue-600 rounded-lg py-2 text-sm font-semibold hover:bg-blue-50 transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddAdmin(true)}
                  className="w-full border-2 border-dashed border-blue-200 text-blue-500 rounded-xl py-3 text-sm font-semibold hover:border-blue-400 hover:text-blue-700 transition-colors">
                  + Adicionar Admin
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RestaurantsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<TenantForm>(emptyTenant);
  const [showForm, setShowForm] = useState(false);
  const [adminForm, setAdminForm] = useState<AdminForm>(emptyAdmin);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: () => api.get("/tenants/").then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: () => api.post("/tenants/", { ...form, opening_hours: form.opening_hours || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tenants"] }); setForm(emptyTenant); setShowForm(false); },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => api.patch(`/tenants/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants"] }),
  });

  const createAdmin = useMutation({
    mutationFn: () => api.post(`/tenants/${adminForm.tenantId}/users`, { email: adminForm.email, password: adminForm.password }),
    onSuccess: () => { setAdminForm(emptyAdmin); alert("Admin criado com sucesso!"); },
  });

  return (
    <AdminLayout>
      {editingTenant && <EditRestaurantModal tenant={editingTenant} onClose={() => setEditingTenant(null)} />}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Restaurantes</h2>
          <p className="text-blue-500 text-sm mt-1">{tenants.length} restaurante{tenants.length !== 1 ? "s" : ""} cadastrado{tenants.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
          {showForm ? "Cancelar" : "+ Novo Restaurante"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-blue-100 rounded-2xl p-5 mb-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-blue-900 text-sm uppercase tracking-wide">Novo Restaurante</h3>
          <input className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Nome do restaurante" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))} />
          <input className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Slug (URL)" value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
          <input className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Horário (ex: Seg–Sex 18h–23h)" value={form.opening_hours}
            onChange={(e) => setForm((f) => ({ ...f, opening_hours: e.target.value }))} />
          <div className="flex items-center gap-3">
            <label className="text-sm text-blue-600 font-medium">Cor principal</label>
            <input type="color" value={form.primary_color} onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
              className="w-9 h-9 rounded-lg cursor-pointer border border-blue-200" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => create.mutate()} disabled={!form.name || !form.slug || create.isPending}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              Criar
            </button>
            <button onClick={() => setShowForm(false)}
              className="border border-blue-200 text-blue-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {tenants.map((t) => (
          <div key={t.id} className="bg-white border border-blue-100 rounded-xl px-4 py-3 flex justify-between items-center shadow-sm hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: t.primary_color }} />
              <p className="font-semibold text-blue-900 text-sm">{t.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${t.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {t.is_active ? "Ativo" : "Inativo"}
              </span>
              <button onClick={() => setEditingTenant(t)}
                className="text-xs text-blue-600 font-semibold hover:text-blue-800 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                Editar
              </button>
              <button onClick={() => toggleActive.mutate({ id: t.id, is_active: !t.is_active })}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${t.is_active ? "text-red-500 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}>
                {t.is_active ? "Desativar" : "Ativar"}
              </button>
            </div>
          </div>
        ))}
        {tenants.length === 0 && (
          <div className="text-center py-16 text-blue-300">
            <p className="text-5xl mb-3">🏪</p>
            <p className="text-sm">Nenhum restaurante cadastrado</p>
          </div>
        )}
      </div>

      {adminForm.tenantId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-3 shadow-xl">
            <h3 className="font-bold text-blue-900">Criar Admin do Restaurante</h3>
            <input className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Email" type="email" value={adminForm.email}
              onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))} />
            <input className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Senha" type="password" value={adminForm.password}
              onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))} />
            <div className="flex gap-2">
              <button onClick={() => createAdmin.mutate()} disabled={!adminForm.email || !adminForm.password || createAdmin.isPending}
                className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                Criar
              </button>
              <button onClick={() => setAdminForm(emptyAdmin)}
                className="flex-1 border border-blue-200 text-blue-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
