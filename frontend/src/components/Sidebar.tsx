import { useProfessions, type Profession } from "../hooks/useProfessions";
import "./Sidebar.css";

interface SidebarProps {
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function Sidebar({ selectedId, onSelect }: SidebarProps) {
  const { professions, loading } = useProfessions();

  if (loading) {
    return <p className="sidebar__loading">Loading&hellip;</p>;
  }

  return (
    <nav aria-label="Professions">
      <h2 className="sidebar__heading">Professions</h2>
      <ul className="sidebar__list">
        {professions.map((p: Profession) => (
          <li
            key={p.id}
            className={`sidebar__item${p.id === selectedId ? " active" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(p.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(p.id);
              }
            }}
          >
            {p.icon_url ? (
              <img
                className="sidebar__icon"
                src={p.icon_url}
                alt=""
                loading="lazy"
              />
            ) : (
              <span className="sidebar__icon-placeholder" />
            )}
            {p.name}
          </li>
        ))}
      </ul>
    </nav>
  );
}
