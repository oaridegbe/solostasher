import { readFileSync } from "fs";
import { createClient } from "@libsql/client";

// load env file ourselves
const env = readFileSync(".env.local", "utf-8")
  .split("\n")
  .reduce((acc, line) => {
    const [key, val] = line.split("=");
    if (key && val) acc[key.trim()] = val.trim();
    return acc;
  }, {});

const db = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

(async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      client_email TEXT,
      value_cents INT,
      status TEXT CHECK(status IN ('inquiry','quoted','won','lost','followup')),
      next_action_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  console.log("✔ DB ready");
})();


