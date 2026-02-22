import { useState, useEffect, useMemo } from "react";
import { API_BASE } from "../config";

export interface Crafter {
  name: string;
  realm: string;
}

export interface Recipe {
  id: number;
  name: string;
  source: string;
  zone: string | null;
  reputation_requirement: string | null;
  dropped_by: string[] | null;
  url: string | null;
  rarity: string | null;
  crafters: Crafter[];
}

export function useRecipes(professionId: number | null, searchQuery: string) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (professionId == null) {
      setRecipes([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`${API_BASE}/api/recipes?profession_id=${professionId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Recipe[]) => {
        if (!cancelled) setRecipes(data);
      })
      .catch(() => {
        if (!cancelled) setRecipes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [professionId]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipes, searchQuery]);

  return { recipes: filtered, allRecipes: recipes, loading };
}
