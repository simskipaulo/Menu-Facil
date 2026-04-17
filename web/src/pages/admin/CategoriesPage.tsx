import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { Category } from "../../types/api";
import AdminLayout from "../../components/layouts/AdminLayout";

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
        <h2 className="text-2xl font-bold text-blue-900">Categorias</h2>
        <p className="text-blue-500 text-sm mt-1">{categories.length} categoria{categories.length !== 1 ? "s" : ""} cadastrada{categories.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4 mb-4">
        <div className="flex gap-2">
          <input
            className="border border-blue-200 rounded-xl px-4 py-2.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Nome da categoria"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name && create.mutate()}
          />
          <input
            className="border border-blue-200 rounded-xl px-3 py-2.5 text-sm w-16 text-center text-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="🍕"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
          />
          <button
            onClick={() => create.mutate()}
            disabled={!name || create.isPending}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Adicionar
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {categories.map((c) => (
          <div key={c.id}
            className="flex items-center justify-between bg-white border border-blue-100 rounded-xl px-4 py-3 shadow-sm hover:border-blue-200 transition-colors">
            <span className="font-medium text-blue-900">
              {c.emoji && <span className="mr-2">{c.emoji}</span>}{c.name}
            </span>
            <button onClick={() => remove.mutate(c.id)}
              className="text-red-400 text-sm hover:text-red-600 font-medium transition-colors">
              Remover
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-12 text-blue-300">
            <p className="text-4xl mb-2">📂</p>
            <p className="text-sm">Nenhuma categoria cadastrada</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
