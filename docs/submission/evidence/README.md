# AutoApps model comparison — 23 September 2026

Small pilot on five synthetic sheet-generation tasks. These are new measurements, separate from the older feasibility timings in `docs/DECISIONS.md`.

| Measure | GLM-5.3 | GLM-5.3-Flash |
| --- | ---: | ---: |
| Reasoning effort | high | high |
| First-attempt schema and sheet validation | 5/5 | 5/5 |
| Predefined task checklist passed | 3/5 | 4/5 |
| Median elapsed time | 4.640 s | 5.352 s |
| Elapsed-time range | 3.672–6.313 s | 3.332–7.231 s |
| Validation retries | 0 | 0 |

**Finding:** Flash satisfied one additional task checklist. GLM-5.3 had lower median latency in this sample. Neither achieved perfect task adherence. This does not establish broad superiority, production reliability, or a cost advantage.

## Method

Both models ran through Nebius Token Factory with identical prompts, structured-output schema, validation rules, high reasoning effort, and a 24,000 completion-token cap. The order alternated by fixture. One request per fixture per model, ten requests total. Latency includes the request and local validation. Server warm state was unknown, and first requests are included. No paid-cost calculation was performed.

The task checklist comes from the previously written `../EVALUATION.md`. Validation results are automated. Checklist outcomes are a manual review of the returned specifications, not rendered-app or end-to-end tests. The tasks case explicitly requires a table showing multiple assigned tasks. The application supports picking between rows in a personal-row view, but that does not meet this checklist's table requirement.

## Case results

| Case | GLM-5.3 | GLM-5.3-Flash |
| --- | --- | --- |
| Budget | Pass, 4.640 s | Pass, 3.332 s |
| Tasks | Fail, 3.672 s | Fail, 7.231 s |
| Inventory | Pass, 4.904 s | Pass, 5.273 s |
| RSVP | Fail, 6.313 s | Pass, 5.352 s |
| Headcount | Pass, 4.401 s | Pass, 7.014 s |

Both task outputs use `my-row` rather than the required multi-row table and allow unmatched names to choose a row. The GLM-5.3 RSVP output omits `identity` even though its summary says the email will be filled automatically. The runtime's append logic fills email only when the corresponding identity configuration exists.

**Product implication:** test Flash as a candidate for more generation work, while adding acceptance checks for requested identity behavior and multi-row workflows. The product's configured generation model was not changed by this evaluation. This test does not compare suggestion performance at low effort or measure editing behavior.

## Reproduction and proof

- `protocol.json`: exact prompts, settings, source commit, and timing definition.
- `results.json`: all ten outputs, validation status, elapsed times, and provider token usage.
- `review.json`: task-level review and failure reasons.
- `summary.json`: aggregate values used in the pitch.
- `evaluate.ts`: evaluation runner. Its relative imports refer to a snapshot of the listed repository files, with matching dependencies and an existing Nebius API key supplied through the environment.

The first attempt from the restricted execution environment failed at the connection layer for all calls. A subsequent authorized network run produced the ten successful API responses above. Connection failures were infrastructure failures, produced no model outputs, and were excluded from inference timing. All returned model outputs from the successful network run are retained, including task failures.

All sheet contents used here are synthetic fixtures. No API keys, OAuth tokens, real spreadsheet IDs, or real sheet contents are in this evidence bundle. Publish the bundle or a sanitized viewer copy to obtain the required public proof link.
