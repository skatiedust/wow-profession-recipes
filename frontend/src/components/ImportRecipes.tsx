import { useState, useCallback } from "react";
import "./ImportRecipes.css";

export interface ImportResult {
  character_id: number;
  matched: number;
  skipped: number;
  unmatched: string[];
}

interface ImportRecipesProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ImportRecipes({
  isOpen,
  onClose,
  onSuccess,
}: ImportRecipesProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const validateJson = useCallback(
    (text: string): { character: string; realm: string; profession: string; recipes: string[] } | null => {
      try {
        const parsed = JSON.parse(text);
        if (
          typeof parsed.character !== "string" ||
          typeof parsed.realm !== "string" ||
          typeof parsed.profession !== "string" ||
          !Array.isArray(parsed.recipes)
        ) {
          return null;
        }
        if (!parsed.recipes.every((r: unknown) => typeof r === "string")) {
          return null;
        }
        return parsed;
      } catch {
        return null;
      }
    },
    []
  );

  const handleImport = useCallback(async () => {
    setError(null);
    setResult(null);

    const validated = validateJson(jsonInput);
    if (!validated) {
      setError("Invalid JSON. Expected: { character, realm, profession, recipes }");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validated),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
        return;
      }

      setResult(data);
      setJsonInput("");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }, [jsonInput, validateJson, onSuccess]);

  const handleClose = useCallback(() => {
    setJsonInput("");
    setError(null);
    setResult(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="import-recipes-overlay" onClick={handleClose}>
      <div
        className="import-recipes-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="import-recipes__header">
          <h2>Import from Addon</h2>
          <button
            className="import-recipes__close"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="import-recipes__instructions">
          Use the ProfessionExporter addon in-game: open your profession window,
          type <code>/exportrecipes</code>, then copy the JSON (Ctrl+A, Ctrl+C)
          and paste it below.
        </p>

        <textarea
          className="import-recipes__textarea"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='{"character":"Name","realm":"Realm","profession":"Alchemy","recipes":["Recipe 1","Recipe 2"]}'
          rows={8}
          disabled={loading}
        />

        {error && <p className="import-recipes__error">{error}</p>}

        {result && (
          <div className="import-recipes__result">
            <p>
              Matched: {result.matched} · Skipped: {result.skipped}
              {result.unmatched.length > 0 &&
                ` · Unmatched: ${result.unmatched.length}`}
            </p>
            {result.unmatched.length > 0 && (
              <ul className="import-recipes__unmatched">
                {result.unmatched.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="import-recipes__actions">
          <button
            className="import-recipes__import"
            onClick={handleImport}
            disabled={loading || !jsonInput.trim()}
          >
            {loading ? "Importing…" : "Import"}
          </button>
          <button className="import-recipes__cancel" onClick={handleClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
