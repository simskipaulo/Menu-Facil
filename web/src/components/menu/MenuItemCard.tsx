import type { MenuItem } from "../../types/api";
import TagBadge from "./TagBadge";

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const price = parseFloat(item.price).toFixed(2).replace(".", ",");

  if (item.image_url) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow border border-neutral-100">
        <div className="relative h-44 overflow-hidden">
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          {!item.is_available && (
            <div className="absolute inset-0 bg-neutral-900/50 flex items-center justify-center">
              <span className="bg-white/90 text-neutral-700 text-xs font-semibold px-3 py-1 rounded-full">
                Indisponível
              </span>
            </div>
          )}
          {item.tags.length > 0 && (
            <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end">
              {item.tags.slice(0, 2).map((t) => <TagBadge key={t.id} tag={t} />)}
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="font-bold text-neutral-900">{item.name}</p>
          {item.description && (
            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{item.description}</p>
          )}
          <p className="font-bold text-brand-600 mt-3 text-lg">R$ {price}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-card border border-neutral-100 flex justify-between items-center gap-4 hover:shadow-card-hover transition-shadow">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-neutral-900">{item.name}</p>
        {item.description && (
          <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{item.description}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {item.tags.map((t) => <TagBadge key={t.id} tag={t} />)}
        </div>
        {!item.is_available && (
          <span className="text-xs text-neutral-400 mt-1 block">Indisponível</span>
        )}
      </div>
      <p className="font-bold text-brand-600 text-lg flex-shrink-0">R$ {price}</p>
    </div>
  );
}
