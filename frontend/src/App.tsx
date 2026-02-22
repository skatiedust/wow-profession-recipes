import { useState } from "react";
import { AuthProvider } from "./hooks/useAuth";
import AppShell from "./components/AppShell";
import TopBar from "./components/TopBar";

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AuthProvider>
      <AppShell
        topBar={
          <TopBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        }
      >
        <div className="app-main__empty">
          <p>Select a profession from the sidebar to browse recipes.</p>
        </div>
      </AppShell>
    </AuthProvider>
  );
}
