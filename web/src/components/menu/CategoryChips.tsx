import type { Category } from "../../types/api";

interface Props {
  categories: Category[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}

export default function CategoryChips({ categories, selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto py-3 px-4">
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap font-semibold transition-all flex-shrink-0 ${
          selected === null
            ? "bg-brand-600 text-white shadow-sm"
            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
        }`}
      >
        Todos
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap font-semibold transition-all flex-shrink-0 ${
            selected === c.id
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          {c.emoji} {c.name}
        </button>
      ))}
    </div>
  );
}
