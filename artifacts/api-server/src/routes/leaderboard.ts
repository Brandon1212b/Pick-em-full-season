import { Router } from "express";
import { db, usersTable, picksTable, matchesTable, seasonConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/leaderboard", async (_req, res) => {
  const users = await db.select().from(usersTable);
  const picks = await db.select().from(picksTable);
  const matches = await db.select().from(matchesTable);
  const completedMatches = matches.filter((m) => m.isCompleted);

  // Get last completed week
  const lastWeek = completedMatches.length > 0 ? Math.max(...completedMatches.map((m) => m.week)) : 0;
  const lastWeekMatches = completedMatches.filter((m) => m.week === lastWeek);
  const lastWeekMatchIds = new Set(lastWeekMatches.map((m) => m.id));

  // Count total picks per match for "Against the Grain" badge (<15% picked a team)
  const matchPickCounts: Record<number, Record<string, number>> = {};
  for (const p of picks) {
    if (!matchPickCounts[p.matchId]) matchPickCounts[p.matchId] = {};
    matchPickCounts[p.matchId][p.selectedTeam] = (matchPickCounts[p.matchId][p.selectedTeam] ?? 0) + 1;
  }
  const totalUsers = users.length || 1;

  const entries = users.map((u) => {
    const userPicks = picks.filter((p) => p.userId === u.id);
    const totalPoints = userPicks.reduce((s, p) => s + p.pointsEarned, 0);
    const correctPicks = userPicks.filter((p) => {
      const m = completedMatches.find((m) => m.id === p.matchId);
      return m && p.selectedTeam === m.winner;
    }).length;

    // Badge logic
    const badges: string[] = [];

    // Perfect Week: all completed last-week picks correct, at least 1 pick
    const lwPicks = userPicks.filter((p) => lastWeekMatchIds.has(p.matchId));
    const lwCorrect = lwPicks.filter((p) => {
      const m = lastWeekMatches.find((m) => m.id === p.matchId);
      return m && p.selectedTeam === m.winner;
    });
    if (lastWeek > 0 && lwPicks.length > 0 && lwPicks.length === lastWeekMatches.length && lwCorrect.length === lwPicks.length) {
      badges.push("Perfect Week");
    }

    // Against the Grain: picked an upset chosen by <15% of users at least once this season
    const agPick = userPicks.some((p) => {
      const m = completedMatches.find((m) => m.id === p.matchId);
      if (!m || p.selectedTeam !== m.winner) return false;
      const counts = matchPickCounts[p.matchId] ?? {};
      const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
      const pct = (counts[p.selectedTeam] ?? 0) / total;
      return pct < 0.15;
    });
    if (agPick) badges.push("Against the Grain");

    return { userId: u.id, name: u.name, totalPoints, correctPicks, totalPicks: userPicks.length, badges };
  });

  entries.sort((a, b) => b.totalPoints - a.totalPoints);

  // Rank and cellar badge
  const ranked = entries.map((e, i) => ({ ...e, rank: i + 1 }));
  if (ranked.length > 0) {
    const minPoints = Math.min(...ranked.map((e) => e.totalPoints));
    for (const e of ranked) {
      if (e.totalPoints === minPoints && !e.badges.includes("The Cellar")) {
        e.badges.push("The Cellar");
      }
    }
    if (ranked[0]) {
      if (!ranked[0].badges.includes("Leader")) ranked[0].badges.push("League Leader");
    }
  }

  res.json(ranked);
});

router.get("/leaderboard/trends", async (_req, res) => {
  const users = await db.select().from(usersTable);
  const picks = await db.select().from(picksTable);
  const matches = await db.select().from(matchesTable);
  const completedMatches = matches.filter((m) => m.isCompleted);
  const weeks = [...new Set(completedMatches.map((m) => m.week))].sort((a, b) => a - b);

  const trends = users.map((u) => {
    const userPicks = picks.filter((p) => p.userId === u.id);
    const weeklyPoints: number[] = [];
    let cumulative = 0;
    for (const week of weeks) {
      const weekMatchIds = new Set(completedMatches.filter((m) => m.week === week).map((m) => m.id));
      const weekPoints = userPicks
        .filter((p) => weekMatchIds.has(p.matchId))
        .reduce((s, p) => s + p.pointsEarned, 0);
      cumulative += weekPoints;
      weeklyPoints.push(cumulative);
    }
    return { userId: u.id, name: u.name, weeklyPoints };
  });

  res.json(trends);
});

router.get("/leaderboard/weekly-extremes", async (_req, res) => {
  const picks = await db.select().from(picksTable);
  const matches = await db.select().from(matchesTable);
  const users = await db.select().from(usersTable);
  const completedMatches = matches.filter((m) => m.isCompleted);

  if (completedMatches.length === 0) {
    res.json({ week: 0, topUsers: [], bottomUsers: [] });
    return;
  }

  const lastWeek = Math.max(...completedMatches.map((m) => m.week));
  const lastWeekMatchIds = new Set(completedMatches.filter((m) => m.week === lastWeek).map((m) => m.id));

  const scores = users.map((u) => {
    const weekPicks = picks.filter((p) => p.userId === u.id && lastWeekMatchIds.has(p.matchId));
    const points = weekPicks.reduce((s, p) => s + p.pointsEarned, 0);
    return { userId: u.id, name: u.name, points };
  }).filter((s) => s.points > 0 || picks.some((p) => p.userId === s.userId && lastWeekMatchIds.has(p.matchId)));

  if (scores.length === 0) {
    res.json({ week: lastWeek, topUsers: [], bottomUsers: [] });
    return;
  }

  const maxPoints = Math.max(...scores.map((s) => s.points));
  const minPoints = Math.min(...scores.map((s) => s.points));
  res.json({
    week: lastWeek,
    topUsers: scores.filter((s) => s.points === maxPoints),
    bottomUsers: scores.filter((s) => s.points === minPoints),
  });
});

router.get("/leaderboard/pick-popularity", async (_req, res) => {
  const picks = await db.select().from(picksTable);
  const matches = await db.select().from(matchesTable);
  const totalUsers = (await db.select().from(usersTable)).length || 1;

  const result = matches.map((m) => {
    const matchPicks = picks.filter((p) => p.matchId === m.id);
    const total = matchPicks.length || 1;
    const homePicks = matchPicks.filter((p) => p.selectedTeam === m.homeTeam).length;
    const awayPicks = matchPicks.filter((p) => p.selectedTeam === m.awayTeam).length;
    return {
      matchId: m.id,
      week: m.week,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homePickPct: Math.round((homePicks / total) * 100),
      awayPickPct: Math.round((awayPicks / total) * 100),
    };
  });

  res.json(result);
});

router.get("/leaderboard/season-status", async (_req, res) => {
  const [cfg] = await db.select().from(seasonConfigTable).limit(1);
  if (!cfg) {
    res.json({ mode: "pre-season", lastCompletedWeek: 0, seasonLocked: false });
    return;
  }
  res.json({
    mode: cfg.mode,
    lastCompletedWeek: cfg.lastCompletedWeek,
    seasonLocked: cfg.mode === "in-season",
  });
});

export default router;
