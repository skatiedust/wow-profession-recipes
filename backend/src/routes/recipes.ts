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

export default router;
