import { useState, useEffect } from "react";
import { API_BASE } from "../config";

export interface Profession {
  id: number;
  name: string;
  icon_url: string | null;
}

export function useProfessions() {
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE}/api/professions`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch professions");
        return res.json();
      })
      .then((data: Profession[]) => {
        if (!cancelled) setProfessions(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { professions, loading };
}
