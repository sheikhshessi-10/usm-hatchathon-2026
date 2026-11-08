# CareBridge (USM Hatchathon 2026, Bio track)

After a mom with high blood pressure leaves the hospital, CareBridge checks on her and her baby every day for 10 days with a voice call that works on any phone. Fixed medical rules sort each answer into green, yellow, or red. Red goes to the nurse right away. Everything builds one record the nurse, the doctor, and the mom can see.

Expo and Finale: Monday, Nov 9, 2026, Thad Cochran Center.

## Run the app

```
cd app
npm install
npm run dev
```

Open the address it prints. Use the switch at the top right for **Nurse view** and **Mom view**. All patients are made up.

```
npm test        # danger rule tests
npm run build   # typecheck + production build
```

## What's here

- `app/` – the web app (React, Vite, Tailwind). Look follows LGS Bid Intelligence.
  - `src/lib/rules.ts` – the danger check (SMFM, MS toolkit, POST-BIRTH, AAP), with tests
  - `src/data/moms.ts` – sample moms
  - `src/nurse/` – nurse screen, `src/mom/` – mom's page
- `care-map.html` – research map: today's workflow, our workflow, rules, call script, sources
- `build-map.html` – build plan and 3-minute demo script
- `current-workflow.md` – written version of today's workflow
- `judging-rubric.png` – the judging rubric
- `index.html` – Continuum, Asjad's care-operations prototype (see below)

---

## Continuum (Asjad's prototype, `index.html`)

A responsive, dependency-free **continuity-of-care clinical operations frontend**.

### Run

Open `index.html` in a browser. No build or installation needed. For local development, run `python3 -m http.server 8000` and visit http://localhost:8000.

### MVP flows

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

### Safety and limitations

**Prototype only — not for clinical use.** All seeded patients are fictional. Do not enter protected health information. There is no authentication, access control, encrypted clinical storage, EHR integration, telephony, transcription, consent management, medical decision support, or actual risk assessment. Priority labels and alerts are hardcoded demonstration data, not clinical recommendations. Simulated check-ins do not place calls. Clinicians must evaluate any real concern using approved workflows.

### Next engineering milestones

1. Define tenant, clinician, patient, care plan, consent, call, event, alert, and task data models.
2. Add secure role-based authentication and audit logs.
3. Implement consent-aware calling and scheduling through a telephony provider.
4. Integrate EHR data via FHIR with appropriate authorization and security controls.
5. Implement structured call summaries, configurable escalation policies, and mandatory human review.
6. Test accessibility, error handling, privacy, security, and clinical safety before using any real patient data.
