import { useAuth } from "../hooks/useAuth";

export default function LoginButton() {
  const { user, isLoggedIn, loading, login, logout } = useAuth();

  if (loading) return null;

  if (!isLoggedIn) {
    return <button onClick={login}>Login with Battle.net</button>;
  }

  return (
    <span>
      {user!.battleTag}{" "}
      <button onClick={logout}>Logout</button>
    </span>
  );
}
