import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { API_BASE } from "../config";
import { useAuth } from "./useAuth";

export interface Character {
  id: number;
  name: string;
  realm: string;
  profession_id: number | null;
  profession_name: string | null;
}

export interface UniqueCharacter {
  name: string;
  realm: string;
  key: string;
}

export interface ImportableCharacter {
  name: string;
  realm: string;
}

function charKey(name: string, realm: string): string {
  return `${name.toLowerCase()}|${realm.toLowerCase()}`;
}

export function useCharacters() {
  const { authHeaders, isLoggedIn } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [guildCharacterKeys, setGuildCharacterKeys] = useState<Set<string>>(new Set());
  const autoImportedRef = useRef(false);

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
      // network error
    } finally {
      setLoading(false);
    }
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

  // Auto-import from Blizzard on first load after login
  useEffect(() => {
    if (!isLoggedIn || autoImportedRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        await fetchCharacters();

        const importRes = await fetch(`${API_BASE}/api/characters/import`, {
          headers: authHeaders(),
        });
        if (!importRes.ok) return;
        const blizzChars: { name: string; realm: string }[] =
          await importRes.json();
        if (!cancelled) {
          setGuildCharacterKeys(
            new Set(blizzChars.map((c) => charKey(c.name, c.realm)))
          );
        }
        if (cancelled || blizzChars.length === 0) return;

        // Refetch to get current state before dedup
        const currentRes = await fetch(`${API_BASE}/api/characters`, {
          headers: authHeaders(),
        });
        const current: Character[] = currentRes.ok
          ? await currentRes.json()
          : [];

        const existingKeys = new Set(
          current.map((c) => charKey(c.name, c.realm))
        );

        const toImport = blizzChars.filter(
          (c) => !existingKeys.has(charKey(c.name, c.realm))
        );

        for (const c of toImport) {
          if (cancelled) return;
          try {
            await createCharacter(c.name, c.realm, null);
          } catch {
            // skip duplicates or errors
          }
        }

        if (!cancelled) {
          autoImportedRef.current = true;
          await fetchCharacters();
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setGuildCharacterKeys(new Set());
      autoImportedRef.current = false;
    }
  }, [isLoggedIn]);

  const uniqueCharacters = useMemo<UniqueCharacter[]>(() => {
    const seen = new Map<string, UniqueCharacter>();
    for (const c of characters) {
      const k = charKey(c.name, c.realm);
      if (!guildCharacterKeys.has(k)) continue;
      if (!seen.has(k)) {
        seen.set(k, { name: c.name, realm: c.realm, key: k });
      }
    }
    return Array.from(seen.values());
  }, [characters, guildCharacterKeys]);

  const importFromBlizzard = useCallback(async (): Promise<
    ImportableCharacter[]
  > => {
    const res = await fetch(`${API_BASE}/api/characters/import`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to import characters");
    return res.json();
  }, [authHeaders]);

  const deleteCharacter = useCallback(
    async (id: number) => {
      const res = await fetch(`${API_BASE}/api/characters/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete character");
      setCharacters((prev) => prev.filter((c) => c.id !== id));
    },
    [authHeaders]
  );

  const ensureWithProfession = useCallback(
    async (
      name: string,
      realm: string,
      professionId: number
    ): Promise<Character> => {
      const existing = characters.find(
        (c) =>
          charKey(c.name, c.realm) === charKey(name, realm) &&
          c.profession_id === professionId
      );
      if (existing) return existing;

      return createCharacter(name, realm, professionId);
    },
    [characters, createCharacter]
  );

  return {
    characters,
    uniqueCharacters,
    loading,
    refresh: fetchCharacters,
    createCharacter,
    importFromBlizzard,
    deleteCharacter,
    ensureWithProfession,
  };
}
