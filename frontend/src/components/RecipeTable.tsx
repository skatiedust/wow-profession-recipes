import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import type { Recipe } from "../hooks/useRecipes";
import CrafterList from "./CrafterList";
import "./RecipeTable.css";

declare global {
  interface Window {
    $WowheadPower?: { refreshLinks: () => void };
  }
}

interface RecipeTableProps {
  recipes: Recipe[];
  knownMap?: Map<number, boolean>;
  onToggle?: (recipeId: number, known: boolean) => void;
}

function formatSource(recipe: Recipe): string {
  if (recipe.reputation_requirement) return recipe.reputation_requirement;
  const zone = recipe.zone ?? "";
  if (recipe.dropped_by && recipe.dropped_by.length > 0) {
    return `${zone} (${recipe.dropped_by.join(", ")})`;
  }
  return zone;
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

export default function RecipeTable({ recipes, knownMap, onToggle }: RecipeTableProps) {
  const { isLoggedIn } = useAuth();
  const canToggle = isLoggedIn && knownMap && onToggle;

  useEffect(() => {
    window.$WowheadPower?.refreshLinks();
  }, [recipes]);

  return (
    <div className="recipe-table-wrap">
      <table className="recipe-table">
        <thead>
          <tr>
            <th>Recipe</th>
            <th>Source</th>
            <th>Crafters</th>
            {isLoggedIn && <th className="recipe-table__you">You</th>}
          </tr>
        </thead>
        <tbody>
          {recipes.map((recipe) => {
            const known = knownMap?.get(recipe.id) ?? false;
            return (
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
                <td data-label="Source" className="recipe-table__source">
                  {formatSource(recipe)}
                </td>
                <td data-label="Crafters">
                  <CrafterList crafters={recipe.crafters} />
                </td>
                {isLoggedIn && (
                  <td data-label="You" className="recipe-table__you">
                    <input
                      type="checkbox"
                      checked={known}
                      disabled={!canToggle}
                      onChange={() => onToggle?.(recipe.id, !known)}
                      title={canToggle ? undefined : "Select a character first"}
                    />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
