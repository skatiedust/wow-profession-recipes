import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../config";

export interface Character {
  id: number;
  name: string;
  realm: string;
  profession_id: number | null;
  profession_name: string | null;
}

export interface ImportableCharacter {
  name: string;
  realm: string;
}

export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCharacters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/characters`, { credentials: "include" });
      if (res.ok) {
        setCharacters(await res.json());
      }
    } catch {
      // network error — leave list empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  const importFromBlizzard = useCallback(async (): Promise<ImportableCharacter[]> => {
    try {
      const res = await fetch(`${API_BASE}/api/characters/import`, { credentials: "include" });
      if (res.ok) return await res.json();
    } catch {
      // fall through
    }
    return [];
  }, []);

  const createCharacter = useCallback(
    async (name: string, realm: string, professionId?: number | null) => {
      const res = await fetch(`${API_BASE}/api/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          realm,
          profession_id: professionId ?? null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create character");
      }
      const created: Character = await res.json();
      setCharacters((prev) => [...prev, created]);
      return created;
    },
    []
  );

  const deleteCharacter = useCallback(async (id: number) => {
    const res = await fetch(`${API_BASE}/api/characters/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to delete character");
    }
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    characters,
    loading,
    refresh: fetchCharacters,
    importFromBlizzard,
    createCharacter,
    deleteCharacter,
  };
}
