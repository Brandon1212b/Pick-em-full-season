---
name: Profile color palette and auto-assignment
description: User avatars store hex colors; new users get an unused color from a fixed palette
---

Avatar field (users table, nullable text) now stores hex color strings like "#007AFF".

Palette (10 colors) defined in both `artifacts/api-server/src/routes/users.ts` and `artifacts/nfl-pickem/src/components/layout.tsx`:
`#007AFF, #FF6B35, #34C759, #AF52DE, #FF2D55, #5AC8FA, #FFCC00, #FF9500, #00C7BE, #30D158`

On new user creation: query all existing avatars, find first unused color, assign it. Falls back to `COLORS[count % COLORS.length]` if all taken.

Profile circle: shows user initials (first letter of each word, up to 2) in a colored circle. Initials are computed from display name.

Leaderboard chart lines use each user's avatar color (cross-referencing leaderboard data by userId) instead of hardcoded CSS chart vars.

**Why:** Consistent identity across the app — same color in profile, chart, and eventually picker avatars.

**How to apply:** When adding new color-aware features, read `avatar` from user object (auth context stores it in localStorage). Auth User type has `avatar?: string | null`.
