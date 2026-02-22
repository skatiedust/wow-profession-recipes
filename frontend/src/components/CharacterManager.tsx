import { useState, type FormEvent } from "react";
import {
  useCharacters,
  type ImportableCharacter,
} from "../hooks/useCharacters";
import { useProfessions } from "../hooks/useProfessions";
import "./CharacterManager.css";

interface CharacterManagerProps {
  onClose: () => void;
}

export default function CharacterManager({ onClose }: CharacterManagerProps) {
  const {
    characters,
    loading,
    importFromBlizzard,
    createCharacter,
    deleteCharacter,
  } = useCharacters();
  const { professions } = useProfessions();

  const [name, setName] = useState("");
  const [realm, setRealm] = useState("");
  const [professionId, setProfessionId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  const [importList, setImportList] = useState<ImportableCharacter[]>([]);
  const [importing, setImporting] = useState(false);
  const [showImport, setShowImport] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createCharacter(
        name.trim(),
        realm.trim(),
        professionId || null
      );
      setName("");
      setRealm("");
      setProfessionId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add character");
    }
  }

  async function handleImport() {
    setImporting(true);
    setError(null);
    try {
      const list = await importFromBlizzard();
      setImportList(list);
      setShowImport(true);
    } catch {
      setError("Failed to import characters");
    } finally {
      setImporting(false);
    }
  }

  async function handleSaveImported(char: ImportableCharacter) {
    setError(null);
    try {
      await createCharacter(char.name, char.realm);
      setImportList((prev) =>
        prev.filter((c) => !(c.name === char.name && c.realm === char.realm))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save character");
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    try {
      await deleteCharacter(id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete character"
      );
    }
  }

  if (loading) return <p>Loading characters...</p>;

  return (
    <div className="char-manager">
      <div className="char-manager__header">
        <h2 className="char-manager__title">My Characters</h2>
        <button className="char-manager__close" onClick={onClose}>
          &times;
        </button>
      </div>

      {error && <p className="char-manager__error">{error}</p>}

      {characters.length === 0 ? (
        <p className="char-manager__empty">
          No characters saved yet. Add one below to start tracking recipes.
        </p>
      ) : (
        <ul className="char-manager__list">
          {characters.map((c) => (
            <li key={c.id} className="char-manager__item">
              <span>
                <strong>{c.name}</strong> - {c.realm}
                {c.profession_name && (
                  <span className="char-manager__prof"> ({c.profession_name})</span>
                )}
              </span>
              <button
                className="char-manager__delete"
                onClick={() => handleDelete(c.id)}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="char-manager__subtitle">Add Character</h3>
      <form className="char-manager__form" onSubmit={handleAdd}>
        <input
          placeholder="Character name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          placeholder="Realm"
          value={realm}
          onChange={(e) => setRealm(e.target.value)}
          required
        />
        <select
          value={professionId}
          onChange={(e) =>
            setProfessionId(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">No profession</option>
          {professions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button type="submit">Add</button>
      </form>

      <h3 className="char-manager__subtitle">Import from Battle.net</h3>
      <button onClick={handleImport} disabled={importing}>
        {importing ? "Importing..." : "Import Characters"}
      </button>

      {showImport && importList.length === 0 && (
        <p className="char-manager__empty">No characters found to import.</p>
      )}

      {showImport && importList.length > 0 && (
        <ul className="char-manager__list">
          {importList.map((c) => (
            <li key={`${c.name}-${c.realm}`} className="char-manager__item">
              <span>
                <strong>{c.name}</strong> - {c.realm}
              </span>
              <button onClick={() => handleSaveImported(c)}>Save</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
