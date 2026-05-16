import { Router } from "express";
import { db, matchesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListMatchesQueryParams, GetMatchParams } from "@workspace/api-zod";

const router = Router();

function serializeMatch(m: typeof matchesTable.$inferSelect) {
  return {
    id: m.id,
    week: m.week,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    winner: m.winner ?? null,
    isCompleted: m.isCompleted,
    pointSpread: m.pointSpread ?? null,
    injuryWeatherFlags: m.injuryWeatherFlags ?? null,
    gameTime: m.gameTime ?? null,
  };
}

router.get("/matches", async (req, res) => {
  const parsed = ListMatchesQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Invalid query" }); return; }
  const { week } = parsed.data;
  let rows;
  if (week !== undefined) {
    rows = await db.select().from(matchesTable).where(eq(matchesTable.week, week));
  } else {
    rows = await db.select().from(matchesTable);
  }
  rows.sort((a, b) => a.week - b.week || a.id - b.id);
  res.json(rows.map(serializeMatch));
});

router.get("/matches/:matchId", async (req, res) => {
  const parsed = GetMatchParams.safeParse({ matchId: parseInt(req.params.matchId, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid matchId" }); return; }
  const [m] = await db.select().from(matchesTable).where(eq(matchesTable.id, parsed.data.matchId)).limit(1);
  if (!m) { res.status(404).json({ error: "Match not found" }); return; }
  res.json(serializeMatch(m));
});

export default router;
