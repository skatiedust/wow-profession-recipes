import { Router, Request, Response } from "express";
import { query } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { fetchGuildCharacters } from "../services/blizzard";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res: Response) => {
  const { user } = req as AuthenticatedRequest;

  const result = await query<{
    id: number;
    name: string;
    realm: string;
    profession_id: number | null;
    profession_name: string | null;
  }>(
    `SELECT c.id, c.name, c.realm, c.profession_id, p.name AS profession_name
     FROM characters c
     LEFT JOIN professions p ON p.id = c.profession_id
     WHERE c.user_id = $1
     ORDER BY c.name`,
    [user.id]
  );

  res.json(result.rows);
});

router.get("/import", async (req: Request, res: Response) => {
  const { accessToken } = req as AuthenticatedRequest;
  const guildName = (process.env.GUILD || "Red Sun").trim().toLowerCase();

  try {
    const characters = await fetchGuildCharacters(accessToken, guildName);
    res.json(characters);
  } catch {
    res.json([]);
  }
});

router.post("/", async (req, res: Response) => {
  const { user } = req as AuthenticatedRequest;
  const { name, realm, profession_id } = req.body;

  if (!name || !realm) {
    res.status(400).json({ error: "name and realm are required" });
    return;
  }

  const result = await query<{
    id: number;
    name: string;
    realm: string;
    profession_id: number | null;
  }>(
    `INSERT INTO characters (user_id, name, realm, profession_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, realm, profession_id`,
    [user.id, name, realm, profession_id || null]
  );

  res.status(201).json(result.rows[0]);
});

router.delete("/:id", async (req, res: Response) => {
  const { user } = req as unknown as AuthenticatedRequest;
  const characterId = parseInt(req.params.id, 10);

  if (isNaN(characterId)) {
    res.status(400).json({ error: "Invalid character ID" });
    return;
  }

  const result = await query(
    "DELETE FROM characters WHERE id = $1 AND user_id = $2",
    [characterId, user.id]
  );

  if (result.rowCount === 0) {
    res.status(404).json({ error: "Character not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
