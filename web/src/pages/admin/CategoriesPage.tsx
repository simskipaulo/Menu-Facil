import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { Category } from "../../types/api";
import AdminLayout from "../../components/layouts/AdminLayout";

const EMOJIS = [
  "🍕","🍔","🌮","🍣","🍜","🍗","🥩","🥗","🍰","🍩",
  "🥤","🍺","☕","🧃","🍷","🍹","🥪","🌯","🍱","🍛",
  "🦐","🐟","🥚","🧆","🥞","🫕","🍲","🥘","🫔","🧁",
  "🥐","🍞","🧀","🥓","🍤","🥑","🫙","🍫","🍬","🧋",
];

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="border border-neutral-200 rounded-xl w-14 h-[42px] text-xl flex items-center justify-center hover:border-brand-400 transition-colors bg-white">
        {value || "😀"}
      </button>
      {open && (
        <div className="absolute top-12 left-0 z-50 bg-white border border-neutral-100 rounded-2xl shadow-xl p-3 w-64">
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((e) => (
              <button key={e} type="button"
                onClick={() => { onChange(e); setOpen(false); }}
                className={`text-xl w-8 h-8 rounded-lg flex items-center justify-center hover:bg-brand-50 transition-colors ${value === e ? "bg-brand-100 ring-2 ring-brand-400" : ""}`}>
                {e}
              </button>
            ))}
          </div>
          {value && (
            <button type="button" onClick={() => { onChange(""); setOpen(false); }}
              className="mt-2 w-full text-xs text-neutral-400 hover:text-neutral-600 py-1 transition-colors">
              Remover emoji
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories/").then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: () => api.post("/categories/", { name, emoji: emoji || null, order: categories.length }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); setName(""); setEmoji(""); },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="page-title">Categorias</h2>
        <p className="text-neutral-500 text-sm mt-0.5">
          {categories.length} categoria{categories.length !== 1 ? "s" : ""} cadastrada{categories.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="card p-5 mb-5">
        <h3 className="text-sm font-bold text-neutral-800 mb-3">Nova Categoria</h3>
        <div className="flex gap-2">
          <input
            className="form-input flex-1"
            placeholder="Nome da categoria"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name && create.mutate()}
          />
          <EmojiPicker value={emoji} onChange={setEmoji} />
          <button
            onClick={() => create.mutate()}
            disabled={!name || create.isPending}
            className="btn-primary"
          >
            Adicionar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((c, index) => (
          <div key={c.id} className="card px-4 py-3.5 flex items-center gap-3 group hover:shadow-card-hover transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
              {c.emoji || "📂"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-neutral-900">{c.name}</p>
              <p className="text-xs text-neutral-400">Categoria #{index + 1}</p>
            </div>
            <button onClick={() => remove.mutate(c.id)}
              className="text-sm text-danger-500 font-medium opacity-0 group-hover:opacity-100 hover:bg-danger-50 px-3 py-1.5 rounded-lg transition-all">
              Remover
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-2 card text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">📂</span>
            </div>
            <p className="font-semibold text-neutral-700">Nenhuma categoria cadastrada</p>
            <p className="text-sm text-neutral-400 mt-1">Crie categorias para organizar o cardápio</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
