import express, { type Express } from "express";
import cors from "cors";
import cron from "node-cron";
import router from "./routes";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

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
        likes INTEGER NOT NULL DEFAULT 0,
        reply_to INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    await db.execute(sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes INTEGER NOT NULL DEFAULT 0`);
    await db.execute(sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS reply_to INTEGER`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS comment_likes (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER NOT NULL,
        wallet TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(comment_id, wallet)
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
    await db.execute(sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS source_url TEXT`);
    await db.execute(sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_confidence REAL`);
    await db.execute(sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS importance TEXT`);
    await db.execute(sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_start_time TIMESTAMP`);
    await db.execute(sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_end_time TIMESTAMP`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS scrape_sources (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL DEFAULT 'rss',
        priority INTEGER NOT NULL DEFAULT 2,
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS scrape_keywords (
        id SERIAL PRIMARY KEY,
        keyword TEXT NOT NULL UNIQUE,
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS scrape_logs (
        id SERIAL PRIMARY KEY,
        run_id TEXT NOT NULL,
        source_name TEXT NOT NULL,
        source_url TEXT NOT NULL,
        status TEXT NOT NULL,
        items_found INTEGER NOT NULL DEFAULT 0,
        items_saved INTEGER NOT NULL DEFAULT 0,
        error_msg TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_scrape_logs_run_id ON scrape_logs(run_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_scrape_logs_created_at ON scrape_logs(created_at DESC)`);
    console.log("[db] ensureTables: OK");
  } catch (e) {
    console.error("[db] ensureTables error:", e);
  }
}

ensureTables();

// Auto-scrape cron job: every 2 hours
if (process.env.NODE_ENV !== "test") {
  const SCRAPE_CRON = process.env.SCRAPE_CRON_SCHEDULE ?? "0 */2 * * *";
  cron.schedule(SCRAPE_CRON, async () => {
    console.log(`[cron] Starting scheduled auto-scrape (schedule: ${SCRAPE_CRON})`);
    try {
      const { runAutoScrape } = await import("./lib/auto-scraper");
      const summary = await runAutoScrape();
      console.log("[cron] Auto-scrape complete:", summary);
    } catch (e) {
      console.error("[cron] Auto-scrape error:", e);
    }
  });
  console.log(`[cron] Auto-scrape scheduled: ${SCRAPE_CRON}`);
}

export default app;
