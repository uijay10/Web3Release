import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

const router: IRouter = Router();

function generateInviteCode(): string {
  return randomBytes(5).toString("hex").toUpperCase();
}

function fmtUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    wallet: u.wallet,
    username: u.username,
    avatar: u.avatar,
    points: u.points,
    energy: u.energy,
    spaceStatus: u.spaceStatus,
    spaceType: u.spaceType,
    inviteCode: u.inviteCode,
    inviteCount: u.inviteCount,
    invitedBy: u.invitedBy,
    lastCheckin: u.lastCheckin?.toISOString() ?? null,
    twitter: u.twitter,
    website: u.website,
    language: u.language,
    pinCount: u.pinCount,
    spaceRejectedAt: (u as any).spaceRejectedAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

router.get("/me", async (req, res) => {
  const wallet = req.query.wallet as string;
  if (!wallet) return res.status(400).json({ error: "wallet required" });

  const users = await db.select().from(usersTable).where(eq(usersTable.wallet, wallet.toLowerCase())).limit(1);
  if (users.length === 0) return res.status(404).json({ error: "User not found" });

  res.json(fmtUser(users[0]));
});

router.get("/invited", async (req, res) => {
  const wallet = req.query.wallet as string;
  if (!wallet) return res.status(400).json({ error: "wallet required" });

  const lw = wallet.toLowerCase();
  const invited = await db.select().from(usersTable).where(eq(usersTable.invitedBy, lw));
  res.json({ users: invited.map(u => ({
    wallet: u.wallet,
    username: u.username,
    avatar: u.avatar,
    spaceType: u.spaceType,
    createdAt: u.createdAt.toISOString(),
  })) });
});

router.post("/upsert", async (req, res) => {
  const { wallet, username, avatar, twitter, website, language, inviteCode: usedCode } = req.body;
  if (!wallet) return res.status(400).json({ error: "wallet required" });

  const lw = wallet.toLowerCase();
  const existing = await db.select().from(usersTable).where(eq(usersTable.wallet, lw)).limit(1);

  if (existing.length === 0) {
    const newCode = generateInviteCode();
    let inviterWallet: string | null = null;

    if (usedCode) {
      const inviters = await db.select().from(usersTable).where(eq(usersTable.inviteCode, usedCode.toUpperCase())).limit(1);
      if (inviters.length > 0) {
        inviterWallet = inviters[0].wallet;
        await db.update(usersTable)
          .set({ inviteCount: (inviters[0].inviteCount ?? 0) + 1 })
          .where(eq(usersTable.wallet, inviterWallet));
      }
    }

    const inserted = await db.insert(usersTable).values({
      wallet: lw,
      username: username ?? null,
      avatar: avatar ?? null,
      points: 0,
      energy: 0,
      inviteCode: newCode,
      inviteCount: 0,
      invitedBy: inviterWallet,
      twitter: twitter ?? null,
      website: website ?? null,
      language: language ?? "en",
    } as any).returning();
    return res.json(fmtUser(inserted[0]));
  }

  const updateData: Record<string, unknown> = {};
  if (username !== undefined) updateData.username = username;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (twitter !== undefined) updateData.twitter = twitter;
  if (website !== undefined) updateData.website = website;
  if (language !== undefined) updateData.language = language;

  const updated = Object.keys(updateData).length > 0
    ? await db.update(usersTable).set(updateData).where(eq(usersTable.wallet, lw)).returning()
    : existing;

  res.json(fmtUser(updated[0]));
});

router.post("/checkin", async (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.status(400).json({ error: "wallet required" });

  const lw = wallet.toLowerCase();
  const users = await db.select().from(usersTable).where(eq(usersTable.wallet, lw)).limit(1);
  if (users.length === 0) return res.status(404).json({ error: "User not found" });

  const u = users[0];
  const now = new Date();
  const last = u.lastCheckin;

  if (last) {
    const diff = now.getTime() - last.getTime();
    if (diff < 24 * 60 * 60 * 1000) {
      const next = new Date(last.getTime() + 24 * 60 * 60 * 1000);
      return res.json({ success: false, points: u.points, nextCheckin: next.toISOString(), message: "Already checked in today" });
    }
  }

  const updated = await db.update(usersTable)
    .set({ points: u.points + 1000, lastCheckin: now })
    .where(eq(usersTable.wallet, lw))
    .returning();

  const nextCheckin = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  res.json({ success: true, points: updated[0].points, nextCheckin: nextCheckin.toISOString(), message: "+1000 points!" });
});

export default router;
