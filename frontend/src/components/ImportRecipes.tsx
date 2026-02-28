import { useState, useCallback } from "react";
import "./ImportRecipes.css";
import { API_BASE, ADDON_DOWNLOAD_URL } from "../config";

export interface ImportResult {
  character_id: number;
  matched: number;
  matched_recipes: string[];
  skipped: number;
  unmatched: string[];
}

interface ImportPayload {
  character: string;
  realm: string;
  profession: string;
  recipes: string[];
}

function getString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function normalizeRecipes(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const normalized = value
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (entry && typeof entry === "object") {
        const maybeName = (entry as Record<string, unknown>).name;
        if (typeof maybeName === "string") return maybeName.trim();
      }
      return null;
    })
    .filter((entry): entry is string => Boolean(entry));

  return normalized.length === value.length ? normalized : null;
}

function normalizeAddonExport(parsed: unknown): ImportPayload | null {
  const source =
    parsed && typeof parsed === "object" && "data" in parsed
      ? (parsed as { data: unknown }).data
      : parsed;

  if (!source || typeof source !== "object" || Array.isArray(source)) return null;

  const obj = source as Record<string, unknown>;

  const character = getString(obj, ["character", "character_name", "characterName"]);
  const realm = getString(obj, ["realm", "realm_name", "realmName"]);
  const profession = getString(obj, ["profession", "profession_name", "professionName"]);
  const recipes =
    normalizeRecipes(obj.recipes) ??
    normalizeRecipes(obj.recipe_names) ??
    normalizeRecipes(obj.knownRecipes);

  if (!character || !realm || !profession || !recipes) return null;

  return { character, realm, profession, recipes };
}

interface ImportRecipesProps {
  isOpen: boolean;
  onClose: () => void;
  authHeaders: () => Record<string, string>;
  onSuccess?: () => void;
}

export default function ImportRecipes({
  isOpen,
  onClose,
  authHeaders,
  onSuccess,
}: ImportRecipesProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const validateJson = useCallback(
    (text: string): ImportPayload | null => {
      try {
        const parsed = JSON.parse(text);
        return normalizeAddonExport(parsed);
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
      const res = await fetch(`${API_BASE}/api/recipes/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
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
  }, [jsonInput, validateJson, authHeaders, onSuccess]);

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
        {ADDON_DOWNLOAD_URL && (
          <div className="import-recipes__download">
            <a
              className="import-recipes__download-link"
              href={ADDON_DOWNLOAD_URL}
              target="_blank"
              rel="noreferrer"
            >
              Download Addon
            </a>
          </div>
        )}

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
            </p>
            {result.matched_recipes.length > 0 && (
              <ul className="import-recipes__unmatched">
                {result.matched_recipes.map((name, i) => (
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
