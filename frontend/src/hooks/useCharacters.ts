import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../config";
import { useAuth } from "./useAuth";

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
  const { authHeaders } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCharacters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/characters`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        setCharacters(await res.json());
      }
    } catch {
      // network error — leave list empty
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  const importFromBlizzard = useCallback(async (): Promise<ImportableCharacter[]> => {
    try {
      const res = await fetch(`${API_BASE}/api/characters/import`, {
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {
      // fall through
    }
    return [];
  }, [authHeaders]);

  const createCharacter = useCallback(
    async (name: string, realm: string, professionId?: number | null) => {
      const res = await fetch(`${API_BASE}/api/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
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
    [authHeaders]
  );

  const deleteCharacter = useCallback(
    async (id: number) => {
      const res = await fetch(`${API_BASE}/api/characters/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete character");
      }
      setCharacters((prev) => prev.filter((c) => c.id !== id));
    },
    [authHeaders]
  );

  return {
    characters,
    loading,
    refresh: fetchCharacters,
    importFromBlizzard,
    createCharacter,
    deleteCharacter,
  };
}
