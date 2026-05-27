---
name: Picks page lock/autofill bugs and fixes
description: Three interrelated bugs in picks.tsx and their fixes
---

## Bug 5: Autofill save button disappears after autofill
**Cause:** `autofillPicks.onSuccess` called `queryClient.invalidateQueries`, which triggered refetch of picks. The `useEffect([picks])` then reset `hasUnsavedChanges = false`, hiding the save button.

**Fix:** Added `skipHasUnsavedChangesReset` ref. In autofill onSuccess, set `skipHasUnsavedChangesReset.current = true` before invalidating. In useEffect([picks]), check the ref before resetting hasUnsavedChanges, then clear the ref.

## Bug 7: Reset + autofill → nothing happens (or wrong picks)
**Cause:** Reset only cleared `localPicks` client state. Server still had old picks. Autofill checks server for unpicked matches → found 0 → filled nothing.

**Fix:** Reset now calls `DELETE /api/picks/user/:userId/clear` to clear server picks first, then clears client state. Autofill then correctly sees 0 server picks.

Also fixed the favorites mode in backend: now explicitly handles home/away/favorites/random in if-else chain (no more implicit fallthrough).

## Bug 8: Lock view didn't persist across navigation
**Cause:** `picksSubmitted` state was only set from localStorage (`picks_locked_{userId}`). On first visit after autofill, localStorage wasn't updated so locked view didn't show.

**Fix:** Replaced `picksLockedKey` with `picksUnlockedKey` (`picks_unlocked_{userId}`). Lock view is now derived:
```
showLockedView = allPicksOnServer && !isUnlocked && !hasUnsavedChanges
```
- `allPicksOnServer`: picks.length >= totalMatches (from server data, no localStorage dependency)
- `isUnlocked`: set when user explicitly clicks "Edit Picks"
- When user saves all 288: remove picksUnlockedKey → locked view shows automatically

**Why:** Server is the source of truth for pick count. localStorage only tracks the explicit "edit" intent.
