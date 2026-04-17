import type { MenuItem } from "../../types/api";
import TagBadge from "./TagBadge";

export default function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div className="flex gap-3 border rounded-xl p-3 bg-white">
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{item.name}</p>
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
            {item.description}
          </p>
        )}
        <div className="flex flex-wrap gap-1 mt-1">
          {item.tags.map((t) => (
            <TagBadge key={t.id} tag={t} />
          ))}
        </div>
        <p className="font-bold text-sm text-blue-600 mt-1">
          R${" "}
          {parseFloat(item.price).toFixed(2).replace(".", ",")}
        </p>
      </div>
    </div>
  );
}
