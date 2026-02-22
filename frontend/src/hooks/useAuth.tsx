import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { API_BASE } from "../config";

interface User {
  id: number;
  battleTag: string;
}

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  authHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function extractTokenFromHash(): string | null {
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.slice(1));
  const token = params.get("access_token");
  if (token) {
    window.history.replaceState(null, "", window.location.pathname);
  }
  return token;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    const hashToken = extractTokenFromHash();
    const stored = hashToken || sessionStorage.getItem("access_token");

    if (!stored) {
      setLoading(false);
      return;
    }

    tokenRef.current = stored;
    if (hashToken) {
      sessionStorage.setItem("access_token", hashToken);
    }

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((res) => {
        if (res.ok) return res.json();
        sessionStorage.removeItem("access_token");
        tokenRef.current = null;
        return null;
      })
      .then((data) => {
        if (data?.id) setUser(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(() => {
    window.location.href = `${API_BASE}/api/auth/login`;
  }, []);

  const logout = useCallback(async () => {
    sessionStorage.removeItem("access_token");
    tokenRef.current = null;
    setUser(null);
  }, []);

  const authHeaders = useCallback((): Record<string, string> => {
    const token = tokenRef.current;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: user !== null, loading, login, logout, authHeaders }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
