# AutoApps — minimal model comparison

Purpose: turn feasibility observations into a defensible answer to “Measurable model advantage.” A first pilot is now complete: see [measured results and raw evidence](evidence/README.md). It used one trial per fixture per model, ten successful API responses. The three-repeat protocol below remains a proposed follow-up, not completed work.

## Existing evidence

Source: `docs/DECISIONS.md`, P2-4, dated 23 September 2026.

| Case | Model | Recorded latency | Recorded result |
| --- | --- | ---: | --- |
| Budget generation | GLM-5.3, high | 65 s, first call | First-attempt spec validation passed |
| Tasks generation | GLM-5.3, high | 7.0 s | First-attempt spec validation passed |
| Inventory generation | GLM-5.3, high | 8.6 s | First-attempt spec validation passed |
| RSVP generation | GLM-5.3, high | 6.7 s | First-attempt spec validation passed |
| Headcount generation | GLM-5.3, high | 8.6 s | First-attempt spec validation passed |
| Budget edit | GLM-5.3, high | 4.0 s | Justification made required |

The five generation cases support “5/5 passed spec validation in the recorded fixture run.” They do not prove five working deployed apps, a 100% production success rate, or a model advantage. Validation alone does not prove correct user scoping or fulfillment of the request. The development log attributes the long first call to schema grammar compilation, but that cause was not independently verified here. Report the observed latency without asserting a confirmed cause.

The P2-2 toy-schema spike also reports timings for GLM-5.3, GLM-5.3-Flash, and DeepSeek. Its tiny greeting/number task and mixed effort settings make it unsuitable as evidence of relative performance on real app generation.

## Comparison to run

1. Freeze one commit of the prompts, schema, validator, and fixtures. Avoid benchmarking files while the implementation session is editing them.
2. Compare `zai-org/GLM-5.3` with `zai-org/GLM-5.3-Flash` through Nebius, initially with the same supported reasoning effort and token cap. If you instead compare high versus low effort, label the result a comparison of configurations, not an isolated model comparison.
3. Run each model once on the exact schema to record initial-call latency. Report these calls separately from the warm trials.
4. Run the five requests below three times per model: 30 measured generation requests. Alternate model order and call them sequentially to reduce concurrency effects. Do not cherry-pick or discard failures.
5. Record first-attempt validity separately from final success after the allowed retry. Include retries in user-visible elapsed time and cost. Also record raw request latency so waiting, retries, and validation are distinguishable.
6. Check workflow correctness using the acceptance rules below. Inspect the actual outputs, not just their summaries. Use pass/fail per case and include a short failure reason.
7. Optionally run the budget edit three times per model from the same valid starting spec. Do not edit each model’s different generated input if the goal is to isolate edit behavior.

This small test estimates development behavior. It cannot establish production reliability or broad statistical superiority.

## Requests and acceptance rules

| Fixture | Exact request | Workflow acceptance |
| --- | --- | --- |
| Budget | Let each cost-center owner see only their own budget line, edit Q1, Q2, Q3, Q4 and Justification, and see FY2026 Actual as read-only. Do not let unmatched users choose another row. | Match Owner Email to signed-in email. Deny unmatched users. Only the requested fields editable. FY2026 Actual read-only. No other view or metric exposes other owners’ data. |
| Tasks | Show each signed-in assignee all of their tasks, with Due Date and Priority visible. Let them change only Status and Notes. | Filter Assignee by signed-in name in this synthetic fixture. Use a table because one assignee has multiple rows. Only Status and Notes editable. Flag name-based identity as a real-world limitation. |
| Inventory | Create a read-only inventory table sorted by Quantity ascending, with a total Quantity metric. | No invented columns or edit permissions. Correct numeric sort and sum. No invented identity. |
| RSVP | Create an RSVP form for Name, Attending?, Dietary needs and Plus one. Use the signed-in email automatically. | Form appends. Email absent from editable fields, with email identity declared. Do not claim automatic Timestamp population. |
| Headcount | Let each manager see only their reports and edit only Onboarding Complete. Do not show Salary Band. | Filter Manager Email by signed-in email. Support multiple reports. No salary data in any view. No unrestricted secondary view. |

Budget edit: “Make Justification required. Keep every other field, view and access rule unchanged.” Pass only if the required flag changes and the existing data-access rules remain intact.

## What to record

For every request, retain: timestamp, commit, model, effort, fixture, trial, response format, first-attempt validator outcome, retry count, final validator outcome, workflow outcome and reason, total elapsed milliseconds, provider usage, and output spec. Use synthetic fixtures and remove credentials or real identities before publishing.

`callStructured` already returns usage and request time, but `generateSpec` returns only the spec and summary. The existing `try-ai.ts` output therefore needs additional capture to support complete cost accounting. Avoid mistaking completion-token logs for total billed input and output usage.

If measuring cost, use the provider’s current documented billing units and dated rates. Include input, output, applicable reasoning/cache categories, retries, and failed billable calls. Report cost per request and cost per workflow-correct result. Keep initial-call and steady-state latency separate. With only 15 warm trials per model, use the median and full range rather than implying a stable tail-latency estimate.

## Results table to publish

| Measure | GLM-5.3 | GLM-5.3-Flash |
| --- | --- | --- |
| Reasoning effort | Not recorded yet | Not recorded yet |
| First-attempt valid specs | Not measured / 15 | Not measured / 15 |
| Final valid specs after retry | Not measured / 15 | Not measured / 15 |
| Workflow-correct specs | Not measured / 15 | Not measured / 15 |
| Median warm elapsed time | Not measured | Not measured |
| Warm elapsed-time range | Not measured | Not measured |
| Initial-call elapsed time | Not measured | Not measured |
| Cost per workflow-correct result | Not measured | Not measured |

Publish the table with the exact prompts, configurations, fixture definitions, and sanitized raw outputs. A public document or repository page is sufficient. Select the product configuration based on the measured tradeoff, even if the result favors the smaller model.

## Separate product-value measurement

After the full flow works, time sheet connection to published link, then a second account’s update appearing in the source sheet. These are product timings, not model latency. If comparing with manual sheet/form setup, define the same starting state and completion criteria, and record the actual timings rather than estimating “hours saved.”
