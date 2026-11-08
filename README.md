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
