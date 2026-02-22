import { AuthProvider } from "./hooks/useAuth";
import AppShell from "./components/AppShell";
import LoginButton from "./components/LoginButton";

export default function App() {
  return (
    <AuthProvider>
      <AppShell
        topBarRight={<LoginButton />}
      >
        <div className="app-main__empty">
          <p>Select a profession from the sidebar to browse recipes.</p>
        </div>
      </AppShell>
    </AuthProvider>
  );
}
