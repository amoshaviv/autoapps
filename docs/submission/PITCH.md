# AutoApps — five-minute pitch

Updated to the six confirmed judging criteria and Amos’s context-first positioning. Seven slides, 4:45 of planned delivery, including a 75-second live demo. Leave 15 seconds for transitions or delays. Timing is a rehearsal allocation.

## Story

**AutoApps reads the business context people already have, suggests useful apps, and generates the one they choose.** Google Sheets is the first source. Chat refines an app after creation. Keep this order visible in the demo: context, suggestions, generation, colleague action, update in the original sheet.

## Timing and rubric coverage

| Slide | Time | What it establishes | Judging coverage |
| --- | --- | --- | --- |
| 1. Lovable for the enterprise | 0:00–0:15 | Business teams can build with AI, starting in their existing context | Product and user value |
| 2. AutoApps reads the context | 0:15–1:05 | Recurring coordination pain, and useful app ideas inferred from a sheet | Product and user value, problem and company potential |
| 3. Live demo: sheet to generated app | 1:05–2:20 | Suggestions, generation, publication and a visible write-back | Product and user value, demo clarity |
| 4. Open models shape the app | 2:20–2:55 | Exact model roles, context extraction and validation | Technical execution and Token Factory use |
| 5. A measured model tradeoff | 2:55–3:40 | Actual matched-task comparison, including task failures | Measurable model advantage |
| 6. Responsible design | 3:40–4:00 | Bounded generation, access enforcement and data flow | Responsible design |
| 7. Start with Ops. Expand across the company. | 4:00–4:45 | Initial buyer, market context, subscription and expansion hypothesis | Problem and company potential |

The exact weights are product and user value **25%**, problem and company potential **20%**, measurable model advantage **20%**, technical execution and Token Factory use **20%**, demo clarity **10%**, and responsible design **5%**. These come from the screenshot and the BuilderBase event page. Technical execution and Token Factory use are one combined criterion. Demo clarity is a separate criterion.

## Spoken script

### 1 — Cover

“AutoApps is Lovable for the enterprise. It reads the business context you already have, suggests useful apps, and generates the one you choose. We start with Google Sheets.”

### 2 — Context creates the starting point

“Engineers use AI to build software. Business teams should be able to build their own tools too. Think of a Finance analyst collecting budget inputs: they still coordinate sheet edits, chase people, and reconcile responses every cycle.

AutoApps reads the sheet’s columns, sample values, ownership signals and missing inputs. It can then propose a budget app for each owner, a status board, or a summary. The user chooses an idea and we generate the app. They can refine it in chat. They don’t need to design the software or write a detailed starting brief.”

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

“We compared both models on the same five generation tasks. Both passed the schema checks in five out of five cases. Flash met four task checklists, and GLM-5.3 met three. GLM-5.3 had a 4.64-second median versus 5.35 seconds for Flash.

Both missed the requested multi-row task view. GLM-5.3 also omitted the RSVP email identity setting. This small pilot gives us a real tradeoff and tells us what to test next. Valid JSON alone isn’t a correct workflow.”

Evidence: [comparison and methodology](evidence/README.md). All ten outputs are retained. Task checks are static specification reviews, not end-to-end app tests. One request per fixture per model is insufficient to establish broad superiority. No cost advantage is claimed. The evaluation did not change production model settings.

### 6 — Responsible design

“The server validates the specification and enforces its row and field rules. We disclose what goes to Nebius: selected schema, samples and builder instructions. Builders can revise or restore an app configuration, while saved spreadsheet edits need separate correction.”

Do not say AutoApps solves all enterprise security or privacy concerns. The model can produce a valid but inappropriate specification, so intended access policy still needs review and testing.

### 7 — Company potential and close

“Our first customer is an Ops team repeatedly collecting updates in spreadsheets. The workflow owner is our buyer hypothesis, with a team subscription justified by less coordination.

Google reported more than eleven million Workspace customers in July 2025. That is a large starting ecosystem, not our addressable-market estimate. We would win one recurring workflow, then expand into more apps and data sources within the company. The next proof is repeat use and willingness to pay. AutoApps gives business teams a way to build with AI.”

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
