import { Router, Request, Response } from "express";
import { query } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const professionId = parseInt(req.query.profession_id as string, 10);
  if (isNaN(professionId)) {
    res.status(400).json({ error: "profession_id query parameter is required" });
    return;
  }

  const result = await query<{
    id: number;
    name: string;
    source: string;
    zone: string | null;
    reputation_requirement: string | null;
    dropped_by: string[] | null;
    url: string | null;
    rarity: string | null;
    crafters: { name: string; realm: string }[];
  }>(
    `SELECT
       r.id, r.name, r.source, r.zone, r.reputation_requirement,
       r.dropped_by, r.url, r.rarity,
       COALESCE(
         json_agg(json_build_object('name', c.name, 'realm', c.realm))
           FILTER (WHERE c.id IS NOT NULL),
         '[]'
       ) AS crafters
     FROM recipes r
     LEFT JOIN character_recipes cr ON cr.recipe_id = r.id
     LEFT JOIN characters c ON c.id = cr.character_id
     WHERE r.profession_id = $1 AND r.deleted_at IS NULL
     GROUP BY r.id
     ORDER BY r.name`,
    [professionId]
  );

  res.json(result.rows);
});

router.get("/checklist", requireAuth, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const characterId = parseInt(req.query.character_id as string, 10);
  if (isNaN(characterId)) {
    res.status(400).json({ error: "character_id query parameter is required" });
    return;
  }

  const charResult = await query<{ id: number; profession_id: number | null }>(
    "SELECT id, profession_id FROM characters WHERE id = $1 AND user_id = $2",
    [characterId, user.id]
  );

  if (charResult.rows.length === 0) {
    res.status(404).json({ error: "Character not found" });
    return;
  }

  const character = charResult.rows[0];
  if (!character.profession_id) {
    res.status(400).json({ error: "Character has no profession assigned" });
    return;
  }

  const result = await query<{
    id: number;
    name: string;
    source: string;
    zone: string | null;
    reputation_requirement: string | null;
    dropped_by: string[] | null;
    url: string | null;
    rarity: string | null;
    known: boolean;
  }>(
    `SELECT
       r.id, r.name, r.source, r.zone, r.reputation_requirement,
       r.dropped_by, r.url, r.rarity,
       (cr.character_id IS NOT NULL) AS known
     FROM recipes r
     LEFT JOIN character_recipes cr
       ON cr.recipe_id = r.id AND cr.character_id = $1
     WHERE r.profession_id = $2 AND r.deleted_at IS NULL
     ORDER BY r.name`,
    [characterId, character.profession_id]
  );

  res.json(result.rows);
});

router.post("/checklist", requireAuth, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { character_id, recipe_id, known } = req.body;

  if (!character_id || !recipe_id || typeof known !== "boolean") {
    res
      .status(400)
      .json({ error: "character_id, recipe_id, and known (boolean) are required" });
    return;
  }

  const charResult = await query<{ id: number }>(
    "SELECT id FROM characters WHERE id = $1 AND user_id = $2",
    [character_id, user.id]
  );

  if (charResult.rows.length === 0) {
    res.status(404).json({ error: "Character not found" });
    return;
  }

  if (known) {
    await query(
      `INSERT INTO character_recipes (character_id, recipe_id)
       VALUES ($1, $2)
       ON CONFLICT (character_id, recipe_id) DO NOTHING`,
      [character_id, recipe_id]
    );
  } else {
    await query(
      "DELETE FROM character_recipes WHERE character_id = $1 AND recipe_id = $2",
      [character_id, recipe_id]
    );
  }

  res.json({ success: true });
});

const RECIPE_PREFIXES = [
  "Recipe: ",
  "Plans: ",
  "Formula: ",
  "Schematic: ",
  "Design: ",
  "Pattern: ",
];

function stripRecipePrefix(name: string): string {
  const trimmed = name.trim();
  for (const prefix of RECIPE_PREFIXES) {
    if (trimmed.toLowerCase().startsWith(prefix.toLowerCase())) {
      return trimmed.slice(prefix.length).trim();
    }
  }
  return trimmed;
}

router.post("/import", requireAuth, async (req: Request, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { character, realm, profession, recipes } = req.body;

  if (
    typeof character !== "string" ||
    typeof realm !== "string" ||
    typeof profession !== "string" ||
    !Array.isArray(recipes)
  ) {
    res.status(400).json({
      error: "Invalid body: character, realm, and profession must be strings; recipes must be an array of strings",
    });
    return;
  }

  if (!recipes.every((r: unknown) => typeof r === "string")) {
    res.status(400).json({ error: "recipes must contain only strings" });
    return;
  }

  const professionResult = await query<{ id: number }>(
    "SELECT id FROM professions WHERE LOWER(name) = LOWER($1)",
    [profession]
  );

  if (professionResult.rows.length === 0) {
    res.status(400).json({ error: `Unknown profession: ${profession}` });
    return;
  }

  const professionId = professionResult.rows[0].id;

  const charResult = await query<{ id: number }>(
    `SELECT id FROM characters
     WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND LOWER(realm) = LOWER($3) AND profession_id = $4`,
    [user.id, character.trim(), realm.trim(), professionId]
  );

  let characterId: number;

  if (charResult.rows.length > 0) {
    characterId = charResult.rows[0].id;
  } else {
    const insertResult = await query<{ id: number }>(
      `INSERT INTO characters (user_id, name, realm, profession_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [user.id, character.trim(), realm.trim(), professionId]
    );
    characterId = insertResult.rows[0].id;
  }

  const recipeRows = await query<{ id: number; name: string }>(
    "SELECT id, name FROM recipes WHERE profession_id = $1 AND deleted_at IS NULL",
    [professionId]
  );

  const recipeByName = new Map<string, number>();
  const recipeNameById = new Map<number, string>();
  for (const row of recipeRows.rows) {
    recipeByName.set(row.name.toLowerCase(), row.id);
    recipeByName.set(stripRecipePrefix(row.name).toLowerCase(), row.id);
    recipeNameById.set(row.id, row.name);
  }

  const matched: number[] = [];
  const unmatched: string[] = [];
  let skipped = 0;

  for (const addonName of recipes as string[]) {
    const stripped = stripRecipePrefix(addonName);
    const key = stripped.toLowerCase();
    const recipeId = recipeByName.get(key);

    if (recipeId) {
      matched.push(recipeId);
    } else {
      unmatched.push(addonName);
    }
  }

  const uniqueMatched = [...new Set(matched)];

  const existingResult = await query<{ recipe_id: number }>(
    `SELECT recipe_id FROM character_recipes
     WHERE character_id = $1 AND recipe_id = ANY($2)`,
    [characterId, uniqueMatched]
  );
  skipped = existingResult?.rows?.length ?? 0;

  if (uniqueMatched.length > 0) {
    await query(
      `DELETE FROM character_recipes cr
       USING recipes r
       WHERE cr.recipe_id = r.id
         AND cr.character_id = $1
         AND r.profession_id = $2
         AND r.deleted_at IS NULL
         AND cr.recipe_id <> ALL($3::int[])`,
      [characterId, professionId, uniqueMatched]
    );
  } else {
    await query(
      `DELETE FROM character_recipes cr
       USING recipes r
       WHERE cr.recipe_id = r.id
         AND cr.character_id = $1
         AND r.profession_id = $2
         AND r.deleted_at IS NULL`,
      [characterId, professionId]
    );
  }

  for (const recipeId of uniqueMatched) {
    await query(
      `INSERT INTO character_recipes (character_id, recipe_id)
       VALUES ($1, $2)
       ON CONFLICT (character_id, recipe_id) DO NOTHING`,
      [characterId, recipeId]
    );
  }

  res.json({
    character_id: characterId,
    matched: uniqueMatched.length,
    matched_recipes: uniqueMatched
      .map((id) => recipeNameById.get(id))
      .filter((name): name is string => Boolean(name)),
    skipped,
    unmatched,
  });
});

export default router;
