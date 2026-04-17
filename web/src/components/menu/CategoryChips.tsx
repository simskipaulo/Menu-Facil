import type { Category } from "../../types/api";

interface Props {
  categories: Category[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}

export default function CategoryChips({ categories, selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto py-3 px-4 bg-gray-50 border-b">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1 rounded-full text-sm whitespace-nowrap font-medium ${
          selected === null
            ? "bg-blue-600 text-white"
            : "bg-white border text-gray-600"
        }`}
      >
        Todos
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap font-medium ${
            selected === c.id
              ? "bg-blue-600 text-white"
              : "bg-white border text-gray-600"
          }`}
        >
          {c.emoji} {c.name}
        </button>
      ))}
    </div>
  );
}
