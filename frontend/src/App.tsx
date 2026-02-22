import { useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useRecipes } from "./hooks/useRecipes";
import AppShell from "./components/AppShell";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import RecipeTable from "./components/RecipeTable";
import CharacterSelector from "./components/CharacterSelector";

function MainContent() {
  const { isLoggedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfessionId, setSelectedProfessionId] = useState<number | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const { recipes, loading } = useRecipes(selectedProfessionId, searchQuery);

  return (
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
        <>
          {isLoggedIn && (
            <CharacterSelector
              selectedProfessionId={selectedProfessionId}
              selectedCharacterId={selectedCharacterId}
              onSelect={setSelectedCharacterId}
            />
          )}
          {loading ? (
            <p style={{ color: "var(--color-text-secondary)" }}>Loading recipes…</p>
          ) : recipes.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)" }}>
              {searchQuery ? "No recipes match your search." : "No recipes found for this profession."}
            </p>
          ) : (
            <RecipeTable recipes={recipes} />
          )}
        </>
      ) : (
        <div className="app-main__empty">
          <p>Select a profession from the sidebar to browse recipes.</p>
        </div>
      )}
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
