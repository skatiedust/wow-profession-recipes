import { Router, Request, Response } from "express";
import { query } from "../db";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const result = await query<{
    id: number;
    name: string;
    icon_url: string | null;
  }>("SELECT id, name, icon_url FROM professions ORDER BY name");

  res.json(result.rows);
});

export default router;
