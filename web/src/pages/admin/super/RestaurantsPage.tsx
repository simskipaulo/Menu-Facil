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
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h3 className="font-bold text-neutral-900 text-lg">{tenant.name}</h3>
            <p className="text-xs text-neutral-400">Editar restaurante</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100">✕</button>
        </div>

        <div className="flex border-b border-neutral-100 px-6">
          {(["info", "admins"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${tab === t ? "border-brand-600 text-brand-600" : "border-transparent text-neutral-400 hover:text-neutral-600"}`}>
              {t === "info" ? "Informações" : "Admins"}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {tab === "info" && (
            <div className="space-y-4">
              <div>
                <label className="field-label">Nome do Restaurante</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Horário de Funcionamento</label>
                <input className="form-input" placeholder="Ex: Seg–Sex 18h–23h" value={form.opening_hours} onChange={(e) => setForm((f) => ({ ...f, opening_hours: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Cor Principal</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.primary_color} onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-neutral-200" />
                  <span className="text-sm text-neutral-500 font-mono">{form.primary_color}</span>
                </div>
              </div>
              <button onClick={() => updateTenant.mutate()} disabled={!form.name || updateTenant.isPending} className="btn-primary w-full py-3 mt-2">
                {updateTenant.isPending ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          )}

          {tab === "admins" && (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="border border-neutral-200 rounded-xl p-4 bg-neutral-50">
                  {editingUser?.id === u.id ? (
                    <div className="space-y-2">
                      <p className="field-label mb-2">Editando admin</p>
                      <input className="form-input" placeholder={`Email atual: ${u.email}`} value={editingUser.form.email}
                        onChange={(e) => setEditingUser((ev) => ev && ({ ...ev, form: { ...ev.form, email: e.target.value } }))} />
                      <input type="password" className="form-input" placeholder="Nova senha (deixe em branco para manter)" value={editingUser.form.password}
                        onChange={(e) => setEditingUser((ev) => ev && ({ ...ev, form: { ...ev.form, password: e.target.value } }))} />
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => updateUser.mutate({ id: u.id, data: editingUser.form })} disabled={updateUser.isPending} className="btn-primary flex-1">Salvar</button>
                        <button onClick={() => setEditingUser(null)} className="btn-ghost flex-1">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">{u.email}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">Admin do restaurante</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingUser({ id: u.id, form: { email: u.email, password: "" } })}
                          className="text-xs text-brand-600 font-semibold hover:bg-brand-50 px-2.5 py-1.5 rounded-lg transition-colors">Editar</button>
                        <button onClick={() => { if (confirm(`Revogar acesso de ${u.email}?`)) revokeUser.mutate(u.id); }}
                          className="text-xs text-danger-500 font-semibold hover:bg-danger-50 px-2.5 py-1.5 rounded-lg transition-colors">Revogar</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {users.length === 0 && !addAdmin && (
                <p className="text-center text-neutral-400 text-sm py-6">Nenhum admin cadastrado</p>
              )}

              {addAdmin ? (
                <div className="border border-neutral-200 rounded-xl p-4 space-y-2 bg-neutral-50">
                  <p className="field-label mb-2">Novo Admin</p>
                  <input type="email" className="form-input" placeholder="Email" value={newAdmin.email} onChange={(e) => setNewAdmin((f) => ({ ...f, email: e.target.value }))} />
                  <input type="password" className="form-input" placeholder="Senha" value={newAdmin.password} onChange={(e) => setNewAdmin((f) => ({ ...f, password: e.target.value }))} />
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => createAdmin.mutate()} disabled={!newAdmin.email || !newAdmin.password || createAdmin.isPending} className="btn-primary flex-1">Criar</button>
                    <button onClick={() => setAddAdmin(false)} className="btn-ghost flex-1">Cancelar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddAdmin(true)}
                  className="w-full border-2 border-dashed border-neutral-200 text-neutral-500 rounded-xl py-3 text-sm font-semibold hover:border-brand-400 hover:text-brand-600 transition-colors">
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

  const active = tenants.filter((t) => t.is_active).length;
  const inactive = tenants.length - active;

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
          <h2 className="page-title">Restaurantes</h2>
          <p className="text-neutral-500 text-sm mt-0.5">{tenants.length} restaurante{tenants.length !== 1 ? "s" : ""} cadastrado{tenants.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancelar" : "+ Novo Restaurante"}
        </button>
      </div>

      {/* Stat cards */}
      {tenants.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Total</p>
            <p className="text-3xl font-bold text-neutral-900">{tenants.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold text-success-600 uppercase tracking-wider mb-1">Ativos</p>
            <p className="text-3xl font-bold text-success-600">{active}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Inativos</p>
            <p className="text-3xl font-bold text-neutral-500">{inactive}</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card p-5 mb-5 border-l-4 border-brand-600">
          <h3 className="font-bold text-neutral-900 mb-4">Novo Restaurante</h3>
          <div className="space-y-3">
            <input className="form-input" placeholder="Nome do restaurante" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))} />
            <input className="form-input" placeholder="Slug (URL)" value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            <input className="form-input" placeholder="Horário (ex: Seg–Sex 18h–23h)" value={form.opening_hours}
              onChange={(e) => setForm((f) => ({ ...f, opening_hours: e.target.value }))} />
            <div className="flex items-center gap-3">
              <label className="field-label mb-0">Cor principal</label>
              <input type="color" value={form.primary_color} onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
                className="w-9 h-9 rounded-lg cursor-pointer border border-neutral-200" />
              <span className="text-sm text-neutral-500 font-mono">{form.primary_color}</span>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => create.mutate()} disabled={!form.name || !form.slug || create.isPending} className="btn-primary">Criar</button>
              <button onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tenants.map((t) => (
          <div key={t.id} className="card p-5 hover:shadow-card-hover transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex-shrink-0 border border-neutral-100" style={{ background: t.primary_color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-neutral-900">{t.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${t.is_active ? "bg-success-50 text-success-700" : "bg-neutral-100 text-neutral-500"}`}>
                    {t.is_active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                {t.opening_hours && <p className="text-xs text-neutral-500 mt-1">{t.opening_hours}</p>}
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <button onClick={() => setEditingTenant(t)} className="text-sm text-brand-600 font-semibold hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors">
                  Editar
                </button>
                <button onClick={() => toggleActive.mutate({ id: t.id, is_active: !t.is_active })}
                  className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${t.is_active ? "text-danger-500 hover:bg-danger-50" : "text-success-600 hover:bg-success-50"}`}>
                  {t.is_active ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
          </div>
        ))}
        {tenants.length === 0 && (
          <div className="col-span-2 card text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏪</span>
            </div>
            <p className="font-semibold text-neutral-700">Nenhum restaurante cadastrado</p>
            <p className="text-sm text-neutral-400 mt-1">Crie o primeiro restaurante para começar</p>
          </div>
        )}
      </div>

      {adminForm.tenantId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-3 shadow-xl">
            <h3 className="font-bold text-neutral-900">Criar Admin do Restaurante</h3>
            <input className="form-input" placeholder="Email" type="email" value={adminForm.email} onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))} />
            <input className="form-input" placeholder="Senha" type="password" value={adminForm.password} onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))} />
            <div className="flex gap-2">
              <button onClick={() => createAdmin.mutate()} disabled={!adminForm.email || !adminForm.password || createAdmin.isPending} className="btn-primary flex-1">Criar</button>
              <button onClick={() => setAdminForm(emptyAdmin)} className="btn-ghost flex-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
