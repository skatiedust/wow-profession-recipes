import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import type { UniqueCharacter } from "../hooks/useCharacters";
import "./TopBar.css";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  characters?: UniqueCharacter[];
  selectedCharacterKey?: string | null;
  onSelectCharacter?: (key: string | null) => void;
}

const DEBOUNCE_MS = 250;

export default function TopBar({
  searchQuery,
  onSearchChange,
  characters,
  selectedCharacterKey,
  onSelectCharacter,
}: TopBarProps) {
  const { user, isLoggedIn, loading, login, logout } = useAuth();
  const [localValue, setLocalValue] = useState(searchQuery);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(searchQuery);
  }, [searchQuery]);

  function handleChange(value: string) {
    setLocalValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearchChange(value);
    }, DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="topbar">
      <h1 className="topbar__title">Guild Recipes</h1>

      <div className="topbar__search">
        <span className="topbar__search-icon" aria-hidden="true">&#x1F50D;</span>
        <input
          className="topbar__search-input"
          type="search"
          placeholder="Search recipes\u2026"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          aria-label="Search recipes"
        />
      </div>

      <div className="topbar__actions">
        {!loading && !isLoggedIn && (
          <button className="topbar__login" onClick={login}>
            Login with Battle.net
          </button>
        )}
        {!loading && isLoggedIn && (
          <div className="topbar__user">
            {characters && characters.length > 0 && onSelectCharacter && (
              <select
                className="topbar__char-select"
                value={selectedCharacterKey ?? ""}
                onChange={(e) =>
                  onSelectCharacter(e.target.value || null)
                }
                aria-label="Select character"
              >
                <option value="">No character</option>
                {characters.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name} - {c.realm}
                  </option>
                ))}
              </select>
            )}
            <span className="topbar__battletag">{user!.battleTag}</span>
            <button className="topbar__logout" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
