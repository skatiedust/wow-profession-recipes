import { useState, type FormEvent } from "react";
import {
  useCharacters,
  type ImportableCharacter,
} from "../hooks/useCharacters";

export default function CharacterManager() {
  const {
    characters,
    loading,
    importFromBlizzard,
    createCharacter,
    deleteCharacter,
  } = useCharacters();

  const [name, setName] = useState("");
  const [realm, setRealm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [importList, setImportList] = useState<ImportableCharacter[]>([]);
  const [importing, setImporting] = useState(false);
  const [showImport, setShowImport] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createCharacter(name.trim(), realm.trim());
      setName("");
      setRealm("");
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
    <div>
      <h2>My Characters</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {characters.length === 0 ? (
        <p>No characters saved yet.</p>
      ) : (
        <ul>
          {characters.map((c) => (
            <li key={c.id}>
              {c.name} - {c.realm}
              {c.profession_name && ` (${c.profession_name})`}
              {" "}
              <button onClick={() => handleDelete(c.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      <h3>Add Character</h3>
      <form onSubmit={handleAdd}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {" "}
        <input
          placeholder="Realm"
          value={realm}
          onChange={(e) => setRealm(e.target.value)}
          required
        />
        {" "}
        <button type="submit">Add</button>
      </form>

      <h3>Import from Battle.net</h3>
      <button onClick={handleImport} disabled={importing}>
        {importing ? "Importing..." : "Import Characters"}
      </button>

      {showImport && importList.length === 0 && (
        <p>No characters found to import.</p>
      )}

      {showImport && importList.length > 0 && (
        <ul>
          {importList.map((c) => (
            <li key={`${c.name}-${c.realm}`}>
              {c.name} - {c.realm}
              {" "}
              <button onClick={() => handleSaveImported(c)}>Save</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
