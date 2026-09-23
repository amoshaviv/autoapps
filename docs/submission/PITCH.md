# AutoApps — five-minute pitch

Updated to the six confirmed judging criteria and Amos’s context-first positioning. Seven slides, 4:45 of planned delivery, including a 75-second live demo. Leave 15 seconds for transitions or delays. Timing is a rehearsal allocation.

## Story

**AutoApps reads the business context people already have, suggests useful apps, and generates the one they choose.** Google Sheets is the first source. Chat refines an app after creation. Keep this order visible in the demo: context, suggestions, generation, colleague action, update in the original sheet.

## Timing and rubric coverage

| Slide | Time | What it establishes | Judging coverage |
| --- | --- | --- | --- |
| 1. Lovable for the enterprise | 0:00–0:15 | Business teams can build with AI, starting in their existing context | Product and user value |
| 2. Every budget cycle repeats the same work | 0:15–1:05 | Recurring coordination pain, and useful app ideas inferred from a sheet | Product and user value, problem and company potential |
| 3. Live demo: sheet to generated app | 1:05–2:20 | Suggestions, generation, publication and a visible write-back | Product and user value, demo clarity |
| 4. Context, generation and a bounded runtime | 2:20–2:55 | Exact model roles, context extraction and validation | Technical execution and Token Factory use |
| 5. Model advantage: latency versus task fit | 2:55–3:40 | Actual matched-task comparison, including task failures | Measurable model advantage |
| 6. Responsible design | 3:40–4:00 | Bounded generation, access enforcement and data flow | Responsible design |
| 7. A subscription for recurring business workflows | 4:00–4:45 | Initial buyer, market context, subscription and expansion hypothesis | Problem and company potential |

The exact weights are product and user value **25%**, problem and company potential **20%**, measurable model advantage **20%**, technical execution and Token Factory use **20%**, demo clarity **10%**, and responsible design **5%**. These come from the screenshot and the BuilderBase event page. Technical execution and Token Factory use are one combined criterion. Demo clarity is a separate criterion.

## What each judge can assess

| Criterion | Visible proof in the pitch | Remaining evidence gap |
| --- | --- | --- |
| Product and user value, 25% | Slide 2 names the user and recurring work. Slide 3 shows automatic creation and a source-sheet update. | No observed customer time savings yet. |
| Problem and company potential, 20% | Slides 2 and 7 cover existing workarounds, recurring pain, buyer, subscription and expansion. | Willingness to pay and addressable-market size remain unvalidated. The Workspace count is only ecosystem context. |
| Measurable model advantage, 20% | Slide 5 names a baseline, matched tasks, latency and task-fit results. Raw outputs are retained. | Five tasks with one run each establish only a pilot result. No cost advantage measured. |
| Technical execution and Token Factory use, 20% | Slide 4 names both served models, distinct roles, validation/retry and bounded rendering. | Confirm deployed defaults and rehearse the full live path. |
| Demo clarity, 10% | Slide 3 has one user story and one visible success condition: the source cell changes. | Complete the stage-browser and distinct-account rehearsal. |
| Responsible design, 5% | Slide 6 discloses model data, enforced app rules and configuration recovery limits. | Review generated access rules against the intended policy. |

The pitch should make these points naturally, without reading the rubric aloud. Keep unvalidated business assumptions explicit. The current deliverable is `AutoApps-pitch-v3.pptx`.

## Spoken script

### 1 — Cover

“AutoApps is Lovable for the enterprise. It reads the business context you already have, suggests useful apps, and generates the one you choose. We start with Google Sheets.”

### 2 — Recurring problem and automatic generation

“Engineers use AI to build software. Business teams should be able to build their own tools too. Think of a Finance analyst collecting budget inputs. Every cycle means chasing inputs, coordinating sheet edits and reconciling replies. Today they use shared sheets or separate forms, or ask someone to build a tool.

AutoApps reads the columns, sample values and missing inputs to propose useful apps. They choose a budget collection app and we generate it automatically. Colleagues get a focused interface that updates the original sheet. Chat handles refinements after creation.”

### 3 — Live demo

Use the web builder on the stage computer. Show context-derived suggestions before typing any custom request.

| Seconds | Action | Narration |
| ---: | --- | --- |
| 0–10 | Show the synthetic budget sheet, Owner Email and empty quarterly inputs | “The context is already here: who owns each line and what they need to complete.” |
| 10–20 | Reveal the app suggestions and choose the owner-budget idea | “AutoApps proposes this app from the sheet.” |
| 20–35 | Generate and show the preview | “One selection gives us a working starting point.” |
| 35–45 | Make one concise chat refinement if it fits | “Chat is how we refine it.” |
| 45–55 | Publish and open the prepared colleague session | “This is the link a colleague receives.” |
| 55–70 | Save a synthetic update through the app | “They complete the fields intended for them.” |
| 70–75 | Show the changed source cell | “The update lands in the original sheet.” |

The decisive moment is the source cell changing after the colleague acts. Avoid spending the demo on setup, OAuth consent, navigation or a feature tour. If generation exceeds its slot, explicitly switch to a previously generated app and preserve the live write-back. Do not disguise a saved app or recording as live generation.

### 4 — Technical execution and Token Factory

“We extract the sheet’s structure in code, including ownership and missing-input signals. Nebius Token Factory serves both model roles: GLM-5.3-Flash proposes workflows, and GLM-5.3 generates and edits the selected app specification. We validate the JSON against the actual sheet, with one retry for invalid output. A fixed set of supported views keeps the runtime bounded.”

Exact product defaults: `zai-org/GLM-5.3-Flash`, low effort for suggestions; `zai-org/GLM-5.3`, high effort for generation/editing. The next slide compares both models at high effort. Confirm the deployed settings before presenting.

### 5 — Measured tradeoff

“We used GLM-5.3-Flash as the baseline on five matched generation tasks, both models at high effort. GLM-5.3 had a 4.64-second median, about thirteen percent lower than the baseline. Both passed every schema check. But Flash met four task checklists and GLM-5.3 met three.

Both missed the requested multi-row task table, and GLM-5.3 omitted the RSVP identity setting. This is a small measured latency advantage with a task-fit tradeoff. We need repeat runs before changing our model choice.”

Relative median reduction: `(5.352 − 4.640) / 5.352 = 13.30%`, rounded to 13%. This compares the observed medians in this pilot, not an expected speedup for future requests.

Evidence: [comparison and methodology](evidence/README.md). All ten outputs are retained. Task checks are static specification reviews, not end-to-end app tests. One request per fixture per model is insufficient to establish broad superiority. No cost advantage is claimed. The evaluation did not change production model settings.

### 6 — Responsible design

“The server validates the specification and enforces its row and field rules. We disclose what goes to Nebius: selected schema, samples and builder instructions. Builders can revise or restore an app configuration, while saved spreadsheet edits need separate correction.”

Do not say AutoApps solves all enterprise security or privacy concerns. The model can produce a valid but inappropriate specification, so intended access policy still needs review and testing.

### 7 — Company potential and close

“Our first customer is an Ops team repeatedly collecting updates in spreadsheets. The workflow owner is our buyer hypothesis, with a team subscription justified by less coordination.

Google reported more than eleven million Workspace customers in July 2025. That is a large starting ecosystem, not our addressable-market estimate. We would win one recurring workflow, then expand into more apps and data sources within the company. The next proof is reduced coordination time, repeat use and willingness to pay. AutoApps gives business teams a way to build with AI.”

Market source: [Google Workspace, 29 July 2025](https://workspace.google.com/blog/identity-and-security/defending-against-account-takeovers-top-threats-passkeys-and-dbsc). Initial segment, pricing and demand remain unvalidated. Do not present the platform count as the number of prospective AutoApps customers.

## Stage and public-link readiness

- Publish the final presentation to a browser viewer. A local `.key` or `.pptx` file does not satisfy the requested public link.
- Open the exact public link in an incognito window. Confirm the cover, every slide, readable fonts and presentation controls without a sign-in request.
- Use the web builder as the primary demo path. The event uses its own computer, so the demo cannot depend on your installed extension or local files.
- Prepare distinct builder and consumer accounts and verify the consumer’s row/field access. H-6 is still open in the reviewed tracker. Do not expose passwords or OAuth tokens in the slides or URL.
- Rehearse the full sequence on the deployed site twice. Initial generation latency and authentication can vary.
- Keep a clearly labeled recording or pre-generated app available if the event permits it. Test any linked or embedded media in the same signed-out viewer.
- Publish a sanitized evidence viewer or repository link for the comparison. The evidence bundle in this folder contains synthetic data and provider usage, with no secrets.

## Source and format notes

The cover direction comes from Amos’s `AutoApps-pitch-draft copy.key`. Native Keynote control was blocked by macOS, and the bundled converter could not load that Keynote file. The revised PowerPoint reuses the original deck’s editable objects and matches the updated cover text/layout from its embedded preview, with the brand spelling corrected to “Lovable” and the subtitle updated for context-driven generation.

Judging source: [BuilderBase event overview](https://builderbase.com/track-dashboard/accel-ai-innovate-amsterdam/overview), read 23 September 2026. Other factual sources are the repository, the comparison evidence, and the Google source above. No broad enterprise-adoption statistic is asserted.
