---
name: Picks lock flow
description: When/how the picks page shows the locked summary view vs editing view
---

## showLockedView derivation
```typescript
const allPicksOnServer = !loadingPicks && !loadingMatches &&
  (picks?.length ?? 0) >= totalMatches && totalMatches > 0;
const showLockedView = allPicksOnServer && !isUnlocked && !hasUnsavedChanges;
```

## isUnlocked state
- `isUnlocked` initialized from `localStorage.getItem(picks_unlocked_{userId}) === "true"`
- Set to true when user clicks "Edit Picks" → also writes to localStorage
- Cleared when user saves all 288 picks → `localStorage.removeItem(picksUnlockedKey)` + `setIsUnlocked(false)`
- Cleared when user resets picks → same removal

## Locked view layout (descending order)
1. **Current week** (activeWeek = lastCompletedWeek + 1) — shown first, highlighted with "Current" badge
2. **Past weeks** — shown in descending order (most recent first)
3. **Future weeks** — collapsed behind a toggle button (default hidden)

## skipHasUnsavedChangesReset ref
Prevents useEffect([picks]) from resetting hasUnsavedChanges after autofill invalidates the query.
```typescript
skipHasUnsavedChangesReset.current = true; // set in autofillPicks.onSuccess
// In useEffect:
if (!skipHasUnsavedChangesReset.current) setHasUnsavedChanges(false);
skipHasUnsavedChangesReset.current = false;
```

## Team records in picks page
`teamRecordsSorted` computed from picks + matches (both already available). Shown:
- As horizontal scrollable row in editing view
- As grid in locked view footer
