---
name: Dashboard week switcher
description: Week selector in dashboard for viewing pick splits of any week
---

`selectedWeek` state in Dashboard (null = active week, number = user-selected week).

The `useGetPickPopularity` hook was replaced with a direct `useQuery` from `@tanstack/react-query`:
```typescript
const { data: popularity } = useQuery<PopularityItem[]>({
  queryKey: ["pick-popularity", displayWeek],
  queryFn: async () => {
    const res = await fetch(`/api/leaderboard/pick-popularity?week=${displayWeek}`);
    return res.json();
  },
  enabled: displayWeek > 0,
});
```

**Why:** The generated hook `useGetPickPopularity` doesn't accept a week parameter. Direct fetch with React Query is cleaner than wrapping the hook.

**Backend:** `GET /api/leaderboard/pick-popularity?week=N` — accepts optional `week` query param (1-18), defaults to lastCompleted+1.

**On navigation:** Since selectedWeek is component state, navigating away and back resets it to null (active week). This is the desired behavior per requirements.

**Result indicators:** Each pick split card checks `allMatches` (from useListMatches) for isCompleted + winner to determine green/red outline. Does NOT rely on pick-popularity response for this — allMatches is the source of truth.
