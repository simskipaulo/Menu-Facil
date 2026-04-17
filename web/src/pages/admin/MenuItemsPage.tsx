import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { MenuItem, Category } from "../../types/api";
import AdminLayout from "../../components/layouts/AdminLayout";

function ImageModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <img src={url} alt="" className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]" />
        <button onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-neutral-500 hover:text-neutral-800 font-bold text-sm">
          ✕
        </button>
      </div>
    </div>
  );
}

function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/upload/image", form, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(res.data.url);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Erro ao fazer upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="field-label">Imagem</label>
      {value ? (
        <div className="flex items-center gap-3">
          <img src={value} alt="" className="w-16 h-16 rounded-xl object-cover border border-neutral-100" />
          <button type="button" onClick={() => onChange("")}
            className="text-xs text-danger-500 hover:text-danger-600 font-medium transition-colors">
            Remover imagem
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-full border-2 border-dashed border-neutral-200 rounded-xl py-4 text-sm text-neutral-400 hover:border-brand-400 hover:text-brand-600 transition-colors disabled:opacity-50">
          {uploading ? "Enviando..." : "📷 Clique para selecionar uma imagem"}
        </button>
      )}
      {error && <p className="text-danger-500 text-xs mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}

interface ItemForm {
  name: string; description: string; price: string;
  category_id: string; image_url: string; is_available: boolean;
}
const empty: ItemForm = { name: "", description: "", price: "", category_id: "", image_url: "", is_available: true };

export default function MenuItemsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<ItemForm>(empty);
  const [editing, setEditing] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"available" | "unavailable" | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data: items = [] } = useQuery<MenuItem[]>({ queryKey: ["menu-items"], queryFn: () => api.get("/menu-items/").then((r) => r.data) });
  const available = items.filter((i) => i.is_available).length;
  const unavailable = items.length - available;
  const filtered = filter === null ? items : items.filter((i) => filter === "available" ? i.is_available : !i.is_available);
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["categories"], queryFn: () => api.get("/categories/").then((r) => r.data) });

  const save = useMutation({
    mutationFn: () => {
      const payload = { name: form.name, description: form.description || null, price: form.price.replace(",", "."), category_id: Number(form.category_id), tag_ids: [], image_url: form.image_url || null, is_available: form.is_available };
      return editing ? api.patch(`/menu-items/${editing}`, payload) : api.post("/menu-items/", payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["menu-items"] }); setForm(empty); setEditing(null); setShowForm(false); },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/menu-items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });

  const startEdit = (item: MenuItem) => {
    setForm({ name: item.name, description: item.description ?? "", price: item.price, category_id: String(item.category_id), image_url: item.image_url ?? "", is_available: item.is_available });
    setEditing(item.id);
    setShowForm(true);
  };

  return (
    <AdminLayout>
      {lightbox && <ImageModal url={lightbox} onClose={() => setLightbox(null)} />}

      {/* Header row */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="page-title">Cardápio</h2>
          <p className="text-neutral-500 text-sm mt-0.5">{filtered.length} de {items.length} prato{items.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setForm(empty); setEditing(null); setShowForm(!showForm); }}
          className="btn-primary"
        >
          {showForm && !editing ? "Cancelar" : "+ Novo Prato"}
        </button>
      </div>

      {/* Stat cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Total</p>
            <p className="text-3xl font-bold text-neutral-900">{items.length}</p>
            <p className="text-xs text-neutral-400 mt-1">pratos no cardápio</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold text-success-600 uppercase tracking-wider mb-1">Disponíveis</p>
            <p className="text-3xl font-bold text-success-600">{available}</p>
            <div className="mt-2 h-1 rounded-full bg-neutral-100">
              <div className="h-1 rounded-full bg-success-500 transition-all" style={{ width: items.length ? `${(available / items.length) * 100}%` : "0%" }} />
            </div>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold text-danger-500 uppercase tracking-wider mb-1">Indisponíveis</p>
            <p className="text-3xl font-bold text-danger-500">{unavailable}</p>
            <div className="mt-2 h-1 rounded-full bg-neutral-100">
              <div className="h-1 rounded-full bg-danger-400 transition-all" style={{ width: items.length ? `${(unavailable / items.length) * 100}%` : "0%" }} />
            </div>
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-2 mb-5">
        {[{ key: "available", label: "Disponível" }, { key: "unavailable", label: "Indisponível" }].map(({ key, label }) => (
          <button key={key}
            onClick={() => setFilter((f) => f === key ? null : key as "available" | "unavailable")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              filter === key
                ? key === "available" ? "bg-success-500 border-success-500 text-white" : "bg-danger-400 border-danger-400 text-white"
                : "bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="card p-6 mb-5 border-l-4 border-brand-600">
          <h3 className="font-bold text-neutral-900 mb-4">{editing ? "Editar prato" : "Novo prato"}</h3>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <input className="form-input col-span-2" placeholder="Nome do prato" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <input className="form-input" placeholder="R$ 0,00" inputMode="decimal" value={form.price}
              onChange={(e) => { const v = e.target.value.replace(",", "."); if (/^\d*\.?\d{0,2}$/.test(v)) setForm((f) => ({ ...f, price: e.target.value })); }} />
          </div>
          <textarea className="form-input mb-3" placeholder="Descrição (opcional)" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <select className="form-input mb-3" value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
            <option value="">Selecionar categoria</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
          <div className="mb-3">
            <ImageUpload value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <input type="checkbox" id="available" checked={form.is_available} onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))} className="w-4 h-4 rounded accent-brand-600" />
            <label htmlFor="available" className="text-sm text-neutral-700">Disponível</label>
          </div>
          <div className="flex gap-2">
            <button onClick={() => save.mutate()} disabled={!form.name || !form.price || !form.category_id || save.isPending} className="btn-primary">
              {editing ? "Salvar" : "Adicionar"}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(empty); }} className="btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Item list */}
      <div className="flex flex-col gap-2">
        {filtered.map((item) => {
          const categoryName = categories.find((c) => c.id === item.category_id)?.name;
          const price = parseFloat(item.price).toFixed(2).replace(".", ",");
          return (
            <div key={item.id} className="card px-5 py-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
              {item.image_url ? (
                <img src={item.image_url} alt="" onClick={() => setLightbox(item.image_url!)}
                  className="w-14 h-14 rounded-xl object-cover border border-neutral-100 cursor-pointer hover:scale-105 transition-transform flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🍽️</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900 text-sm">{item.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {categoryName && (
                    <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">{categoryName}</span>
                  )}
                  <span className="text-xs font-semibold text-neutral-600">R$ {price}</span>
                </div>
                {item.description && (
                  <p className="text-xs text-neutral-400 mt-1 truncate max-w-sm">{item.description}</p>
                )}
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${
                item.is_available ? "bg-success-50 text-success-700" : "bg-neutral-100 text-neutral-500"
              }`}>
                {item.is_available ? "Disponível" : "Indisponível"}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(item)} className="text-sm text-brand-600 font-medium hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors">Editar</button>
                <button onClick={() => remove.mutate(item.id)} className="text-sm text-danger-500 font-medium hover:bg-danger-50 px-3 py-1.5 rounded-lg transition-colors">Remover</button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && !showForm && (
          <div className="card text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">{filter ? "🔍" : "🍽️"}</span>
            </div>
            <p className="font-semibold text-neutral-700">{filter ? "Nenhum prato encontrado" : "Nenhum prato cadastrado"}</p>
            <p className="text-sm text-neutral-400 mt-1">{filter ? "Tente outro filtro" : "Adicione o primeiro prato do seu cardápio"}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
