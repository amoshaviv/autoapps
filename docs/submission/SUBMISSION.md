# AutoApps — submission draft

Prepared 23 September 2026. Short answers based on the reviewed implementation and development logs. Update the prototype status after the full demo works.

## Live product link

Intended URL: https://autoapps.win

Verify the deployed flow with separate builder and consumer accounts before submitting it.

## What did you build, and what problem does it solve?

Engineers use AI to build software. Business teams should be able to build their own tools too, starting with the spreadsheets they already use.

AutoApps is a prototype that reads a Google Sheet and generates an internal-app specification from a plain-language request. We are completing the flow for refining the app in chat and sharing it with colleagues. For example, a Finance team could give each budget owner an app to complete their own line, with updates returning to the original sheet.

Our initial target is Finance and Ops teams collecting recurring updates through shared sheets, separate forms, or manual follow-ups. A team subscription could pay for itself through less coordination and reconciliation, then expand into more workflows in the same company. Willingness to pay remains a hypothesis to test.

## Models and Token Factory use

Nebius Token Factory serves the product’s model calls. `zai-org/GLM-5.3-Flash` at low reasoning effort suggests three workflows from a sheet’s structure and samples. `zai-org/GLM-5.3` at high effort generates and edits the app specification. This separates ideation from the more constrained generation task.

Outputs are structured JSON, checked against the actual sheet and retried once if validation fails. Schema extraction uses deterministic code. We also tested `deepseek-ai/DeepSeek-V4.1-Flash` in a compatibility spike, without adding automatic model fallback.

Claude assisted development, and Codex assisted submission preparation. No closed-model inference appears in the reviewed product call path. The OpenAI SDK connects to Nebius.

## Measurable model advantage

The development log records GLM-5.3 passing first-attempt spec validation on all five fixture sheets: budget, tasks, inventory, RSVP, and headcount. The first generation took 65 seconds; the next four took 6.7–8.6 seconds. A budget edit took 4 seconds.

These are single-run feasibility observations. We have not yet established a comparative advantage. Our planned baseline is GLM-5.3-Flash on identical generation requests, measuring validity, workflow correctness, latency, and token usage.

*Replace this interim answer with the measured comparison and a public proof link. See [EVALUATION.md](EVALUATION.md).*

## Responsible design

AutoApps validates generated app specifications and enforces the stored app’s organization, row, and editable-field rules on the server. The backend stores identity, OAuth credentials, and cached sheet samples for access and generation, and sends selected schema/sample values and builder instructions to Nebius; the complete user-facing review and recovery flow still needs verification.

## Pitch slides

Editable draft: [AutoApps-pitch-draft.pptx](AutoApps-pitch-draft.pptx)

Five-minute script, including the demo: [PITCH.md](PITCH.md)

Upload the final deck to a public viewer and test its link while signed out. The submission requires a public link, and organizers use a stage computer.

## Final checks

- Replace the model-evidence answer with an actual comparison. The current numbers establish feasibility, not an advantage over a baseline.
- Rehearse the deployed flow with two accounts, then update the product paragraph and slide status labels. Do not claim “under two minutes” until measured.
- Confirm the deployed model names and effort settings match the code defaults above.
- Keep demand and pricing as hypotheses until supported. No customer evidence was provided.
- Verify permission behavior across every view. App-configuration rollback does not undo spreadsheet edits.
- Publish the slides and evidence links. Confirm the portal’s exact six judging criteria.

Sources: `docs/PRD.md`, `docs/TRACKER.md`, `docs/DECISIONS.md`, and the reviewed AI, validation, authorization, and runtime code. Development-log measurements were not independently repeated during submission preparation. Broader enterprise-adoption rates are not claimed.
