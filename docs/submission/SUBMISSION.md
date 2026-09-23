# AutoApps — hackathon submission draft

Prepared 23 September 2026 from the repository and the supplied submission screenshot. The implementation is changing in another session. This is a working draft, not a claim that the full demo has shipped. No user interviews, paying customers, or willingness-to-pay results were provided.

**Positioning:** Engineers use AI to build software. Business teams should be able to build their own tools too.

**One sentence:** AutoApps turns the spreadsheets business teams already use into internal apps they can describe in plain language.

## 1. Live product link — optional

Intended domain: https://autoapps.win

Verify the deployed builder and a published app with the second demo account before entering this link. A working landing page alone does not establish that the product flow works. The tracker currently records deployment/authentication issues and an unfinished consumer flow.

## 2. What did you build, and what problem does it solve?

### Current-state copy

Engineers use AI to build software. Business teams should be able to build their own tools too, starting with the spreadsheets they already use.

AutoApps is a prototype that reads a Google Sheet and generates an internal-app specification from a plain-language request. We are completing the flow for refining the app in chat and sharing it with colleagues. For example, a Finance team could give each budget owner an app to complete their own line, with updates returning to the original sheet.

Our first users are Finance and Ops teams collecting recurring updates through shared sheets, separate forms, or manual follow-ups. A team subscription could pay for itself through less coordination and reconciliation, then expand into more workflows in the same company. Willingness to pay remains a hypothesis to test.

### Replacement paragraph after the full demo passes

Replace the second paragraph above with this paragraph once the deployed two-account flow has actually passed:

> AutoApps turns a Google Sheet into an internal app through plain language. It suggests workflows, lets the builder refine an app in chat, and publishes a link for colleagues. In our budget demo, each owner completes their own line and saves the changes back to the original sheet.

Do not add “under two minutes” until you have timed the complete sheet-to-link flow. Do not imply that every supported view restricts users to their own data: this depends on the app configuration and runtime enforcement.

## 3. Models and Token Factory use

### Draft copy

Nebius Token Factory serves the product’s model calls. `zai-org/GLM-5.3-Flash` at low reasoning effort suggests three workflows from a sheet’s structure and samples. `zai-org/GLM-5.3` at high effort generates and edits the app specification. This separates quick ideation from the more constrained generation task; the performance benefit still needs comparison.

Outputs are structured JSON, checked against the actual sheet and retried once if validation fails. Schema extraction and shape analysis use deterministic code. We also tested `deepseek-ai/DeepSeek-V4.1-Flash` in a compatibility spike; it is not an active automatic fallback.

Claude assisted development, and Codex assisted submission preparation. No closed-model inference appears in the reviewed product call path. The OpenAI SDK connects to Nebius.

**Before pasting:** confirm that deployed `NEBIUS_MODEL`, `NEBIUS_MODEL_SUGGEST`, and reasoning-effort settings match these code defaults. Update the development-tool disclosure if your actual usage differs.

## 4. Measurable model advantage

### Honest interim copy

The development log records GLM-5.3 passing first-attempt spec validation on all five fixture sheets: budget, tasks, inventory, RSVP, and headcount. The first generation took 65 seconds; the next four took 6.7–8.6 seconds. A budget edit took 4 seconds.

These are single-run feasibility observations. We have not yet established a comparative advantage. Our planned baseline is GLM-5.3-Flash on identical generation requests, measuring validity, workflow correctness, latency, and token usage.

**Submission gap:** this section needs an actual baseline result to answer the judging prompt well. Follow [EVALUATION.md](EVALUATION.md). Publish a sanitized comparison table and link it here. The existing source is `docs/DECISIONS.md`, P2-4, rather than a public proof link.

### Copy structure once the comparison is measured

> We compared [model and effort] with [baseline and effort] on [number] requests across [tasks], using identical inputs and validation rules. [Model] achieved [x/n] first-attempt valid outputs and [x/n] workflow-correct outputs, compared with [y/n] and [y/n] for the baseline. Median warm latency was [x] versus [y] seconds, with [cold-start results reported separately]. [Add measured cost only if complete billed token usage and dated rates are available.] These results led us to [the model choice supported by the results]. Proof: [public evidence link].

Never fill these placeholders with estimates. If Flash matches the larger model on correctness and improves speed, report that finding and adjust the choice.

## 5. Responsible design

### Current-state copy — two sentences

AutoApps validates model-generated app specifications against the connected sheet and a constrained set of view types, with organization membership checks on the implemented connection routes. The backend stores account identity, OAuth credentials, and cached sheet schema/sample data to support access and generation, and sends schema, selected sample values, and builder instructions to Nebius; employee-facing permissions, publication review, and recovery controls still require completion and verification.

### Replacement after the relevant checks pass — two sentences

AutoApps validates generated app specifications, lets builders review them before publication, and enforces the published app’s organization, row, and editable-field rules on the server. We store identity and OAuth credentials for access, plus app records and cached sheet samples, and send schema/sample values and builder instructions to Nebius; builders can revise or restore an app configuration, while saved spreadsheet data requires separate correction.

Use the replacement only after the runtime and version-restoration behavior has been verified. Configuration rollback is not spreadsheet-data rollback. Do not claim that all data stays in Google Sheets, that no personal data reaches a model, or that the prototype provides comprehensive prompt-injection protection.

## 6. Pitch slides — required public link

Use `AutoApps-pitch-draft.pptx` as the editable starting deck and [PITCH.md](PITCH.md) for the five-minute script, including a 90-second demo window.

Upload the final deck to a public viewer, then test its link while signed out. The screenshot says the organizers open the slides on the stage computer. A local PPTX file is not the requested public link.

## Before submission

- Replace the interim model-evidence section with an actual comparison and a public proof link.
- Complete and rehearse the deployed flow with distinct builder and consumer accounts.
- Update present/future tense to match the implementation on submission day.
- Verify model names and settings against the deployment.
- Keep customer and pricing statements as hypotheses unless you obtain supporting evidence.
- Publish the final slides and test the viewer link while signed out.
- Check the portal’s exact six judging criteria and text limits. The supplied screenshot mentions six criteria but groups some labels together.

## Sources reviewed

- `docs/PRD.md`: personas, target workflow, constraints, and intended architecture.
- `docs/TRACKER.md`: implementation status and outstanding demo prerequisites.
- `docs/DECISIONS.md`: recorded fixture results and compatibility measurements.
- `frontend/lib/ai/client.ts`, `generate.ts`, `suggest.ts`, and `prompts.ts`: configured models, prompts, validation and retries.
- `frontend/lib/apps/spec.ts`, `validate.ts`, and `shape.ts`: constrained app representation and sheet analysis.
- `frontend/lib/auth/guards.ts` and database models: implemented access checks and stored data.

Repository logs are reported evidence from the development session, not independently repeated measurements from this submission-preparation session.
