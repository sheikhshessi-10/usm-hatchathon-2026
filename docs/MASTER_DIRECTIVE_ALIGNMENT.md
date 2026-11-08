# CareBridge master directive alignment

Working name: CareBridge. Avenlyth remains an uncleared candidate; no rebranding or clearance is claimed. Scope: synthetic Hatchathon demonstration, not clinical deployment.

## Core correction

The original dashboard measured contacts, doctor reviews, and administrative tasks. These remain useful operational indicators, but they do not establish completed clinical follow-up. The Care loops workspace adds separately tracked episodes for two populations. A patient report, finished conversation, scheduled appointment, accepted handoff, or completed administrative action cannot set `verified_closed`.

The evidence gate requires a known synthetic final completion fixture matching the exact patient and order, completion of outstanding handoff tasks, the episode's pinned protocol version, and an explicit doctor-role verification. Its evidence reference, verifier role, timestamp, and protocol version remain in the episode record and audit export. Test values are not interpreted and medical recovery is not inferred.

## Demonstration

### Patient A: postpartum screening

1. Open Care loops. Select Maya Walker and Care coordinator.
2. Confirm demo identity. The initial context is a patient-reported childcare barrier from an earlier interaction.
3. Start an app or SMS interaction. Enter a childcare/scheduling barrier. It remains a patient report.
4. Request a staff coordination handoff, accept it, then complete the administrative action. The care episode remains open.
5. Record a synthetic future appointment if desired. Scheduling is not attendance.
6. Enter “I completed the test.” The episode becomes completion reported, not verified.
7. End the interaction. Switch the demo role to Doctor.
8. Reconcile the matching final lab-completion fixture. This is a local synthetic clinical record, not an EHR fetch.
9. Verify and close the episode. The separately scoped episode KPI changes to 1/2 verified.

### Patient B: chronic-care follow-up

1. Select Daniel Brooks, confirm demo identity, and start SMS.
2. Report frustration with the unresolved scheduling request, then end information collection.
3. Start Voice preview. The same patient's history is retrieved; another patient's records are excluded.
4. Use Speak last response for browser speech when supported. Patient replies are typed; this is not a live AI telephone call or speech-recognition integration.
5. Ask about changing a medication dose. The scripted assistant refuses to advise, ends the ordinary interaction, and records an unaccepted clinical handoff.
6. A coordinator can accept the request, but only the doctor demo role can record completion of clinical/safety review. Evidence verification still has its own gate.

## MVP capability matrix

| Requirement | Implemented now | Remaining boundary |
| --- | --- | --- |
| Synthetic patients and two populations | 15 maternal reporting cases plus two independently scoped episode scenarios | The scenario suite is not included in the 15-patient cohort denominator |
| Clinician and coordinator dashboards | Nurse, Doctor, Reports, Care loops, and Mother views | Role links are not authentication or access control |
| Voice interaction | Browser speech output with typed replies and shared context | No real-time LLM, inbound/outbound carrier calls, microphone transcription, or live voice agent |
| SMS/application interaction | Separate channel-labeled local transcripts | No SMS provider or secure messaging backend |
| Longitudinal memory | Patient scope, source, timestamp, verification label, permission tag, version, retained supersession | Client-side demo rules do not provide production authorization, retention, or research governance |
| Structured barriers | Narrow deterministic access/scheduling patterns and attributed patient reports | No validated LLM extraction or general clinical language understanding |
| Workflow and evidence | Explicit episode states, matching fixtures, human verification, completed-handoff prerequisite | No actual EHR, lab, appointment, or referral integration |
| Conversation endpoints | Information collected, human review, safety interruption, opt-out, technical failure, unsuccessful contact; configurable protocol turn/clarification limits | Conservative phrase checks are demonstrations, not validated clinical detection or crisis assessment |
| Human escalation | Requested, accepted, completed; clinical/safety completion restricted to doctor demo role | No external notification, on-call routing, or emergency dispatch |
| Audit | Versioned, attributed allowed/blocked local events and JSON export | No immutable server log or production audit guarantee |
| Cost model | Configurable blended voice, SMS, staff time, allocated overhead; cost per attempt, processed episode, verified completion | No live vendor quotes, provider usage metering, or measured production economics; missing assumptions give N/A |
| Safety evaluation | Regression tests for patient scope, identity, evidence, role restrictions, version binding, opt-out, bounded dialogue, technical failure, and clinical refusal | This is not a validated safety case or proof of hallucination elimination |

## Product and metric boundaries

- The patient conversation and the care episode have separate state machines.
- Clinical concern routing records a human request. It never says a request has been accepted or that emergency help was dispatched.
- The prototype does not diagnose, prescribe, change medicines, invent results, or declare a patient medically safe.
- The two episode scenarios use fictional identities and institutional fixtures. UCI-derived maternal baseline values and CDC PRAMS references remain separately documented; none establish longitudinal real-patient outcomes.
- Verified completion is a matched synthetic lab-follow-up event, not verified clinical recovery or demonstrated product effectiveness.
- Unsuccessful contact attempts do not count as completed conversations. Repeated blocked requests also consume the bounded interaction's turn allowance.
- Opt-out and safety checks run before the ordinary turn limit. “Childcare stopped me attending” is not treated as a request to stop outreach; negated completion is not recorded as a completion claim.
- A correction preserves the original patient report and marks it superseded. Subsequent retrieval uses active reports only. Institutional fixture records cannot be rewritten as patient corrections.
- Protocol versions are pinned in events and audit records. Unsupported stored versions are retained in browser storage with a warning instead of silently replaying them as a new version.
- Cost inputs are scenario assumptions. Voice duration uses 30 simulated seconds per patient reply, not measured carrier/audio usage. Staff time and overhead are total allocations for the two-episode suite. Incremental cost per additional verified resolution remains unavailable without a legitimate comparison group.

## Next deployment work

Live AI orchestration, channel providers, real authentication and tenancy, server-side policy enforcement, secure storage, immutable audit, clinical integrations, clinician-approved protocols, operational escalation coverage, vendor economics, and applicable privacy/legal/regulatory review remain necessary before real-patient use. Research, sentiment analysis, autonomous clinical functions, and secondary data reuse are not enabled. Market validation, clinician interviews, naming clearance, and causal outcome comparisons are research workstreams, not completed features.
