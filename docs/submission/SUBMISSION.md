# AutoApps — submission draft

Prepared 23 September 2026. Short answers based on the reviewed implementation and development logs. Update the prototype status after the full demo works.

## Live product link

Intended URL: https://autoapps.win

Verify the deployed flow with separate builder and consumer accounts before submitting it.

## What did you build, and what problem does it solve?

Engineers use AI to build software. Business teams should be able to build their own tools too, starting with the spreadsheets they already use.

AutoApps reads a Google Sheet’s structure and sample data to suggest useful internal apps. The user chooses an idea, AutoApps generates the app, and chat handles refinements. A Finance team could open its budget sheet and get an app for each owner to complete their own line, with updates returning to the original sheet.

Our initial target is Finance and Ops teams collecting recurring updates through shared sheets, separate forms, or manual follow-ups. A team subscription could pay for itself through less coordination and reconciliation, then expand into more workflows in the same company. Willingness to pay remains a hypothesis to test.

## Models and Token Factory use

Nebius Token Factory serves the product’s model calls. `zai-org/GLM-5.3-Flash` at low reasoning effort suggests three workflows from a sheet’s structure and samples. `zai-org/GLM-5.3` at high effort generates and edits the app specification. This separates ideation from the more constrained generation task.

Outputs are structured JSON, checked against the actual sheet and retried once if validation fails. Schema extraction uses deterministic code. We also tested `deepseek-ai/DeepSeek-V4.1-Flash` in a compatibility spike, without adding automatic model fallback.

Claude assisted development, and Codex assisted submission preparation. No closed-model inference appears in the reviewed product call path. The OpenAI SDK connects to Nebius.

## Measurable model advantage

We compared GLM-5.3 and GLM-5.3-Flash on five identical sheet-generation tasks through Nebius, both at high reasoning effort. Both passed first-attempt schema checks in 5/5 cases. Flash met the predefined task checklist in 4/5, compared with GLM-5.3’s 3/5. Median elapsed time was 5.35 seconds for Flash and 4.64 seconds for GLM-5.3.

This small pilot shows a quality/latency tradeoff. Both missed the multi-row task-table requirement, and GLM-5.3 omitted the RSVP email identity setting. These are specification checks, not production reliability measurements.

Evidence: [results, methodology and raw outputs](evidence/README.md). Publish this evidence and insert its public link before submitting.

## Responsible design

AutoApps validates generated app specifications and enforces the stored app’s organization, row, and editable-field rules on the server. The backend stores identity, OAuth credentials, and cached sheet samples for access and generation, and sends selected schema/sample values and builder instructions to Nebius; the complete user-facing review and recovery flow still needs verification.

## Pitch slides

Editable draft: [AutoApps-pitch-v2.pptx](AutoApps-pitch-v2.pptx)

Five-minute script, including the demo: [PITCH.md](PITCH.md)

Upload the final deck to a public viewer and test its link while signed out. The submission requires a public link, and organizers use a stage computer.

## Final checks

- Publish the measured comparison and retain its small-sample and specification-review qualifications.
- Rehearse the deployed flow with two accounts, then update the product paragraph and slide status labels. Do not claim “under two minutes” until measured.
- Confirm the deployed model names and effort settings match the code defaults above.
- Keep demand and pricing as hypotheses until supported. No customer evidence was provided.
- Verify permission behavior across every view. App-configuration rollback does not undo spreadsheet edits.
- Publish the slides and evidence links. Cover the six weighted criteria listed in PITCH.md.

Sources: `docs/PRD.md`, `docs/TRACKER.md`, `docs/DECISIONS.md`, and the reviewed AI, validation, authorization, and runtime code. Older development-log measurements were not repeated; the new matched-task comparison was run during pitch revision. Broader enterprise-adoption rates are not claimed.
