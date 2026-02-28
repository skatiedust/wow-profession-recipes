import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useRecipes } from "./hooks/useRecipes";
import { useChecklist } from "./hooks/useChecklist";
import { useCharacters } from "./hooks/useCharacters";
import { useToast } from "./hooks/useToast";
import AppShell from "./components/AppShell";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import RecipeTable from "./components/RecipeTable";
import Toast from "./components/Toast";
import RecipeSearch from "./components/RecipeSearch";
import ImportRecipes from "./components/ImportRecipes";

function MainContent() {
  const { isLoggedIn, authHeaders } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [knownOnly, setKnownOnly] = useState(false);
  const [selectedProfessionId, setSelectedProfessionId] = useState<number | null>(null);
  const [selectedCharacterKey, setSelectedCharacterKey] = useState<string | null>(null);
  const [resolvedCharacterId, setResolvedCharacterId] = useState<number | null>(null);
  const { recipes, loading, refresh: refreshRecipes } = useRecipes(selectedProfessionId, searchQuery);
  const { uniqueCharacters, characters, ensureWithProfession, refresh: refreshCharacters } = useCharacters();
  const { knownMap, toggleRecipe, refresh: refreshChecklist } = useChecklist(
    isLoggedIn ? resolvedCharacterId : null
  );
  const toast = useToast();
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImportSuccess = useCallback(() => {
    refreshCharacters();
    refreshRecipes();
    refreshChecklist();
  }, [refreshCharacters, refreshRecipes, refreshChecklist]);

  const handleToggle = useCallback(
    (recipeId: number, known: boolean) => {
      toggleRecipe(recipeId, known);
      toast.show(known ? "Recipe added to your profile." : "Recipe removed from your profile.");
    },
    [toggleRecipe, toast]
  );

  const hasChecklist = isLoggedIn && !!resolvedCharacterId && !!knownMap;

  const filteredRecipes = useMemo(() => {
    if (!knownOnly || !knownMap) return recipes;
    return recipes.filter((r) => knownMap.get(r.id));
  }, [recipes, knownOnly, knownMap]);

  // Auto-select first character when they load
  const autoSelectedRef = useRef(false);
  useEffect(() => {
    if (uniqueCharacters.length > 0 && !selectedCharacterKey && !autoSelectedRef.current) {
      setSelectedCharacterKey(uniqueCharacters[0].key);
      autoSelectedRef.current = true;
    }
  }, [uniqueCharacters, selectedCharacterKey]);

  // Reset known-only filter when character changes
  useEffect(() => {
    setKnownOnly(false);
  }, [selectedCharacterKey]);

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
          characters={isLoggedIn ? uniqueCharacters : undefined}
          selectedCharacterKey={selectedCharacterKey}
          onSelectCharacter={setSelectedCharacterKey}
          hasProfessionSelected={!!selectedProfessionId}
          onTitleClick={() => {
            setSelectedProfessionId(null);
            setSearchQuery("");
            setKnownOnly(false);
          }}
        />
      }
      sidebar={
        <Sidebar
          selectedId={selectedProfessionId}
          onSelect={(id) => {
            setSelectedProfessionId(id);
            setSearchQuery("");
            setKnownOnly(false);
          }}
        />
      }
    >
      {selectedProfessionId ? (
        <>
          <RecipeSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            knownOnly={knownOnly}
            onKnownOnlyChange={setKnownOnly}
            showKnownFilter={hasChecklist}
          />
          {loading ? (
            <p style={{ color: "var(--color-text-secondary)" }}>Loading recipes…</p>
          ) : filteredRecipes.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)" }}>
              {knownOnly
                ? "No known recipes match."
                : searchQuery
                  ? "No recipes match your search."
                  : "No recipes found for this profession."}
            </p>
          ) : (
            <RecipeTable
              recipes={filteredRecipes}
              knownMap={resolvedCharacterId ? knownMap : undefined}
              onToggle={resolvedCharacterId ? handleToggle : undefined}
            />
          )}
        </>
      ) : (
        <div className="app-main__empty app-main__home">
          {!isLoggedIn ? (
            <>
              <p className="app-main__home-title">Browse Guild Recipes</p>
              <p>
                Select a profession from the sidebar to browse recipes and see
                who can craft them.
              </p>
              <p className="app-main__home-hint">
                Log in with Battle.net to track your own recipes and import from
                the ProfessionExporter addon.
              </p>
            </>
          ) : (
            <>
              <p className="app-main__home-title">Import or Browse Recipes</p>
              <p>
                Install the ProfessionExporter addon in WoW, open your profession
                window, type <code>/exportrecipes</code>, then copy the JSON
                (Ctrl+A, Ctrl+C) and paste it below.
              </p>
              <button
                className="app-main__import-btn"
                onClick={() => setShowImportModal(true)}
              >
                Import from Addon
              </button>
              <p className="app-main__home-hint">
                Or select a profession from the sidebar to browse and toggle
                recipes manually.
              </p>
            </>
          )}
        </div>
      )}
      <ImportRecipes
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        authHeaders={authHeaders}
        onSuccess={handleImportSuccess}
      />
      <Toast message={toast.message} visible={toast.visible} />
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
