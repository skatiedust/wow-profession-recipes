import { useEffect } from "react";
import { useCharacters, type Character } from "../hooks/useCharacters";
import "./CharacterSelector.css";

interface CharacterSelectorProps {
  selectedProfessionId: number | null;
  selectedCharacterId: number | null;
  onSelect: (id: number | null) => void;
}

export default function CharacterSelector({
  selectedProfessionId,
  selectedCharacterId,
  onSelect,
}: CharacterSelectorProps) {
  const { characters, loading } = useCharacters();

  const matching = characters.filter(
    (c) => c.profession_id === selectedProfessionId
  );

  const hasCharacters = characters.length > 0;
  const hasMatch = matching.length > 0;

  useEffect(() => {
    if (!hasMatch) {
      onSelect(null);
    } else if (
      selectedCharacterId === null ||
      !matching.some((c) => c.id === selectedCharacterId)
    ) {
      onSelect(matching[0].id);
    }
  }, [matching.length, hasMatch, selectedCharacterId, selectedProfessionId]);

  if (loading) return null;

  if (!hasCharacters) {
    return (
      <div className="character-selector">
        <span className="character-selector__mismatch">
          No characters saved. Add characters to mark recipes you know.
        </span>
      </div>
    );
  }

  if (!hasMatch) {
    return (
      <div className="character-selector">
        <span className="character-selector__mismatch">
          None of your characters have this profession assigned.
        </span>
      </div>
    );
  }

  function formatOption(c: Character): string {
    const prof = c.profession_name ? ` (${c.profession_name})` : "";
    return `${c.name} - ${c.realm}${prof}`;
  }

  return (
    <div className="character-selector">
      <label className="character-selector__label" htmlFor="char-select">
        Marking as:
      </label>
      <select
        id="char-select"
        value={selectedCharacterId ?? ""}
        onChange={(e) => onSelect(Number(e.target.value))}
      >
        {matching.map((c) => (
          <option key={c.id} value={c.id}>
            {formatOption(c)}
          </option>
        ))}
      </select>
    </div>
  );
}
