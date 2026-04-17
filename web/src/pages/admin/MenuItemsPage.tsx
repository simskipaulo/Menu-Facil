import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { MenuItem, Category, Tag } from "../../types/api";
import AdminLayout from "../../components/layouts/AdminLayout";
import TagBadge from "../../components/menu/TagBadge";

interface ItemForm {
  name: string; description: string; price: string;
  category_id: string; tag_ids: number[]; image_url: string; is_available: boolean;
}
const empty: ItemForm = { name: "", description: "", price: "", category_id: "", tag_ids: [], image_url: "", is_available: true };

export default function MenuItemsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<ItemForm>(empty);
  const [editing, setEditing] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: items = [] } = useQuery<MenuItem[]>({ queryKey: ["menu-items"], queryFn: () => api.get("/menu-items/").then((r) => r.data) });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["categories"], queryFn: () => api.get("/categories/").then((r) => r.data) });
  const { data: tags = [] } = useQuery<Tag[]>({ queryKey: ["tags"], queryFn: () => api.get("/tags/").then((r) => r.data) });

  const save = useMutation({
    mutationFn: () => {
      const payload = { name: form.name, description: form.description || null, price: form.price, category_id: Number(form.category_id), tag_ids: form.tag_ids, image_url: form.image_url || null, is_available: form.is_available };
      return editing ? api.patch(`/menu-items/${editing}`, payload) : api.post("/menu-items/", payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["menu-items"] }); setForm(empty); setEditing(null); setShowForm(false); },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/menu-items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
  });

  const startEdit = (item: MenuItem) => {
    setForm({ name: item.name, description: item.description ?? "", price: item.price, category_id: String(item.category_id), tag_ids: item.tags.map((t) => t.id), image_url: item.image_url ?? "", is_available: item.is_available });
    setEditing(item.id);
    setShowForm(true);
  };

  const toggleTag = (id: number) => setForm((f) => ({ ...f, tag_ids: f.tag_ids.includes(id) ? f.tag_ids.filter((x) => x !== id) : [...f.tag_ids, id] }));

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">Cardápio</h2>
          <p className="text-blue-500 text-sm mt-1">{items.length} prato{items.length !== 1 ? "s" : ""} cadastrado{items.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setForm(empty); setEditing(null); setShowForm(!showForm); }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          {showForm && !editing ? "Cancelar" : "+ Novo Prato"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-blue-100 rounded-2xl p-5 mb-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-blue-900 text-sm uppercase tracking-wide">{editing ? "Editar prato" : "Novo prato"}</h3>
          <input className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Nome do prato" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <textarea className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Descrição (opcional)" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="flex gap-2">
            <input className="border border-blue-200 rounded-xl px-4 py-2.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Preço" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            <select className="border border-blue-200 rounded-xl px-4 py-2.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300" value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
              <option value="">Selecionar categoria</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          <input className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="URL da imagem (opcional)" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} />
          {tags.length > 0 && (
            <div>
              <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <button key={t.id} type="button" onClick={() => toggleTag(t.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border-2 transition-all ${form.tag_ids.includes(t.id) ? "border-blue-500 ring-1 ring-blue-300" : "border-transparent"}`}
                    style={{ background: t.color, color: t.text_color }}>
                    {t.emoji} {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="available" checked={form.is_available} onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))} className="w-4 h-4 rounded accent-blue-600" />
            <label htmlFor="available" className="text-sm text-blue-800">Disponível</label>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => save.mutate()} disabled={!form.name || !form.price || !form.category_id || save.isPending}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {editing ? "Salvar" : "Adicionar"}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(empty); }}
              className="border border-blue-200 text-blue-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} className="bg-white border border-blue-100 rounded-xl px-4 py-3 flex justify-between items-center shadow-sm hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-3">
              {item.image_url && <img src={item.image_url} alt="" className="w-11 h-11 rounded-xl object-cover border border-blue-100" />}
              <div>
                <p className="font-semibold text-blue-900 text-sm">{item.name}</p>
                <p className="text-xs text-blue-400 mt-0.5">
                  {categories.find((c) => c.id === item.category_id)?.name} · R$ {parseFloat(item.price).toFixed(2).replace(".", ",")}
                  {!item.is_available && <span className="ml-2 text-red-400">• Indisponível</span>}
                </p>
                <div className="flex gap-1 mt-1">{item.tags.map((t) => <TagBadge key={t.id} tag={t} />)}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => startEdit(item)} className="text-sm text-blue-600 font-medium hover:text-blue-800 transition-colors">Editar</button>
              <button onClick={() => remove.mutate(item.id)} className="text-sm text-red-400 font-medium hover:text-red-600 transition-colors">Remover</button>
            </div>
          </div>
        ))}
        {items.length === 0 && !showForm && (
          <div className="text-center py-16 text-blue-300">
            <p className="text-5xl mb-3">🍽️</p>
            <p className="text-sm">Nenhum prato cadastrado</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
