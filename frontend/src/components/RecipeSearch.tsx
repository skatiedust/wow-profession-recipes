import { useState, useEffect, useRef } from "react";
import "./RecipeSearch.css";

interface RecipeSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  knownOnly?: boolean;
  onKnownOnlyChange?: (value: boolean) => void;
  showKnownFilter?: boolean;
}

const DEBOUNCE_MS = 250;

export default function RecipeSearch({
  searchQuery,
  onSearchChange,
  knownOnly,
  onKnownOnlyChange,
  showKnownFilter,
}: RecipeSearchProps) {
  const [localValue, setLocalValue] = useState(searchQuery);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(searchQuery);
  }, [searchQuery]);

  function handleChange(value: string) {
    setLocalValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearchChange(value);
    }, DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="recipe-search">
      <div className="recipe-search__field">
        <span className="recipe-search__icon" aria-hidden="true">&#x1F50D;</span>
        <input
          className="recipe-search__input"
          type="search"
          placeholder="Search recipes"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          aria-label="Search recipes"
        />
      </div>
      {showKnownFilter && (
        <label className="recipe-search__filter">
          <input
            type="checkbox"
            checked={knownOnly ?? false}
            onChange={(e) => onKnownOnlyChange?.(e.target.checked)}
          />
          Known only
        </label>
      )}
    </div>
  );
}
