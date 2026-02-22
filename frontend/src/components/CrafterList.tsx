import type { Crafter } from "../hooks/useRecipes";
import "./CrafterList.css";

interface CrafterListProps {
  crafters: Crafter[];
}

export default function CrafterList({ crafters }: CrafterListProps) {
  if (crafters.length === 0) {
    return <span className="crafter-list__none">—</span>;
  }

  return (
    <span className="crafter-list">
      {crafters.map((c, i) => (
        <span key={`${c.name}-${c.realm}`}>
          {i > 0 && ", "}
          <span className="crafter-list__name" title={`${c.name} - ${c.realm}`}>
            {c.name}
          </span>
        </span>
      ))}
    </span>
  );
}
