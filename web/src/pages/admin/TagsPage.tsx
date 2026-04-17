import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { Tag } from "../../types/api";
import AdminLayout from "../../components/layouts/AdminLayout";

export default function TagsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState("#dcfce7");
  const [textColor, setTextColor] = useState("#166534");

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: () => api.get("/tags/").then((r) => r.data),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post("/tags/", {
        name,
        emoji: emoji || null,
        color,
        text_color: textColor,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      setName("");
      setEmoji("");
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/tags/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });

  return (
    <AdminLayout>
      <h2 className="text-xl font-bold mb-4">Tags</h2>
      <div className="flex gap-2 mb-6 flex-wrap items-end">
        <input
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-32"
          placeholder="Nome (ex: Vegano)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border rounded-lg px-3 py-2 text-sm w-16 text-center"
          placeholder="🌱"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
        />
        <div className="flex items-center gap-1 text-sm">
          <label className="text-gray-600">Fundo</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border"
          />
        </div>
        <div className="flex items-center gap-1 text-sm">
          <label className="text-gray-600">Texto</label>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border"
          />
        </div>
        <button
          onClick={() => create.mutate()}
          disabled={!name || create.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
            style={{ background: t.color, color: t.text_color }}
          >
            <span className="text-sm font-medium">
              {t.emoji} {t.name}
            </span>
            <button
              onClick={() => remove.mutate(t.id)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
