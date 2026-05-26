---
name: User avatar column and profile editing
description: Avatar stores hex color; profile editing via header popover; commish access for Bfabs
---

`users` table has a nullable `avatar` text column (stores hex color like "#007AFF").

Profile editing via `ProfileButton` component in `layout.tsx` — clicking the avatar circle in the header opens a Popover with:
- Color swatch picker (10 colors from PROFILE_COLORS palette)
- Name rename field (calls PATCH /api/users/:id)
- "How to Play" link → /help
- Sign out button
- "Commish Tools" link → /admin (only shown when `user.name === "Bfabs"`)

PATCH endpoint in `artifacts/api-server/src/routes/users.ts` validates name (1-32 chars) and avatar (null or ≤16 char string) without zod (api-server doesn't import zod directly).

Auth User type (auth.tsx) includes `avatar?: string | null`. localStorage `auth_user` stores the full user object including avatar.

**Why:** No zod import in api-server — use manual type narrowing instead. Avatar is in localStorage for immediate UI refresh.

**How to apply:** Call `setUser({ ...user, avatar: newColor })` from auth context after color change — this updates both state and localStorage atomically.
