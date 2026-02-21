import pool from "./db";

const UP = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  battle_net_id VARCHAR(255) NOT NULL UNIQUE,
  battletag     VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS professions (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  icon_url   TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO professions (name, icon_url) VALUES
  ('Alchemy',        'https://wow.zamimg.com/images/wow/icons/large/trade_alchemy.jpg'),
  ('Blacksmithing',  'https://wow.zamimg.com/images/wow/icons/large/trade_blacksmithing.jpg'),
  ('Enchanting',     'https://wow.zamimg.com/images/wow/icons/large/trade_engraving.jpg'),
  ('Engineering',    'https://wow.zamimg.com/images/wow/icons/large/trade_engineering.jpg'),
  ('Jewelcrafting',  'https://wow.zamimg.com/images/wow/icons/large/inv_misc_gem_01.jpg'),
  ('Leatherworking', 'https://wow.zamimg.com/images/wow/icons/large/trade_leatherworking.jpg'),
  ('Tailoring',      'https://wow.zamimg.com/images/wow/icons/large/trade_tailoring.jpg'),
  ('Cooking',        'https://wow.zamimg.com/images/wow/icons/large/inv_misc_food_15.jpg')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS characters (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  realm         VARCHAR(255) NOT NULL,
  profession_id INTEGER      REFERENCES professions(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipes (
  id                     SERIAL PRIMARY KEY,
  profession_id          INTEGER      NOT NULL REFERENCES professions(id) ON DELETE CASCADE,
  name                   VARCHAR(255) NOT NULL,
  source                 VARCHAR(50)  NOT NULL,
  zone                   VARCHAR(255),
  reputation_requirement VARCHAR(255),
  dropped_by             TEXT[],
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS recipes_profession_name_idx
  ON recipes(profession_id, name) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS character_recipes (
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  recipe_id    INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (character_id, recipe_id)
);
`;

const DOWN = `
DROP TABLE IF EXISTS character_recipes;
DROP TABLE IF EXISTS recipes;
DROP TABLE IF EXISTS characters;
DROP TABLE IF EXISTS professions;
DROP TABLE IF EXISTS users;
`;

async function migrate() {
  const direction = process.argv[2];

  if (direction === "down") {
    console.log("Rolling back migration…");
    await pool.query(DOWN);
    console.log("Rollback complete.");
  } else {
    console.log("Running migration…");
    await pool.query(UP);
    console.log("Migration complete.");
  }

  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
