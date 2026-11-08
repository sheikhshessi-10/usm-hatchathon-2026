> Updated data model: age and modeled prenatal BP are now deterministically adapted from the UCI open dataset, with per-patient row provenance. See REPORTING_AND_OPEN_DATA.md and data/sources/README.md. The original authored case mix and postpartum trajectories below remain synthetic; they are not population calibrated.

# Maternal continuity-of-care synthetic cohort v1

Snapshot: 2026-11-08. Exactly 15 fictional mother–baby dyads. No real records, identifiers, scraped patient data, or inferred diagnoses. Contact numbers use the reserved fictional 555-0100–0199 range. This is a hand-authored, deterministic scenario dataset, not a Synthea export, an LLM-generated clinical record, or an OMOP/FHIR implementation. No random process is used; versioned source reproduces the same snapshot.

## Use cases

| ID | Journey | Demonstration |
| --- | --- | --- |
| m1 | Severe postpartum hypertension | Rising BP, severe reading and headache; urgent assessment pending |
| m2 | Rising postpartum BP | Trend review before scheduled BP appointment |
| m3 | Missed check-in | Missing readings stay missing; contact recovery task |
| m4 | C-section wound | Normal BP does not clear incision redness/drainage |
| m5 | Gestational diabetes | Glucose testing not booked; future due date excluded from due-task KPI |
| m6 | Breastfeeding support | Tenderness and latch difficulty without fever; lactation review |
| m7 | Mood screening | Anxiety/poor sleep; screening task, no depression diagnosis inferred |
| m8 | Anemia follow-up | Fatigue, oral iron, missed appointment and transport barrier |
| m9 | Routine recovery | No current flagged concern; routine contact remains planned |
| m10 | Pelvic recovery | Urinary leakage/perineal discomfort; review and possible referral |
| m11 | New heavy bleeding | Urgent concern despite normal BP; no referral outcome assumed |
| m12 | Diabetes transition | Glucose test scheduled, not yet completed; primary care transition |
| m13 | Access barriers | Two missed calls, missed visit, transport and shared phone issues |
| m14 | Breast symptoms with fever | Urgent clinical assessment, no infection diagnosis inferred |
| m15 | Recovery and reproductive planning | Documented recovery visit; subsequent planning visit scheduled |

Each dyad has two prenatal observations, delivery date and gestational age, discharge day, daily postpartum check-ins, a use-case-specific task, and current review findings. All are in the existing first-ten-days postpartum pilot; prenatal histories provide context, not a live prenatal-monitoring workflow. Later glucose tests and routine follow-ups remain future tasks.

## KPI definitions at this snapshot

- Enrolled: 15 unique mother–baby dyads.
- Calls answered today: 13/15 = 86.7% (UI rounds to 87%). Every dyad has a scheduled check-in at its current postpartum day. Multiple dialing attempts do not inflate the denominator.
- BP captured today: 13/15 = 86.7%. Only answered check-ins with both numeric BP values count. This is data capture, not BP control or clinical recovery.
- Due care tasks completed: 1/8 = 12.5% (UI rounds to 13%). Includes tasks due on or before each patient's current postpartum day; future tests/appointments are excluded. Completion requires a recorded completion day. This metric mixes selected workflow types and is not a clinical quality benchmark.
- Overdue: incomplete task with due day strictly before current postpartum day. Due-today tasks are pending, not overdue.
- Open alerts: patients with any non-green finding whose work item has not been marked handled. Multiple findings do not count as multiple patients. Handling changes workflow state, not the underlying clinical severity.
- History: scheduled call-days answered / recorded scheduled call-days, plus separate total dialing attempts.

The selected cases deliberately demonstrate gaps and urgent concerns. Neither their event mix nor the KPI percentages estimate clinic or population rates. No claim of prevented readmissions, mortality benefit, actual nurse notification, or causal outreach benefit is made. A normal reading does not establish resolution of wound, bleeding, mood, or access concerns. No unseen research report was used to claim prevalence calibration; calibrated population modeling remains a separate task requiring the report and defined target population.

## Source-to-model rationale

- ACOG, Optimizing Postpartum Care: https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2018/05/optimizing-postpartum-care — continuity across physical recovery, mood, feeding, chronic conditions, reproductive planning, and care transitions; BP follow-up timing for hypertensive disorders. These inform scenario coverage, not prevalence weights.
- ACOG, Gestational Diabetes: https://www.acog.org/womens-health/faqs/gestational-diabetes — postpartum diabetes testing at 4–12 weeks; future test tasks fall in this window.
- ADA, Standards of Care in Diabetes—2026, section 15: https://doi.org/10.2337/dc26-S015 — 75-g OGTT at 4–12 weeks postpartum.
- CDC, Urgent Maternal Warning Signs: https://www.cdc.gov/hearher/maternal-warning-signs/index.html — heavy bleeding and fever scenarios require urgent assessment; symptoms are not treated as confirmed diagnoses.

Task due days for lactation, transport, mood, and wound review are authored workflow examples, not universal guideline deadlines. The existing fixed rules are prototype demonstrations and require clinical review before any real use.

## Validation

Run `cd app && npm ci && npm test && npm run build`. Tests check patient uniqueness, prenatal/delivery/postpartum chronology, discharge before home calls, missing readings on unanswered calls, case coverage, non-BP alerts, explicit KPI denominators, empty-cohort behavior, and the separation of handled alerts from clinical recovery.
