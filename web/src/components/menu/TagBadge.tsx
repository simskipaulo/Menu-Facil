import type { Tag } from "../../types/api";

export default function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full"
      style={{ background: tag.color, color: tag.text_color }}
    >
      {tag.emoji} {tag.name}
    </span>
  );
}
