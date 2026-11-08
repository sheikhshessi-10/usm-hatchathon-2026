# Continuum — USM Hatchathon 2026

A responsive, dependency-free **continuity-of-care clinical operations frontend**.

## Run

Open `index.html` in a browser. No build or installation needed. For local development, run `python3 -m http.server 8000` and visit http://localhost:8000.

## MVP flows

- Clinic dashboard with patient and care-alert counts
- Searchable patient directory and longitudinal care timelines
- Simulated patient check-ins and call activity
- Clinician review queue for reported concerns
- New patient enrollment and configurable check-in cadence
- Browser-local demo state via localStorage
- Care plan creation and status management
- Follow-up task assignment, due dates, priority, and completion
- Scheduled outreach queue with simulated completion
- Operational analytics across fictional patients and workflow records

## Safety and limitations

**Prototype only — not for clinical use.** All seeded patients are fictional. Do not enter protected health information. There is no authentication, access control, encrypted clinical storage, EHR integration, telephony, transcription, consent management, medical decision support, or actual risk assessment. Priority labels and alerts are hardcoded demonstration data, not clinical recommendations. Simulated check-ins do not place calls. Clinicians must evaluate any real concern using approved workflows.

## Next engineering milestones

1. Define tenant, clinician, patient, care plan, consent, call, event, alert, and task data models.
2. Add secure role-based authentication and audit logs.
3. Implement consent-aware calling and scheduling through a telephony provider.
4. Integrate EHR data via FHIR with appropriate authorization and security controls.
5. Implement structured call summaries, configurable escalation policies, and mandatory human review.
6. Test accessibility, error handling, privacy, security, and clinical safety before using any real patient data.
