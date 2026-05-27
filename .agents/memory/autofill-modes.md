---
name: Autofill modes — home, away, favorites, random
description: Four autofill modes in OpenAPI spec and backend
---

Added "away" mode to the autofill endpoint in batch 4.

OpenAPI spec: `lib/api-spec/openapi.yaml` line ~546: `enum: [favorites, home, away, random]`

Backend logic in `artifacts/api-server/src/routes/picks.ts`:
```typescript
if (mode === "random") {
  team = Math.random() < 0.5 ? m.homeTeam : m.awayTeam;
} else if (mode === "favorites") {
  // Negative spread = home team favored; positive = away favored; no spread = home
  team = (!isNaN(spreadNum) && spreadNum < 0) ? m.homeTeam : (!isNaN(spreadNum) && spreadNum > 0) ? m.awayTeam : m.homeTeam;
} else if (mode === "away") {
  team = m.awayTeam;
} else { // "home"
  team = m.homeTeam;
}
```

**Why:** favorites mode when spread is null/NaN now always defaults to home team (previously defaulted to away, which was confusing when user expected "favorites").

**How to apply:** After any OpenAPI spec change, always run `pnpm --filter @workspace/api-spec run codegen`.
