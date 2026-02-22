import { useState } from "react";
import type { Crafter } from "../hooks/useRecipes";
import "./CrafterList.css";

interface CrafterListProps {
  crafters: Crafter[];
  visibleCount?: number;
}

export default function CrafterList({
  crafters,
  visibleCount = 2,
}: CrafterListProps) {
  const [expanded, setExpanded] = useState(false);

  if (crafters.length === 0) {
    return <span className="crafter-list__none">—</span>;
  }

  const visible = expanded ? crafters : crafters.slice(0, visibleCount);
  const remaining = crafters.length - visibleCount;

  return (
    <span className="crafter-list">
      {visible.map((c, i) => (
        <span key={`${c.name}-${c.realm}`}>
          {i > 0 && ", "}
          <span className="crafter-list__name" title={`${c.name} - ${c.realm}`}>
            {c.name}
          </span>
        </span>
      ))}
      {!expanded && remaining > 0 && (
        <>
          {" "}
          <button
            className="crafter-list__more"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
            }}
          >
            +{remaining} more
          </button>
        </>
      )}
    </span>
  );
}
