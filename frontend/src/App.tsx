import { useState } from "react";
import { AuthProvider } from "./hooks/useAuth";
import AppShell from "./components/AppShell";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfessionId, setSelectedProfessionId] = useState<number | null>(null);

  return (
    <AuthProvider>
      <AppShell
        topBar={
          <TopBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        }
        sidebar={
          <Sidebar
            selectedId={selectedProfessionId}
            onSelect={setSelectedProfessionId}
          />
        }
      >
        {selectedProfessionId ? (
          <p style={{ color: "var(--color-text-secondary)" }}>
            Recipes for profession #{selectedProfessionId} will appear here.
          </p>
        ) : (
          <div className="app-main__empty">
            <p>Select a profession from the sidebar to browse recipes.</p>
          </div>
        )}
      </AppShell>
    </AuthProvider>
  );
}
