import { useState } from "react";
import { AuthProvider } from "./hooks/useAuth";
import { useRecipes } from "./hooks/useRecipes";
import AppShell from "./components/AppShell";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfessionId, setSelectedProfessionId] = useState<number | null>(null);
  const { recipes, loading } = useRecipes(selectedProfessionId, searchQuery);

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
          loading ? (
            <p style={{ color: "var(--color-text-secondary)" }}>Loading recipes…</p>
          ) : recipes.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)" }}>
              {searchQuery ? "No recipes match your search." : "No recipes found for this profession."}
            </p>
          ) : (
            <p style={{ color: "var(--color-text-secondary)" }}>
              {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} loaded. RecipeTable coming in 7.6.
            </p>
          )
        ) : (
          <div className="app-main__empty">
            <p>Select a profession from the sidebar to browse recipes.</p>
          </div>
        )}
      </AppShell>
    </AuthProvider>
  );
}
