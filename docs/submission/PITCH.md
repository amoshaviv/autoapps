# AutoApps — five-minute pitch

Current deck: [AutoApps-pitch-v4.pptx](AutoApps-pitch-v4.pptx). Seven slides in Amos’s requested order. Planned delivery is 4:45, including a 65-second live demo, with 15 seconds of margin. The cover is unchanged.

## Timing

| Slide | Time |
| --- | --- |
| Cover | 0:00–0:15 |
| The Problem | 0:15–0:50 |
| AutoApps | 0:50–1:25 |
| Budget example and live demo | 1:25–2:45 |
| How it works, Nebius and evidence | 2:45–3:40 |
| Market and Jevons thesis | 3:40–4:25 |
| Amos Haviv | 4:25–4:45 |

## 1. Cover

0:00–0:15. AutoApps is Lovable for the enterprise. It reads the business context you already have, suggests useful apps, and generates the one you choose. We start with Google Sheets.

The Lovable comparison is positioning, not a feature-parity, affiliation, or enterprise-readiness claim. Broader business contexts are the direction; Google Sheets is the current source. Cover layout and positioning follow Amos’s AutoApps-pitch-draft copy.key embedded preview. The subtitle reflects his subsequent request to emphasize automatic suggestions and generation from context. The brand spelling has been corrected from Loveable to Lovable.

## 2. The Problem

0:15–0:50. Engineers already use AI to build software. Business teams should be able to build their own tools too. But giving everyone a chat box is only the beginning. McKinsey’s 2026 survey reports 47 percent scaling chatbots across the enterprise, versus about twenty percent scaling AI agents. Our opportunity is to make useful software emerge from the work people already do, using existing data, with reliable behavior and clear access rules.

Source: https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai , 2026 survey, accessed 23 September 2026. Exact seven-word quote: “chatbots are the most widely scaled”. These are organizational scaling reports, not individual employee adoption rates or proof of demand for AutoApps. Product design requirements reflect Amos’s positioning.

## 3. AutoApps

0:50–1:25. AutoApps automatically generates ephemeral business applications on top of existing software. By ephemeral, we mean a focused app for a task or business cycle. It reads the context and offers a useful starting point. The user chooses an idea and we generate the app. They do not need to learn Claude Code or build a custom integration. They keep working with the data source they already use, and can refine the app in chat. The vision is software that appears when needed and understands the user’s context and permissions.

Current scope: Google Sheets, OAuth authorization, built-in connector, web builder and Chrome extension entry point. Initial authorization/setup still exists. The prototype enforces its configured organization, row and field rules. It does not prove universal inheritance of source-system permissions. Ephemeral describes intended use duration, not an implemented automatic-expiry/deletion capability. Source: docs/PRD.md, docs/TRACKER.md, frontend/lib/apps/runtime.ts.

## 4. Example: the quarterly budget cycle

1:25–2:45, including a 65-second live demo. Finance has a budget sheet with owners, missing forecasts and received submissions. Instead of asking someone to build software, AutoApps reads that context and proposes a budget collection app. Each owner gets a focused form and the forecast goes back into the original sheet. The app serves this cycle while the data remains useful afterward.

Demo: 10 seconds show the synthetic sheet, 10 show the context-derived suggestions, 15 generate and preview the selected app, 10 open the prepared consumer session, 15 save an update, 5 show the changed cell. Show suggestions before any custom prompt. If generation takes too long, explicitly identify a pre-generated app and keep the live write-back. Verify consumer access and the full stage-browser path beforehand. The distinct-account rehearsal remains pending in the reviewed tracker. The diagram is an illustrative scenario, not a product screenshot.

## 5. How it works

2:45–3:40. Nebius Token Factory serves both open models in the product. We extract sheet structure and sample values. GLM-5.3-Flash proposes apps, and GLM-5.3 generates and edits a bounded JSON specification. We validate exact sheet columns and retry invalid output once. The runtime enforces the app’s configured row and field rules. Nebius receives selected schema, samples and builder prompts.

We compared five matched tasks at high effort. GLM-5.3 had a thirteen percent lower median latency, while Flash met one more task checklist. Both passed all schema checks. This is a small pilot, with a quality and latency tradeoff.

Product defaults: zai-org/GLM-5.3-Flash low effort for suggestions and zai-org/GLM-5.3 high effort for generation/editing. Benchmark used high effort for both. Calculation: (5.352 - 4.640)/5.352 = 13.3%, rounded. Ten responses, one per fixture/model, static spec review, no end-to-end correctness claim or cost measurement. Evidence: docs/submission/evidence/README.md and results.json. Both missed a required task-table shape. GLM also missed an RSVP identity setting. Backend stores identity, OAuth tokens and cached samples. Generated policy needs review. Configuration restore does not undo sheet edits. Claude assisted product development, Codex assisted submission/evaluation. No closed-model inference in the reviewed product path.

## 6. The market extends beyond software teams

3:40–4:25. Software developers are about one percent of U.S. employment. Business and financial operations alone account for about eleven-point-four million jobs. Our initial segment is Finance and Ops teams using Sheets for recurring workflows, with team subscriptions as the business-model hypothesis. The larger opportunity is making software useful for people outside development. Our Jevons thesis is that lower creation cost unlocks enough new uses that total software creation grows. Temporary apps for one task or cycle become economical. We still need to validate paid demand and price.

Sources: BLS Occupational projections and worker characteristics, table 1.2, 2025–35, https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm , accessed 23 September 2026. All jobs 170,280.8 thousand, software developers 1,717.8 thousand, business and financial operations 11,368.5 thousand. Developer share=1.0088%. Role counts are U.S. population context, not unique buyer counts, software revenue, global market share, or proven addressable customer counts. TAM would require eligible organizations/workflows multiplied by validated annual price. Jevons-style demand expansion is a thesis, not an inevitability: lower unit cost can increase total consumption when induced demand outweighs efficiency gains. AI analogy: Satya Nadella, 26 January 2025, https://news.microsoft.com/recent-news/page/3/ .

## 7. Amos Haviv

4:25–4:45. I’m Amos Haviv, an engineering leader at Booking.com. I have twenty years of experience building software and ten years leading teams. I co-created and maintained MEAN and wrote two books about it. Today my focus is developer productivity and AI-native software development. AutoApps brings that building power to business teams.

Source and portrait: https://www.linkedin.com/in/amoshaviv/ , accessed 23 September 2026. Experience figures are self-reported in the About section. Employer reference supplies professional background and does not imply employer affiliation with or endorsement of AutoApps. Only public professional profile details are used.

## Judging coverage

| Criterion | Slides |
| --- | --- |
| Product and user value, 25% | 2–4: business users, automatic generation from existing context, source-sheet update |
| Problem and company potential, 20% | 2 and 6: adoption gap, initial segment, workforce context, subscription and demand-expansion thesis |
| Measurable model advantage, 20% | 5: Flash baseline, observed median latency and static task checklist comparison |
| Technical execution and Token Factory use, 20% | 5: both Nebius-hosted models, distinct roles, validation and bounded runtime |
| Demo clarity, 10% | 4: one budget workflow, ending with a visible source-cell update |
| Responsible design, 5% | 3 and 5: authorized access, configured row/field rules and model data disclosure |

## Stage readiness

Publish the final deck to a public browser viewer and test the exact link in incognito without sign-in. This has not yet been done. Rehearse the deployed product on the stage browser, including a distinct consumer account. Keep a clearly identified pre-generated app available if live generation overruns. Do not describe configured app permissions as automatic inheritance of every source-system policy, or ephemeral usage as an implemented automatic expiry mechanism.

## Sources

- [McKinsey, State of AI 2026](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai): quote and chatbot/agent scaling figures.
- [BLS, 2025 employment and 2025–35 projections](https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm): role counts and developer share. These are workforce scale figures, not a revenue TAM.
- [Microsoft, January 26, 2025](https://news.microsoft.com/recent-news/page/3/): Nadella’s application of Jevons’ paradox to AI. AutoApps demand expansion is our own thesis.
- [Amos Haviv on LinkedIn](https://www.linkedin.com/in/amoshaviv/): professional background and portrait, accessed September 23, 2026.
- [Model pilot evidence](evidence/README.md): protocol, raw outputs, static checklist review and limitations.
