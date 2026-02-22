import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import type { Recipe } from "../hooks/useRecipes";
import "./RecipeTable.css";

interface RecipeTableProps {
  recipes: Recipe[];
}

function rarityClass(rarity: string | null): string {
  switch (rarity?.toLowerCase()) {
    case "uncommon":
      return "rarity-uncommon";
    case "rare":
      return "rarity-rare";
    case "epic":
      return "rarity-epic";
    case "legendary":
      return "rarity-legendary";
    default:
      return "rarity-common";
  }
}

function rarityBadgeClass(rarity: string | null): string {
  switch (rarity?.toLowerCase()) {
    case "uncommon":
      return "rarity-badge uncommon";
    case "rare":
      return "rarity-badge rare";
    case "epic":
      return "rarity-badge epic";
    case "legendary":
      return "rarity-badge legendary";
    default:
      return "rarity-badge";
  }
}

function rarityLabel(rarity: string | null): string {
  if (!rarity) return "Common";
  return rarity.charAt(0).toUpperCase() + rarity.slice(1).toLowerCase();
}

function CrafterCell({ crafters }: { crafters: Recipe["crafters"] }) {
  const [expanded, setExpanded] = useState(false);
  const VISIBLE_COUNT = 2;

  if (crafters.length === 0) {
    return <span className="recipe-table__none">—</span>;
  }

  const visible = expanded ? crafters : crafters.slice(0, VISIBLE_COUNT);
  const remaining = crafters.length - VISIBLE_COUNT;

  return (
    <span className="recipe-table__crafters">
      {visible.map((c, i) => (
        <span key={`${c.name}-${c.realm}`}>
          {i > 0 && ", "}
          {c.name}
        </span>
      ))}
      {!expanded && remaining > 0 && (
        <>
          {" "}
          <button
            className="recipe-table__crafter-more"
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

export default function RecipeTable({ recipes }: RecipeTableProps) {
  const { isLoggedIn } = useAuth();

  return (
    <div className="recipe-table-wrap">
      <table className="recipe-table">
        <thead>
          <tr>
            <th>Recipe</th>
            <th>Quality</th>
            <th>Crafters</th>
            {isLoggedIn && <th className="recipe-table__you">You</th>}
          </tr>
        </thead>
        <tbody>
          {recipes.map((recipe) => (
            <tr key={recipe.id}>
              <td data-label="Recipe" className="recipe-table__name">
                <span className={rarityClass(recipe.rarity)}>
                  {recipe.url ? (
                    <a href={recipe.url} target="_blank" rel="noopener noreferrer">
                      {recipe.name}
                    </a>
                  ) : (
                    recipe.name
                  )}
                </span>
              </td>
              <td data-label="Quality">
                <span className={rarityBadgeClass(recipe.rarity)}>
                  {rarityLabel(recipe.rarity)}
                </span>
              </td>
              <td data-label="Crafters">
                <CrafterCell crafters={recipe.crafters} />
              </td>
              {isLoggedIn && (
                <td data-label="You" className="recipe-table__you">
                  <input
                    type="checkbox"
                    disabled
                    title="Select a character first (coming soon)"
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
