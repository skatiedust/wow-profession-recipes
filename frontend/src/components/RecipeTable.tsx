import { useAuth } from "../hooks/useAuth";
import type { Recipe } from "../hooks/useRecipes";
import CrafterList from "./CrafterList";
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
                <CrafterList crafters={recipe.crafters} />
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
