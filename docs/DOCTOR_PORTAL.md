# Doctor portal and continuity workflow

Open `#doctor` or choose Doctor view. The same 15 synthetic patients are available to the nurse, doctor, and mother views. `#doctor/m14` opens a particular patient from the nurse's handoff panel.

## Demonstration journey

1. Filter urgent, unreviewed, or overdue cases; search patient, pathway, or county.
2. Select a patient and inspect current findings, prenatal context, discharge, BP history, recorded medicines, barriers, and check-in evidence.
3. Record an assessment and disposition: reviewed, escalation documented, or follow-up handoff requested. A nonblank note is required. Explicitly record contact outcome when known.
4. Assign a care action to Nurse or Doctor with a due postpartum day. The receiving role accepts a doctor-assigned action before recording completion. Nurse assignments are accepted in Nurse view; Doctor assignments in Doctor view. Existing plan actions can be completed by their assigned role. Acceptance and completion timestamps remain separate.
5. Switch to Nurse view to inspect the review and action; the mother view shows the shared care actions. Marking a nurse item handled does not change clinical severity.
6. Return to Doctor view to inspect the updated continuity measures. Browser-local changes survive refresh. Reset demo workflow clears the local demo records after confirmation.

## KPI model

These replace the original call-centric dashboard measures. All are synthetic workflow measures, not evidence of clinical effectiveness.

| Measure | Numerator / denominator or count | Interpretation |
| --- | --- | --- |
| Urgent reviews pending | Urgent patients without any documented doctor review / all patients with current red or red911 findings | Acknowledgement gap; not unresolved medical emergencies or treatment completion |
| Due care actions completed | Completed actions due on or before each patient's current postpartum day / all actions due by that day | Explicit care-action completion; future actions excluded |
| Overdue care actions | Incomplete actions whose due day is strictly before the patient's current postpartum day | Due-today tasks remain pending, not overdue |
| Restored contact documented | Initially unreached patients whose latest recorded contact outcome is reached / initially unreached patients | Requires explicit contact documentation; notes or reviews alone do not count |
| Handoffs accepted | Doctor-assigned actions with an explicit receiving-role acceptance / all doctor-assigned actions | Acceptance is not care completion |
| Handoffs closed | Accepted doctor-assigned actions also marked completed / all doctor-assigned actions | Records a completed action, not clinical recovery |
| Handoffs awaiting acceptance | Incomplete doctor-assigned actions without receiving-role acceptance | Surfaces an unacknowledged handoff |
| Review coverage | Unique patients with a doctor review / enrolled patients | A repeated review does not inflate coverage |
| Follow-up handoff requests recorded | Count of doctor-assigned care actions | Review dispositions alone do not create a tracked handoff |

Baseline for this fixed snapshot: 4/4 urgent patients awaiting doctor review, 1/8 due actions completed (13% rounded), 1 overdue action, 0/2 initially unreached patients with restored contact, and 0/15 reviewed. All counts recompute after actions. Multiple action types are combined for demo operations, not a clinical quality benchmark.

Clinical recovery, response-time SLAs, externally accepted referrals, readmissions prevented, and outreach-vs-no-outreach effects are not inferred. The prototype has no real encounter outcomes or time-stamped inbound events sufficient to calculate these.

## State and access

A shared React provider stores review history, care actions, and nurse notes under a versioned localStorage key. Stored shapes are validated; invalid/incomplete state resets to the synthetic seed. If persistence fails, a banner reports session-only changes. Existing stored demo records remain readable; acceptance is never invented for legacy completed tasks. Role acceptance is a local demonstration action, not verified external receipt. Changes synchronize across views in the same app instance, not across users, devices, or already-open tabs.

Role links switch demonstration views; they are not authentication or authorization. No backend audit log, EHR integration, prescription signing, real alerts, or PHI storage is implemented. Clinical findings retain their original severity after review or task completion. Use synthetic information only.

## Validation

`cd app && npm ci && npm test && npm run build`

Tests exercise KPI denominators, explicit restored contact, persistent-state validation, clinical severity preservation, search and patient selection, review creation, action assignment, receiving-role acceptance, timestamped completion, and doctor-to-nurse-to-mother data continuity through DOM interactions. jsdom is a test-only dependency. Browser visual verification is not part of these automated DOM tests.
