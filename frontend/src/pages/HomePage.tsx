import { useAuth } from "../hooks/useAuth";
import LoginButton from "../components/LoginButton";
import CharacterManager from "../components/CharacterManager";

export default function HomePage() {
  const { isLoggedIn, loading } = useAuth();

  return (
    <div>
      <h1>WoW Guild Recipes</h1>
      <LoginButton />

      {loading && <p>Loading...</p>}

      {!loading && !isLoggedIn && (
        <p>Log in with Battle.net to manage your characters.</p>
      )}

      {!loading && isLoggedIn && <CharacterManager />}
    </div>
  );
}
