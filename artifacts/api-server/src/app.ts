import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";
import { startEnergyDecayCron } from "./lib/energy-decay";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

startEnergyDecayCron();

// Ensure tables added in recent migrations exist (safe to run on every startup)
async function ensureTables() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL,
        wallet TEXT NOT NULL,
        author_name TEXT,
        author_avatar TEXT,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        recipient_wallet TEXT NOT NULL,
        type TEXT NOT NULL,
        from_wallet TEXT,
        from_name TEXT,
        post_id INTEGER,
        post_title TEXT,
        is_read BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log("[db] ensureTables: OK");
  } catch (e) {
    console.error("[db] ensureTables error:", e);
  }
}

ensureTables();

export default app;
