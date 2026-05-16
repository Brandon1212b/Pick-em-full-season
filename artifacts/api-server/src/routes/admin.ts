import { Router } from "express";
import { db, matchesTable, picksTable, seasonConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SetMatchResultParams, SetMatchResultBody, SendWebhookNotificationBody, UpdateSeasonModeBody } from "@workspace/api-zod";

const router = Router();

router.patch("/admin/match/:matchId/result", async (req, res) => {
  const paramsParsed = SetMatchResultParams.safeParse({ matchId: parseInt(req.params.matchId, 10) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid matchId" }); return; }
  const bodyParsed = SetMatchResultBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const { matchId } = paramsParsed.data;
  const { winner } = bodyParsed.data;

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }

  const [updated] = await db
    .update(matchesTable)
    .set({ winner, isCompleted: true })
    .where(eq(matchesTable.id, matchId))
    .returning();

  // Recalculate points for all picks of this match
  const matchPicks = await db.select().from(picksTable).where(eq(picksTable.matchId, matchId));
  for (const pick of matchPicks) {
    let points = 0;
    if (pick.selectedTeam === winner) {
      points = pick.isLock ? 2 : 1;
    }
    await db.update(picksTable).set({ pointsEarned: points }).where(eq(picksTable.id, pick.id));
  }

  // Update season config last completed week
  const allCompleted = await db.select().from(matchesTable);
  const completedWeeks = [...new Set(allCompleted.filter((m) => m.isCompleted).map((m) => m.week))];
  const lastCompletedWeek = completedWeeks.length > 0 ? Math.max(...completedWeeks) : 0;
  const [cfg] = await db.select().from(seasonConfigTable).limit(1);
  if (cfg) {
    await db.update(seasonConfigTable).set({ lastCompletedWeek }).where(eq(seasonConfigTable.id, cfg.id));
  }

  res.json({
    id: updated.id,
    week: updated.week,
    homeTeam: updated.homeTeam,
    awayTeam: updated.awayTeam,
    winner: updated.winner ?? null,
    isCompleted: updated.isCompleted,
    pointSpread: updated.pointSpread ?? null,
    injuryWeatherFlags: updated.injuryWeatherFlags ?? null,
    gameTime: updated.gameTime ?? null,
  });
});

router.post("/admin/webhook", async (req, res) => {
  const parsed = SendWebhookNotificationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }
  const { webhookUrl, message } = parsed.data;
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
    if (!response.ok) {
      res.json({ success: false, message: `Webhook returned ${response.status}` });
      return;
    }
    res.json({ success: true, message: "Notification sent" });
  } catch (err) {
    res.json({ success: false, message: String(err) });
  }
});

router.patch("/admin/season", async (req, res) => {
  const parsed = UpdateSeasonModeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }
  const { mode } = parsed.data;
  const [cfg] = await db.select().from(seasonConfigTable).limit(1);
  if (cfg) {
    await db.update(seasonConfigTable).set({ mode }).where(eq(seasonConfigTable.id, cfg.id));
  } else {
    await db.insert(seasonConfigTable).values({ mode, lastCompletedWeek: 0 });
  }
  const [updated] = await db.select().from(seasonConfigTable).limit(1);
  res.json({
    mode: updated.mode,
    lastCompletedWeek: updated.lastCompletedWeek,
    seasonLocked: updated.mode === "in-season",
  });
});

export default router;
