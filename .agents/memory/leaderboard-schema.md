---
name: Leaderboard schema additions
description: Fields added to LeaderboardEntry and TrendEntry OpenAPI schemas and leaderboard route
---

LeaderboardEntry now includes:
- `wrongPicks` — picks on completed matches where pick != winner
- `weekHighScoreCount` — how many weeks this user had the top score
- `weekLowScoreCount` — how many weeks this user had the lowest score
- `avatar` — user's hex color string (from users table)

TrendEntry now includes:
- `avatar` — user's hex color for chart line coloring

Record display in UI uses `correctPicks - wrongPicks` (not `totalPicks - correctPicks`) so unresolved games don't count as losses.

**Why:** Before, totalPicks - correctPicks counted unresolved games as losses, so everyone started with a bad record. Now record = 0-0 until commissioner enters results.

**How to apply:** After any OpenAPI LeaderboardEntry schema change, run codegen and update both the route and the frontend record display. Never use totalPicks as the loss denominator — use wrongPicks.
