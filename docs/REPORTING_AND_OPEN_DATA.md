# Reporting and open-data model

Open Reports in the role navigation or `#reports`. Filter by care pathway to update the snapshot cards, independent milestone charts, recorded outreach history, care-action inventory, patient report, and exports. Population reference panels remain fixed and separately identified. CSV contains only the selected patient rows; JSON includes scoped KPI numerators/denominators, definitions, selected patients, source provenance, and limitations. Print report opens browser printing.

## Source-backed sample logic

The original 15 fictional cases remain distinct use cases. Their ages and modeled prenatal baseline BP now come from an actual downloaded UCI CSV using a deterministic, auditable selection. Each patient has a source observation number and explicit adapted fields. Later pregnancy observations and all postpartum events remain authored simulations. This is a dataset-grounded synthetic cohort, not 15 real longitudinal postpartum patients.

Rebuild with `python scripts/build_open_data.py`. Inputs are committed under `data/sources/`. Source selection uses adult age, baseline BP, temperature, and pulse eligibility, tuple deduplication, and a fixed SHA-256 seed ordering. The filter deliberately selects plausible baseline observations and does not reproduce population rates. Dataset risk labels are not used by CareBridge's triage engine. The full source count discrepancy and geographic limitations are disclosed in the UI and source documentation.

CDC PRAMS 2022 aggregate tables supply three contextual estimates: postpartum checkup, postpartum depressive symptoms, and postpartum insurance absence. Each has its source sheet/row, weighted estimate, published CI, and unweighted response counts. These have different populations, periods, and definitions from this ten-day pilot, so we do not compute performance gaps against them. `scripts/extract_prams.py` reproduces the pinned aggregate extract from the downloaded original workbook.

## KPI interpretation

- Urgent reviews pending: urgent selected patients without a documented doctor acknowledgement / urgent selected patients. Acknowledgement does not resolve the clinical finding.
- Due actions completed: completed actions due on or before each patient's current postpartum day / all such due actions. Future tasks excluded.
- Overdue actions: incomplete actions with due day before current postpartum day. Due today is a separate inventory category.
- Restored contact: initially unreached selected patients whose latest explicit contact outcome is reached / initially unreached selected patients.
- Handoff acceptance: explicitly accepted doctor-assigned care actions / doctor-assigned care actions.
- Assigned handoffs accepted and completed: doctor-assigned actions both accepted and completed / doctor-assigned actions.
- Review coverage: unique selected patients reviewed / selected patients.

No denominator means N/A, not zero performance. Milestones have independent eligibility and are not a nested funnel. The care-action inventory reconciles completed, overdue, due-today, and future actions. Recorded outreach is plotted by actual modeled calendar dates derived from delivery plus postpartum day; unrecorded historical schedules are not imputed. A daily bar's label is answered / recorded scheduled call-days, not attempts or unique people across all days.

The scenario date is fixed. Browser-local reviews and actions reflect the current session and are not a historical as-of snapshot. Latest check-in coverage uses only patients with a recorded check-in, and restored contact uses patients whose latest recorded check-in was missed. No causal improvement, avoided readmission, mortality reduction, treatment success, time-to-response SLA, or population-representative outcome is inferred. A 15-case enriched demo cannot establish clinical effectiveness.

## Validation

Tests cover source-derived fields and traceability; parsed UCI row counts; PRAMS published values and use of survey weights; scoped denominators; outreach reconciliation; CSV escaping/formula protection; filter behavior; and export generation. Existing cross-role workflow tests remain in place. Run `npm test` and `npm run build` from `app/`.
