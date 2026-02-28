import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE } from "../config";
import { useAuth } from "./useAuth";

export function useChecklist(characterId: number | null) {
  const { authHeaders } = useAuth();
  const [knownMap, setKnownMap] = useState<Map<number, boolean>>(new Map());
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const activeCharRef = useRef(characterId);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    activeCharRef.current = characterId;

    if (characterId == null) {
      setKnownMap(new Map());
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`${API_BASE}/api/recipes/checklist?character_id=${characterId}`, {
      headers: authHeaders(),
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: { id: number; known: boolean }[]) => {
        if (cancelled) return;
        const map = new Map<number, boolean>();
        for (const row of rows) {
          map.set(row.id, row.known);
        }
        setKnownMap(map);
      })
      .catch(() => {
        if (!cancelled) setKnownMap(new Map());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [characterId, authHeaders, refreshKey]);

  const toggleRecipe = useCallback(
    async (recipeId: number, known: boolean) => {
      const charId = activeCharRef.current;
      if (charId == null) return;

      setKnownMap((prev) => {
        const next = new Map(prev);
        next.set(recipeId, known);
        return next;
      });

      try {
        const res = await fetch(`${API_BASE}/api/recipes/checklist`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            character_id: charId,
            recipe_id: recipeId,
            known,
          }),
        });

        if (!res.ok) throw new Error("Toggle failed");
      } catch {
        setKnownMap((prev) => {
          const reverted = new Map(prev);
          reverted.set(recipeId, !known);
          return reverted;
        });
      }
    },
    [authHeaders]
  );

  return { knownMap, loading: loading, toggleRecipe, refresh };
}
