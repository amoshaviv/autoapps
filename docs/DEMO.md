# Demo rehearsal checklist

The hero scenario (PRD §4) on https://www.autoapps.win with two Google accounts on the same domain: a **builder** (mail@amoshaviv.com) and a **consumer** (a second `@amoshaviv.com` account, H-6). Target: sheet opened → link copied in under two minutes.

## The morning of the demo

- [ ] **Reconnect Google Sheets on the builder account.** Open https://www.autoapps.win/connect/google and allow. The OAuth app is in Testing mode, so refresh tokens expire after 7 days.
- [ ] **Consumer account:** signed in at https://www.autoapps.win in a second Chrome profile, and listed as a test user on the OAuth consent screen. Its email is in `DEMO_CONSUMER_EMAIL`, and `npm run seed:sheets` has been re-run so the fixture sheets contain it.
- [ ] **Extension:** in the builder's profile, `chrome://extensions` → AutoApps → reload. Open the budget sheet and check that the "⚡ Build an app from this sheet" badge appears and that clicking it opens the side panel.
- [ ] **Warm up the model.** The first spec generation after a deploy or a quiet period takes about 65 s while Nebius compiles the output grammar; later ones take 5–25 s. Build and delete one throwaway app, or run from `frontend/`:
  `node --env-file=.env --import tsx scripts/try-ai.ts fixture:budget "each owner fills their own line"`
- [ ] **Reset the demo sheet.** From `frontend/`, check first, then clear:
  `npm run reset:demo -- "<budget sheet URL>" --dry-run`
  `npm run reset:demo -- "<budget sheet URL>"`
  This clears the fill-in columns (Q1–Q4, Justification) on every row belonging to the consumer. Check the dry-run list: it names each row it would clear.
- [ ] **Old demo apps:** delete or rename leftover apps on the budget sheet, so the panel's "Apps on this sheet" list is short.

## Rehearse twice, timing it

1. Builder: open the budget sheet → click the badge → the side panel shows the sheet and three suggestions.
2. Pick the "each owner fills their own line" idea (my-row on Owner Email). The preview appears.
3. Chat: *"Also show them last year's number as read-only and make Justification required."* The preview updates.
4. **Publish** → **Copy link**. Stop the timer.
5. Consumer profile: open the link, sign in → "Hi …", only their line. Fill in Q1–Q4 and Justification → Save → confirmation.
6. Builder: the row is filled in the sheet. **Open in AutoApps** → Activity shows "consumer@… updated Q1, Q2, Q3, Q4, Justification · just now".
7. Reset the sheet (above) before the second run and before the real demo.

Times: rehearsal 1 ______  rehearsal 2 ______

## Fallbacks

- **Side panel misbehaves:** keep https://www.autoapps.win/amoshaviv open in a tab. Use **New app** → paste the sheet link, and the flow is the same.
- **A generation is slow or fails:** it retries once by itself. If it still fails, the chat shows the reason and keeps the previous version. Pick another suggestion or rephrase.
- **"The app's owner needs to reconnect Google Sheets" (consumer side):** the builder's Google token expired. Reconnect at `/connect/google`.

## During Q&A

- Keep the five fixture sheets open in tabs (links in `docs/TRACKER.md`, H-5): budget, tasks, inventory, RSVP, headcount. Open whichever the audience asks about.
- Any sheet the audience hands over works: paste its link into **New app**. The builder's Google account must be able to open it.
