# CareBridge (USM Hatchathon 2026, Bio track)

CareBridge demonstrates continuity of maternal care across outreach, nurse triage, doctor review, and follow-up actions. Fifteen synthetic care journeys cover postpartum BP concerns, diabetes follow-up, wound and breast concerns, mood screening, anemia, pelvic recovery, access barriers, and routine recovery. This frontend uses recorded synthetic check-ins; it does not place calls, notify clinicians, prescribe, or send referrals.

Expo and Finale: Monday, Nov 9, 2026, Thad Cochran Center.

## Run the app

```
cd app
npm install
npm run dev
```

Open the address it prints. Use the switch at the top right for **Nurse view**, **Doctor view**, **Mom view**, and **Reports**. All patients are made up.

```
npm test        # danger rule tests
npm run build   # typecheck + production build
```

## What's here

- `app/` – the web app (React, Vite, Tailwind). Look follows LGS Bid Intelligence.
  - `src/lib/rules.ts` – the danger check (SMFM, MS toolkit, POST-BIRTH, AAP), with tests
  - `src/data/moms.ts` – sample moms
  - `src/nurse/` – nurse screen, `src/doctor/` – doctor portal, `src/mom/` – mother's page
  - `src/data/workflow.tsx` – shared browser-local reviews, care actions, and continuity measures
- `docs/REPORTING_AND_OPEN_DATA.md` – source-backed baseline selection, KPI definitions, charts and exports
- `data/sources/` – pinned UCI CSV and published CDC PRAMS aggregate extracts
- `scripts/build_open_data.py` – reproducible open-data preparation
- `docs/DOCTOR_PORTAL.md` – doctor journey, KPI definitions, and demo limitations
- `care-map.html` – research map: today's workflow, our workflow, rules, call script, sources
- `build-map.html` – build plan and 3-minute demo script
- `current-workflow.md` – written version of today's workflow
- `judging-rubric.png` – the judging rubric

