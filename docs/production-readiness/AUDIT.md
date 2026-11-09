# CareBridge release audit

Scope covers the public Hatchathon demonstration and its fictional data. Baseline main was `112898e19ebd3561128c7d52af19b97d7711be09`.

| Finding | Release change |
|---|---|
| The production marker contained an earlier hardcoded source commit | The build emits its Git commit and environment. The app displays the short SHA. |
| A corrupt workflow could be replaced automatically | The original record stays in browser storage. Editing pauses while the user can export the original or explicitly reset it. Invalid episode history is also preserved and flagged. |
| Doctor deep links could display the previous patient | Patient selection follows the hash, including browser history and refresh. The nurse handoff link carries the patient ID. |
| The nurse drawer lacked keyboard dismissal and focus handling | The drawer receives focus, wraps tab navigation, closes with Escape, and restores the opener's focus. |
| Some outreach copy implied an SMS had been sent | Copy identifies demo activity and the planned check-in cadence. |
| Malformed and backdated events and evidence needed stronger checks | The reducer validates protocol and command shape, prevents reapplication, and rejects events that predate accepted history. Verification rechecks evidence scope, type, final status, chronology, role, and handoffs. |
| Formula-like spreadsheet cells needed additional prefix handling | CSV export neutralizes formula markers and leading tab or line-break characters. |
| Doctor review fields overflowed on a narrow screen | Labels and selectors stack within the available width. |

## Data and reporting

The deterministic generator reproduced the checked-in output from 1,014 UCI observations, 163 distinct eligible baseline tuples, and 15 selected anchors. The UCI catalog count of 1,013 is recorded separately. Authored timelines and operational outcomes are fictional. The separate CDC PRAMS panel uses published 2022 weighted estimates and intervals for participating sites. Its population and measures differ from the cohort's first-ten-day coordination metrics.

A documented review acknowledges a finding. Restored contact requires explicit evidence of patient contact. Due-action completion uses due actions as its denominator. The two care-loop scenarios use evidence-backed closure independently of the 15-person cohort. Direct and fully loaded costs are modeled assumptions. See [Reporting and open data](../REPORTING_AND_OPEN_DATA.md) for definitions and source attribution.

| Capability | Implementation |
|---|---|
| Nurse, doctor, mother, reporting, and episode views | Browser application using synthetic data |
| Role and identity controls | Demonstration controls in the client |
| SMS, voice, and app interactions | Scripted channel simulations in the same workflow |
| Policy and clinical closure | Deterministic reducer and an institutional fixture registry |
| Storage and audit | Browser-local state and episode event log |
| Reports | Cohort CSV, JSON, and print view |
| Carrier delivery, live inference, EHR, authentication, and server authorization | Outside the demo implementation |
| Clinical deployment and measured financial outcomes | Require separate validation |

See [Release verification](RELEASE.md) and [Demo runbook](DEMO_RUNBOOK.md).
