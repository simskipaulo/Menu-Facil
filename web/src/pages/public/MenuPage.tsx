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
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Carregando...
      </div>
    );
  if (isError || !data)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-400">
        Cardápio não encontrado.
      </div>
    );

  // Deduplicate tags from all items
  const allTags = Array.from(
    new Map(
      data.items.flatMap((i) => i.tags).map((t) => [t.id, t])
    ).values()
  ) as Tag[];

  const filtered = data.items.filter((item) => {
    if (selectedCategory !== null && item.category_id !== selectedCategory)
      return false;
    if (selectedTagId !== null && !item.tags.some((t) => t.id === selectedTagId))
      return false;
    return true;
  });

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50">
      {/* Restaurant header */}
      <div
        className="p-4 text-center"
        style={{ backgroundColor: data.tenant.primary_color }}
      >
        {data.tenant.logo_url && (
          <img
            src={data.tenant.logo_url}
            alt="logo"
            className="h-12 mx-auto mb-2 rounded"
          />
        )}
        <h1 className="text-white font-bold text-xl">{data.tenant.name}</h1>
        {data.tenant.opening_hours && (
          <p className="text-white/80 text-xs mt-1">{data.tenant.opening_hours}</p>
        )}
      </div>

      {/* Category chips */}
      <CategoryChips
        categories={data.categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-gray-50">
          {allTags.map((t) => (
            <button
              key={t.id}
              onClick={() =>
                setSelectedTagId(selectedTagId === t.id ? null : t.id)
              }
              className={`text-xs px-2 py-0.5 rounded-full border ${
                selectedTagId === t.id ? "ring-2 ring-blue-500" : ""
              }`}
              style={{ background: t.color, color: t.text_color }}
            >
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Item list */}
      <div className="p-4 flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-10">
            Nenhum item encontrado.
          </p>
        )}
        {filtered.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
