import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAdmin, ADMIN_WALLETS } from "../lib/admin-check";
import { verifyAdminToken } from "../lib/admin-token";
import { runAutoScrape, isScrapeRunning, DEFAULT_SOURCES, DEFAULT_KEYWORDS } from "../lib/auto-scraper";

const router: IRouter = Router();

router.post("/run", (req, res, next) => {
  const key = req.headers["x-scrape-key"] ?? req.query.key;
  const expectedKey = process.env.SCRAPE_INTERNAL_KEY;
  if (expectedKey && key === expectedKey) { next(); return; }

  const authHeader = String(req.headers.authorization ?? "");
  if (authHeader.startsWith("Bearer ")) {
    const wallet = verifyAdminToken(authHeader.slice(7));
    if (wallet && ADMIN_WALLETS.has(wallet)) { next(); return; }
    res.status(403).json({ error: "Forbidden: invalid token" }); return;
  }
  const walletRaw = String(req.query.adminWallet ?? (req.body as Record<string, unknown>)?.adminWallet ?? "");
  const wallet = walletRaw.toLowerCase();
  if (wallet && ADMIN_WALLETS.has(wallet)) { next(); return; }
  res.status(403).json({ error: "Forbidden: missing scrape key or admin credentials" });
}, async (req, res) => {

  if (isScrapeRunning()) {
    res.status(409).json({ error: "Scrape already running" });
    return;
  }

  runAutoScrape()
    .then(summary => { console.log("[auto-scrape] /run done:", summary); })
    .catch(e => { console.error("[auto-scrape] /run error:", e); });

  res.json({ ok: true, message: "Scrape started in background" });
});

router.get("/status", requireAdmin, async (_req, res) => {
  res.json({ running: isScrapeRunning() });
});

router.get("/logs", requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 200), 500);
    const runId = req.query.runId as string | undefined;
    let query = `SELECT id, run_id, source_name, source_url, status, items_found, items_saved, error_msg, created_at
                 FROM scrape_logs`;
    if (runId) {
      query += ` WHERE run_id = '${runId.replace(/'/g, "''")}'`;
    }
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;
    const rows = await db.execute(sql.raw(query));
    res.json({ logs: rows.rows });
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) });
  }
});

router.get("/runs", requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const rows = await db.execute(sql`
      SELECT run_id,
             MIN(created_at) AS started_at,
             COUNT(*)::int AS total_sources,
             SUM(items_found)::int AS total_found,
             SUM(items_saved)::int AS total_saved,
             COUNT(*) FILTER (WHERE status = 'error')::int AS errors
      FROM scrape_logs
      GROUP BY run_id
      ORDER BY started_at DESC
      LIMIT ${limit}
    `);
    res.json({ runs: rows.rows });
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) });
  }
});

router.get("/sources", requireAdmin, async (_req, res) => {
  try {
    const rows = await db.execute(sql`SELECT id, name, url, type, priority, enabled FROM scrape_sources ORDER BY priority ASC, id ASC`);
    let sources = rows.rows as Array<{ id: number; name: string; url: string; type: string; priority: number; enabled: boolean }>;
    if (sources.length === 0) {
      res.json({ sources: DEFAULT_SOURCES.map((s, i) => ({ id: i + 1, ...s, enabled: true })) });
      return;
    }
    res.json({ sources });
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/sources", requireAdmin, async (req, res) => {
  try {
    const { name, url, type = "rss", priority = 2 } = req.body as Record<string, unknown>;
    if (!name || !url || typeof name !== "string" || typeof url !== "string") {
      res.status(400).json({ error: "name and url are required" });
      return;
    }
    await db.execute(sql`INSERT INTO scrape_sources (name, url, type, priority, enabled) VALUES (${name}, ${url}, ${type}, ${Number(priority)}, true)`);
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) });
  }
});

router.put("/sources/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, url, type, priority, enabled } = req.body as Record<string, unknown>;
    const fields: string[] = [];
    if (name !== undefined) fields.push(`name = '${String(name).replace(/'/g, "''")}'`);
    if (url !== undefined) fields.push(`url = '${String(url).replace(/'/g, "''")}'`);
    if (type !== undefined) fields.push(`type = '${String(type).replace(/'/g, "''")}'`);
    if (priority !== undefined) fields.push(`priority = ${Number(priority)}`);
    if (enabled !== undefined) fields.push(`enabled = ${Boolean(enabled)}`);
    if (fields.length === 0) { res.status(400).json({ error: "No fields to update" }); return; }
    await db.execute(sql.raw(`UPDATE scrape_sources SET ${fields.join(", ")} WHERE id = ${id}`));
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) });
  }
});

router.delete("/sources/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.execute(sql`DELETE FROM scrape_sources WHERE id = ${id}`);
    res.json({ ok: true });
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) });
  }
});

router.get("/keywords", requireAdmin, async (_req, res) => {
  try {
    const rows = await db.execute(sql`SELECT id, keyword, enabled FROM scrape_keywords ORDER BY id ASC`);
    let keywords = rows.rows as Array<{ id: number; keyword: string; enabled: boolean }>;
    if (keywords.length === 0) {
      keywords = DEFAULT_KEYWORDS.map((k, i) => ({ id: i + 1, keyword: k, enabled: true }));
    }
    res.json({ keywords });
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) });
  }
});

router.put("/keywords", requireAdmin, async (req, res) => {
  try {
    const { keywords } = req.body as { keywords: string[] };
    if (!Array.isArray(keywords)) { res.status(400).json({ error: "keywords array required" }); return; }
    await db.execute(sql`DELETE FROM scrape_keywords`);
    for (const kw of keywords) {
      if (typeof kw === "string" && kw.trim()) {
        await db.execute(sql`INSERT INTO scrape_keywords (keyword, enabled) VALUES (${kw.trim()}, true)`);
      }
    }
    res.json({ ok: true, count: keywords.length });
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/sources/seed", requireAdmin, async (_req, res) => {
  try {
    const existing = await db.execute(sql`SELECT COUNT(*) as count FROM scrape_sources`);
    const count = Number((existing.rows[0] as { count: string }).count);
    if (count > 0) { res.json({ ok: true, message: "Already seeded", count }); return; }
    for (const src of DEFAULT_SOURCES) {
      await db.execute(sql`INSERT INTO scrape_sources (name, url, type, priority, enabled) VALUES (${src.name}, ${src.url}, ${src.type}, ${src.priority}, true)`);
    }
    const kwCount = await db.execute(sql`SELECT COUNT(*) as count FROM scrape_keywords`);
    const kwCountNum = Number((kwCount.rows[0] as { count: string }).count);
    if (kwCountNum === 0) {
      for (const kw of DEFAULT_KEYWORDS) {
        await db.execute(sql`INSERT INTO scrape_keywords (keyword, enabled) VALUES (${kw}, true)`);
      }
    }
    res.json({ ok: true, message: `Seeded ${DEFAULT_SOURCES.length} sources and ${DEFAULT_KEYWORDS.length} keywords` });
  } catch (e: unknown) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
