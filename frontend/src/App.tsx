import { useState, useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useRecipes } from "./hooks/useRecipes";
import { useChecklist } from "./hooks/useChecklist";
import { useCharacters } from "./hooks/useCharacters";
import AppShell from "./components/AppShell";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import RecipeTable from "./components/RecipeTable";

function MainContent() {
  const { isLoggedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfessionId, setSelectedProfessionId] = useState<number | null>(null);
  const [selectedCharacterKey, setSelectedCharacterKey] = useState<string | null>(null);
  const [resolvedCharacterId, setResolvedCharacterId] = useState<number | null>(null);
  const { recipes, loading } = useRecipes(selectedProfessionId, searchQuery);
  const { uniqueCharacters, characters, ensureWithProfession } = useCharacters();
  const { knownMap, toggleRecipe } = useChecklist(
    isLoggedIn ? resolvedCharacterId : null
  );

  // Auto-select first character when they load
  const autoSelectedRef = useRef(false);
  useEffect(() => {
    if (uniqueCharacters.length > 0 && !selectedCharacterKey && !autoSelectedRef.current) {
      setSelectedCharacterKey(uniqueCharacters[0].key);
      autoSelectedRef.current = true;
    }
  }, [uniqueCharacters, selectedCharacterKey]);

  // Clear character selection on logout
  useEffect(() => {
    if (!isLoggedIn) {
      setSelectedCharacterKey(null);
      setResolvedCharacterId(null);
      autoSelectedRef.current = false;
    }
  }, [isLoggedIn]);

  // Resolve character+profession combo for checklist
  useEffect(() => {
    if (!selectedCharacterKey || !selectedProfessionId || !isLoggedIn) {
      setResolvedCharacterId(null);
      return;
    }

    const selected = uniqueCharacters.find((c) => c.key === selectedCharacterKey);
    if (!selected) {
      setResolvedCharacterId(null);
      return;
    }

    // Check if a character+profession row already exists
    const existing = characters.find(
      (c) =>
        c.name.toLowerCase() === selected.name.toLowerCase() &&
        c.realm.toLowerCase() === selected.realm.toLowerCase() &&
        c.profession_id === selectedProfessionId
    );

    if (existing) {
      setResolvedCharacterId(existing.id);
      return;
    }

    // Create the character+profession row
    let cancelled = false;
    ensureWithProfession(selected.name, selected.realm, selectedProfessionId)
      .then((char) => {
        if (!cancelled) setResolvedCharacterId(char.id);
      })
      .catch(() => {
        if (!cancelled) setResolvedCharacterId(null);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCharacterKey, selectedProfessionId, isLoggedIn, characters, uniqueCharacters, ensureWithProfession]);

  return (
    <AppShell
      topBar={
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          characters={isLoggedIn ? uniqueCharacters : undefined}
          selectedCharacterKey={selectedCharacterKey}
          onSelectCharacter={setSelectedCharacterKey}
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
          <RecipeTable
            recipes={recipes}
            knownMap={resolvedCharacterId ? knownMap : undefined}
            onToggle={resolvedCharacterId ? toggleRecipe : undefined}
          />
        )
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
