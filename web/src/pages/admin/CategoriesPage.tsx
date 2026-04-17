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
    mutationFn: () =>
      api.post("/categories/", {
        name,
        emoji: emoji || null,
        order: categories.length,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setName("");
      setEmoji("");
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  return (
    <AdminLayout>
      <h2 className="text-xl font-bold mb-4">Categorias</h2>
      <div className="flex gap-2 mb-6">
        <input
          className="border rounded-lg px-3 py-2 text-sm flex-1"
          placeholder="Nome da categoria"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border rounded-lg px-3 py-2 text-sm w-16 text-center"
          placeholder="🍕"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
        />
        <button
          onClick={() => create.mutate()}
          disabled={!name || create.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between bg-white border rounded-xl px-4 py-3"
          >
            <span className="font-medium">
              {c.emoji} {c.name}
            </span>
            <button
              onClick={() => remove.mutate(c.id)}
              className="text-red-500 text-sm hover:underline"
            >
              Remover
            </button>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
