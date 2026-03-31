import { Router, type IRouter } from "express";
import { promises as dns } from "dns";
import { db, postsTable } from "@workspace/db";
import { requireAdmin } from "../lib/admin-check";
import { extractEvents, CATEGORY_MAP, type ExtractedEvent } from "../lib/ai-extractor";

const router: IRouter = Router();

const AI_SYSTEM_WALLET = "ai-system";
const AI_SYSTEM_NAME = "AI精选";
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
const ALLOWED_SECTIONS = new Set(Object.values(CATEGORY_MAP));

const PRIVATE_CIDR_RE = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|::1$|fd[0-9a-f]{2}:|fc[0-9a-f]{2}:)/i;

function isPrivateIp(ip: string): boolean {
  return PRIVATE_CIDR_RE.test(ip) || ip === "localhost" || ip === "0.0.0.0" || ip === "::" || ip === "::1";
}

async function validateExtractUrl(raw: unknown): Promise<string | null> {
  if (!raw || typeof raw !== "string") return null;
  let parsed: URL;
  try { parsed = new URL(raw); } catch { return null; }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  const hostname = parsed.hostname;
  if (isPrivateIp(hostname)) return null;
  try {
    const [v4, v6] = await Promise.allSettled([
      dns.resolve4(hostname),
      dns.resolve6(hostname),
    ]);
    const allIps: string[] = [];
    if (v4.status === "fulfilled") allIps.push(...v4.value);
    if (v6.status === "fulfilled") allIps.push(...v6.value);
    if (allIps.length === 0) return null;
    for (const ip of allIps) {
      if (isPrivateIp(ip)) return null;
    }
  } catch {
    return null;
  }
  return parsed.href;
}

router.post("/extract", requireAdmin, async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const safe = await validateExtractUrl(body?.url);
    if (!safe) {
      res.status(400).json({ error: "url must be a resolvable public http(s) URL" });
      return;
    }
    const events = await extractEvents(safe);
    res.json({ events, total: events.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ai/extract] error:", msg);
    res.status(500).json({ error: msg });
  }
});

router.post("/publish", requireAdmin, async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const events = body?.events;
    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: "events array is required" });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + SIXTY_DAYS_MS);

    const inserted: number[] = [];
    for (const ev of events as ExtractedEvent[]) {
      if (!ev?.title) continue;
      const section = ev.section && ALLOWED_SECTIONS.has(ev.section) ? ev.section : null;
      if (!section) continue;
      const rows = await db.insert(postsTable).values({
        title: ev.title.slice(0, 200),
        content: ev.description?.slice(0, 2000) ?? "",
        section,
        authorWallet: AI_SYSTEM_WALLET,
        authorName: ev.project_name?.slice(0, 100) || AI_SYSTEM_NAME,
        authorType: "ai",
        sourceUrl: ev.source_url ?? null,
        aiConfidence: typeof ev.ai_confidence === "number" ? ev.ai_confidence : null,
        importance: ev.importance ?? null,
        eventStartTime: ev.start_time ? new Date(ev.start_time) : null,
        eventEndTime: ev.end_time ? new Date(ev.end_time) : null,
        expiresAt,
        views: 0,
        likes: 0,
        comments: 0,
        kolLikePoints: 0,
        kolCommentPoints: 0,
        isPinned: false,
        pinQueued: false,
      }).returning({ id: postsTable.id });
      if (rows[0]?.id) inserted.push(rows[0].id);
    }

    res.json({ success: true, inserted: inserted.length, ids: inserted });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ai/publish] error:", msg);
    res.status(500).json({ error: msg });
  }
});

export default router;
