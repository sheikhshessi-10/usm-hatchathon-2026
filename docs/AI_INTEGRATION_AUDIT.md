# CareBridge AI integration audit

| Surface | Current implementation | Integration needed |
|---|---|---|
| Patient portal | Fictional profiles, recorded calls, browser-local mood check-ins | Authenticated access and persistent records before using clinic data |
| Pip | Local typed guide, with an optional server-side model for two preset demo topics | Configure the demo model and access code, then verify a live request |
| Care loops | Scripted SMS and voice simulations, rule-based escalation and evidence verification | Channel delivery, staff queues, and durable event storage |
| Nurse and doctor dashboards | Browser-local workflow, simulated roles, deterministic policy | Server-enforced patient and role permissions, clinician review, and audit events |
| Reports | Synthetic cohort and episode metrics with CSV and JSON exports | Real clinic orders and timestamps before measuring pilot outcomes |
| EHR integration | Completion fixtures | Clinic-approved patient and order matching, permissions, and review |

The guide sends only a fixed product fact selected by an allowlisted topic ID. Typed questions remain in the browser. The model receives no patient fields and has no tools to act on the workflow. Keep clinical rules, escalation and final closure under explicit workflow and clinician control. Future AI features can draft administrative summaries for staff review after the data access and evaluation requirements are met.

## Demo setup

For the Vercel project rooted at `app`, configure `CAREBRIDGE_GUIDE_MODEL` and a strong `CAREBRIDGE_GUIDE_ACCESS_CODE` as server-side environment variables. Configure `AI_GATEWAY_API_KEY` or use Vercel's runtime OIDC token. Use an environment with an explicit gateway spend limit before sharing the code. Enter the code under **Live guide access** and select one of the first two suggested topics. Verify a successful model response and confirm an invalid code or unavailable provider still leaves the local guide usable. The endpoint has been checked against mocked responses. Live provider verification requires configured credentials.
