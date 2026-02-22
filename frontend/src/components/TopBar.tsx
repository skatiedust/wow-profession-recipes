import { useAuth } from "../hooks/useAuth";
import type { UniqueCharacter } from "../hooks/useCharacters";
import "./TopBar.css";

interface TopBarProps {
  characters?: UniqueCharacter[];
  selectedCharacterKey?: string | null;
  onSelectCharacter?: (key: string | null) => void;
}

export default function TopBar({
  characters,
  selectedCharacterKey,
  onSelectCharacter,
}: TopBarProps) {
  const { user, isLoggedIn, loading, login, logout } = useAuth();

  return (
    <div className="topbar">
      <h1 className="topbar__title">Guild Recipes</h1>

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
