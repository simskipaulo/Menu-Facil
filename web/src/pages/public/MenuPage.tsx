import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { PublicMenu, Tag } from "../../types/api";
import CategoryChips from "../../components/menu/CategoryChips";
import MenuItemCard from "../../components/menu/MenuItemCard";

export default function MenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery<PublicMenu>({
    queryKey: ["public-menu", slug],
    queryFn: () => api.get(`/public/${slug}`).then((r) => r.data),
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 text-neutral-400">
        Carregando...
      </div>
    );
  if (isError || !data)
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 text-danger-400">
        Cardápio não encontrado.
      </div>
    );

  const allTags = Array.from(
    new Map(data.items.flatMap((i) => i.tags).map((t) => [t.id, t])).values()
  ) as Tag[];

  const filtered = data.items.filter((item) => {
    if (selectedCategory !== null && item.category_id !== selectedCategory) return false;
    if (selectedTagId !== null && !item.tags.some((t) => t.id === selectedTagId)) return false;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto min-h-screen bg-neutral-50">
      {/* Restaurant hero */}
      <div
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${data.tenant.primary_color} 0%, ${data.tenant.primary_color}dd 100%)` }}
      >
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-10 bg-white blur-3xl pointer-events-none" />
        <div className="relative p-8 text-center">
          {data.tenant.logo_url && (
            <img src={data.tenant.logo_url} alt="logo" className="h-16 mx-auto mb-3 rounded-2xl shadow-lg object-contain" />
          )}
          <h1 className="text-white font-extrabold text-2xl tracking-tight">{data.tenant.name}</h1>
          {data.tenant.opening_hours && (
            <div className="inline-flex items-center gap-2 mt-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full">
              <span className="text-white/80 text-xs">⏰</span>
              <p className="text-white/90 text-xs font-medium">{data.tenant.opening_hours}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky category chips */}
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-100 shadow-sm">
        <CategoryChips categories={data.categories} selected={selectedCategory} onSelect={setSelectedCategory} />
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-white border-b border-neutral-100">
          {allTags.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTagId(selectedTagId === t.id ? null : t.id)}
              className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition-all flex-shrink-0 ${selectedTagId === t.id ? "ring-2 ring-brand-500" : ""}`}
              style={{ background: t.color, color: t.text_color }}
            >
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Items grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">🔍</p>
            <p className="text-neutral-500 font-medium">Nenhum item encontrado</p>
            <p className="text-neutral-400 text-sm mt-1">Tente outro filtro</p>
          </div>
        )}
      </div>
    </div>
  );
}
