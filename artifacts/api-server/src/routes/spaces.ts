import { Router, type IRouter } from "express";
import { db, spaceApplicationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const DAILY_APPLY_LIMIT = 2;

function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

router.post("/apply", async (req, res) => {
  const { wallet, type, twitter, tweetLink, projectName, projectTwitter, docsLink, github, linkedin } = req.body;
  if (!wallet || !type) return res.status(400).json({ error: "wallet and type required" });

  const lw = wallet.toLowerCase();

  const users = await db.select().from(usersTable).where(eq(usersTable.wallet, lw)).limit(1);
  const user = users[0];
  const today = todayDateStr();

  if (user) {
    const lastDate = (user as any).lastApplyDate ?? null;
    const count = (user as any).dailyApplyCount ?? 0;
    if (lastDate === today && count >= DAILY_APPLY_LIMIT) {
      return res.status(429).json({ error: "DAILY_APPLY_LIMIT", limit: DAILY_APPLY_LIMIT });
    }
  }

  await db.insert(spaceApplicationsTable).values({
    wallet: lw,
    type,
    twitter: twitter ?? null,
    tweetLink: tweetLink ?? null,
    projectName: projectName ?? null,
    projectTwitter: projectTwitter ?? null,
    docsLink: docsLink ?? null,
    github: github ?? null,
    linkedin: linkedin ?? null,
    status: "pending",
  });

  const existingDate = (user as any)?.lastApplyDate ?? null;
  const existingCount = (user as any)?.dailyApplyCount ?? 0;
  const newCount = existingDate === today ? existingCount + 1 : 1;

  await db.update(usersTable)
    .set({ spaceStatus: "pending", dailyApplyCount: newCount, lastApplyDate: today } as any)
    .where(eq(usersTable.wallet, lw));

  res.json({ message: "Application submitted. Review will be completed within 24 hours." });
});

export default router;
