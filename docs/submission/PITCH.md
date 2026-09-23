# AutoApps — five-minute pitch and demo

Working pitch for the current prototype. Total allocation: 5:00 including a 1:30 demo. The deck intentionally identifies unfinished verification and missing comparison evidence. Update those parts when measured results are available. Timing is a rehearsal allocation, not a measured speaking duration.

## Slide 1 — AutoApps — 0:00–0:20

“Engineers use AI to build software. Business teams should be able to build their own tools too. AutoApps starts with something they already know: a Google Sheet. They describe the workflow, and AutoApps generates an internal-app specification.”

## Slide 2 — The budget handoff — 0:20–0:55

“Consider a Finance analyst collecting budget inputs. A chat answer can explain how to organize the process, but the analyst still has to build the workflow. They coordinate edits in the sheet, reconcile separate responses, or ask someone to configure a tool. AutoApps is designed to turn that request into an app colleagues can use. Finance and Ops teams with recurring updates are our first customer hypothesis.”

## Slide 3 — One budget update — 0:55–2:25, live demo

Show the actual product only after the full flow passes. Until then, use the visible “Target workflow” label and explain it as planned behavior. Never represent the slide as a product screenshot or the sequence as completed testing.

| Seconds | Action | Narration |
| ---: | --- | --- |
| 0–15 | Open the synthetic budget sheet and the extension. Use the web builder if the stage computer cannot load the extension. | “Finance already owns this sheet. Each cost center has an owner and quarterly inputs.” |
| 15–35 | Choose the owner-input suggestion and generate the app. | “AutoApps reads the sheet’s structure and suggests a workflow that fits it.” |
| 35–50 | Ask: “Show FY2026 Actual as read-only and make Justification required.” Show the preview. | “The builder describes the change in ordinary language.” |
| 50–60 | Publish and open the exact app link in the prepared consumer session. | “This is the link a colleague receives.” |
| 60–80 | Enter one small synthetic update and save. | “The colleague sees their budget line and completes the allowed fields.” |
| 80–90 | Return to the sheet and show the changed cell. | “The original sheet receives the update.” |

Do not spend the demo signing into accounts or granting OAuth. If generation runs long, switch to an explicitly labeled previously generated app and continue the consumer flow. Say what you are doing. Keep a recorded version of the real working flow as a fallback if the event permits it, and label playback clearly.

## Slide 4 — Open models shape the app — 2:25–3:05

“Nebius Token Factory serves the product’s model calls. GLM-5.3-Flash proposes three ideas from the sheet’s structure and samples. GLM-5.3 generates and edits an app specification. We validate the returned JSON and its references to the real sheet, with one retry for invalid outputs. The specification supports forms, tables, a personal-row view, and statistics. Schema extraction and shape analysis run in ordinary code. This constrains what a generated app can express.”

If asked: DeepSeek was tested on a compatibility spike, not implemented as automatic fallback. Claude helped with development and Codex with submission preparation. The OpenAI SDK is the transport client for Nebius.

## Slide 5 — Initial generation evidence — 3:05–3:40

“The development log records five sheet types passing spec validation on the first attempt. The first budget generation took 65 seconds. The next four generation cases took 6.7 to 8.6 seconds, and a budget edit took 4 seconds. These are small development observations, and validation is not proof of a correct deployed workflow. A controlled comparison against Flash on the same app-generation tasks is still pending.”

Replace this passage after running the comparison. Lead with the measured tradeoff, use the same baseline and sample counts as the written submission, and keep the cold-call result visible. Do not present the toy-schema comparison as product performance.

## Slide 6 — Responsible design — 3:40–4:15

“The server validates app specifications and enforces the stored app’s organization, row and editable-field rules. We still need to verify the complete flow with a separate consumer account. Privacy also matters: the backend stores access credentials and cached sheet samples, and Nebius receives headers, sample values, and builder instructions. We will demonstrate with synthetic data. Restoring an app configuration does not undo edits to the underlying sheet.”

Once the two-account checks pass, state what you tested. Keep the data-flow disclosure.

## Slide 7 — A recurring workflow business — 4:15–5:00

“The broader opportunity is to help business teams build with AI. We would start with Finance and Ops teams that repeatedly collect updates in spreadsheets. The buyer is the workflow owner, and the business-model hypothesis is a team subscription justified by less coordination and reconciliation. Our next step is to observe five teams doing a real workflow and measure the difference. If one app proves useful, we can expand into more workflows in that company. Demand and pricing still need validation.”

The five teams are a proposed research target, not existing users. Shorten the final slide if live demo execution uses the buffer.

## Coverage of the judging criteria

The screenshot appears to imply these six categories. Confirm the exact labels in the portal before submission.

| Working criterion | Coverage |
| --- | --- |
| Product and user value | Slides 1–3, concrete builder and colleague workflow |
| Problem and company potential | Slides 2 and 7, frequency, alternatives, buyer and subscription hypothesis |
| Technical execution | Slides 3–4, working demo and constrained app generation |
| Token Factory use | Slide 4, exact product model roles |
| Measurable model advantage | Slide 5, currently feasibility only, comparison still needed |
| Responsible design | Slide 6, safeguards, data flow, recovery limits |

## Demo and submission readiness

- Resolve the OAuth-client mismatch and apex/www URL inconsistency recorded in `docs/TRACKER.md`, if still current.
- Prepare distinct builder and consumer accounts. The tracker currently says the fixture consumer is the builder account. A single-account demo does not verify the handoff.
- Confirm the consumer can access only intended data. For the budget demo, use email matching, deny unmatched users, and verify secondary tables and statistics do not expose other rows. Inspect API responses as well as visible fields.
- Verify save-to-sheet, publication, and configuration restoration before claiming them. Rehearse the deployed flow twice.
- Record the first generation latency separately. A rehearsal generation may help establish a warm state, but do not assume it eliminates all future delays.
- Prepare a stage-computer path. The screenshot says presenters use the organizers’ computer, so the pitch cannot depend solely on your installed extension or browser profiles.
- Publish the deck to a viewer accessible while signed out. Test its link and the evidence link from a fresh browser session.
- Replace slide 5 with the completed comparison and remove only the status qualifiers whose underlying checks have actually passed.

## Likely questions

**Who pays?** The initial hypothesis is a Finance or Ops team. Explain the coordination problem and proposed pilot measurement. Do not claim validated demand or revenue.

**What is distinctive?** The proposed experience starts in the sheet, suggests workflows from its structure, and lets the owner describe an app in chat. The budget handoff is the concrete demonstration. Do not claim that competitors cannot do this without researching and testing them.

**Why two models?** Different generation tasks have different complexity and output size. The split is an engineering hypothesis until the comparison measures quality, latency, and cost.

**What if the model exposes the wrong data?** Structural validation cannot establish appropriate access policy by itself. Describe the actual builder review and server enforcement that has been implemented, plus the identity/filter tests that passed.

**Does the data stay in Google Sheets?** The sheet remains the source for business records, but the backend caches schema/sample data and sends selected context to Nebius. Give that direct answer.

**Is this already a company?** It is a hackathon prototype with a proposed first customer and business model. The next evidence is a successful real workflow, measured benefit, and willingness to pay.
