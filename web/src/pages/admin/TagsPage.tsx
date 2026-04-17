import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { Tag } from "../../types/api";
import AdminLayout from "../../components/layouts/AdminLayout";

export default function TagsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState("#dbeafe");
  const [textColor, setTextColor] = useState("#1e40af");

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: () => api.get("/tags/").then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: () => api.post("/tags/", { name, emoji: emoji || null, color, text_color: textColor }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tags"] }); setName(""); setEmoji(""); },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/tags/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Tags</h2>
        <p className="text-blue-500 text-sm mt-1">{tags.length} tag{tags.length !== 1 ? "s" : ""} cadastrada{tags.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4 mb-4">
        <div className="flex gap-2 flex-wrap items-center">
          <input
            className="border border-blue-200 rounded-xl px-4 py-2.5 text-sm flex-1 min-w-32 focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Nome (ex: Vegano)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="border border-blue-200 rounded-xl px-3 py-2.5 text-sm w-16 text-center text-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="🌱"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
          />
          <div className="flex items-center gap-1.5 text-sm text-blue-600 font-medium">
            <label>Fundo</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-blue-200" />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-blue-600 font-medium">
            <label>Texto</label>
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-blue-200" />
          </div>
          <button onClick={() => create.mutate()} disabled={!name || create.isPending}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            Adicionar
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <div key={t.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm"
            style={{ background: t.color, color: t.text_color, borderColor: t.color }}>
            <span className="text-sm font-semibold">{t.emoji} {t.name}</span>
            <button onClick={() => remove.mutate(t.id)}
              className="opacity-50 hover:opacity-100 transition-opacity text-xs font-bold ml-1">✕</button>
          </div>
        ))}
        {tags.length === 0 && (
          <div className="w-full text-center py-12 text-blue-300">
            <p className="text-4xl mb-2">🏷️</p>
            <p className="text-sm">Nenhuma tag cadastrada</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
