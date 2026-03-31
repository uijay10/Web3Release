import { Router, type IRouter } from "express";
import { db, postsTable } from "@workspace/db";
import { requireAdmin } from "../lib/admin-check";
import { extractEvents, CATEGORY_MAP, type ExtractedEvent } from "../lib/ai-extractor";

const router: IRouter = Router();

const AI_SYSTEM_WALLET = "ai-system";
const AI_SYSTEM_NAME = "AI精选";
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

const PRIVATE_IP_RE = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fc|fd)/i;
const ALLOWED_SECTIONS = new Set(Object.values(CATEGORY_MAP));

function validateExtractUrl(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;
  let parsed: URL;
  try { parsed = new URL(raw); } catch { return null; }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  const host = parsed.hostname;
  if (PRIVATE_IP_RE.test(host)) return null;
  if (host === "localhost") return null;
  return parsed.href;
}

router.post("/extract", requireAdmin, async (req, res) => {
  try {
    const safe = validateExtractUrl(req.body?.url);
    if (!safe) {
      res.status(400).json({ error: "url must be a public http(s) URL" });
      return;
    }
    const events = await extractEvents(safe);
    res.json({ events, total: events.length });
  } catch (e: any) {
    console.error("[ai/extract] error:", e);
    res.status(500).json({ error: e?.message ?? String(e) });
  }
});

router.post("/publish", requireAdmin, async (req, res) => {
  try {
    const { events } = req.body as { events?: ExtractedEvent[] };
    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: "events array is required" });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + SIXTY_DAYS_MS);

    const inserted: number[] = [];
    for (const ev of events) {
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
  } catch (e: any) {
    console.error("[ai/publish] error:", e);
    res.status(500).json({ error: e?.message ?? String(e) });
  }
});

export default router;
