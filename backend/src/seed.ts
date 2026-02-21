import * as fs from "fs";
import * as path from "path";
import pool from "./db";

interface RecipeEntry {
  name: string;
  source: string;
  zone: string | null;
  reputation_requirement: string | null;
  dropped_by: string[] | null;
  url: string | null;
  rarity: string | null;
}

const RECIPES_DIR = path.resolve(__dirname, "../../data/recipes");

async function seed() {
  const files = fs.readdirSync(RECIPES_DIR).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.log("No recipe JSON files found in", RECIPES_DIR);
    await pool.end();
    return;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const file of files) {
      const professionName = path.basename(file, ".json");
      const displayName =
        professionName.charAt(0).toUpperCase() + professionName.slice(1);

      const profResult = await client.query<{ id: number }>(
        "SELECT id FROM professions WHERE LOWER(name) = LOWER($1)",
        [displayName]
      );

      if (profResult.rows.length === 0) {
        console.warn(`Profession "${displayName}" not found, skipping ${file}`);
        continue;
      }

      const professionId = profResult.rows[0].id;
      const raw = fs.readFileSync(path.join(RECIPES_DIR, file), "utf-8");
      const recipes: RecipeEntry[] = JSON.parse(raw);
      const seededNames: string[] = [];

      for (const recipe of recipes) {
        seededNames.push(recipe.name);

        const updated = await client.query(
          `UPDATE recipes
             SET source = $3,
                 zone = $4,
                 reputation_requirement = $5,
                 dropped_by = $6,
                 url = $7,
                 rarity = $8,
                 updated_at = NOW(),
                 deleted_at = NULL
           WHERE profession_id = $1 AND name = $2`,
          [
            professionId,
            recipe.name,
            recipe.source,
            recipe.zone,
            recipe.reputation_requirement,
            recipe.dropped_by,
            recipe.url,
            recipe.rarity,
          ]
        );

        if (updated.rowCount === 0) {
          await client.query(
            `INSERT INTO recipes
               (profession_id, name, source, zone, reputation_requirement, dropped_by, url, rarity)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              professionId,
              recipe.name,
              recipe.source,
              recipe.zone,
              recipe.reputation_requirement,
              recipe.dropped_by,
              recipe.url,
              recipe.rarity,
            ]
          );
        }
      }

      const softDeleted = await client.query(
        `UPDATE recipes
            SET deleted_at = NOW(), updated_at = NOW()
          WHERE profession_id = $1
            AND deleted_at IS NULL
            AND name != ALL($2)`,
        [professionId, seededNames]
      );

      console.log(
        `${displayName}: ${recipes.length} upserted, ${softDeleted.rowCount} soft-deleted`
      );
    }

    await client.query("COMMIT");
    console.log("Seed complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

export { seed, RecipeEntry };

if (require.main === module) {
  seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
