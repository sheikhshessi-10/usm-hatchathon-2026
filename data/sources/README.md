# Open-source inputs

## UCI Maternal Health Risk

Ahmed, M. (2020). Maternal Health Risk [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C5DP5D

Source: https://archive.ics.uci.edu/static/public/863/maternal+health+risk.zip

License: Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/ . `uci-maternal-health-risk.csv` is the original CSV extracted from the source archive, retaining its UTF-8 BOM. Retrieved 2026-11-08. Source collection: pregnancy observations from hospitals and clinics in rural Bangladesh, not US postpartum patients. Parsed CSV has 1,014 data rows; the UCI catalog states 1,013. We retain and disclose the difference rather than dropping an arbitrary observation. Duplicated observations and implausible values exist; the source labels are not clinical diagnoses or the app's triage rules.

Adaptation: `scripts/build_open_data.py` selects 15 unique eligible adult baseline tuples by deterministic SHA-256 ordering. Observation numbers are 1-based data-row indices excluding the CSV header. Only age and BP are adapted into fictional baseline events. The original risk label, glucose, temperature, and pulse remain reference metadata and do not populate postpartum clinical observations. Week 20 placement, US identities, locations, birth details, medications, symptoms, longitudinal measurements, and workflows are synthetic. The selected cohort is enriched for demonstration cases, not representative of the source or Mississippi.

## CDC PRAMS 2022 published aggregate indicators

CDC, Selected 2016–2022 Maternal and Child Health Indicators: https://www.cdc.gov/prams/php/data-research/mch-indicators-by-site.html

Workbook: https://www.cdc.gov/prams/media/files/2024/08/PRAMS-MCH-Indicators-2022-508.xlsx

Retrieved 2026-11-08. `prams-2022-reference.csv` contains three exact published aggregate rows, retaining unweighted numerator/denominator, weighted estimate, and published 95% CI. `prams-2022-workbook.sha256` pins the original workbook. Download it and run `python scripts/extract_prams.py /path/to/workbook.xlsx` to reproduce the extract. The script rejects a changed workbook pending review. No respondent-level data or restricted PRAMS files were obtained.

Population: only participating 2022 sites that met the release threshold. Mississippi is not in this workbook's aggregated-site list. These estimates are not national census rates and not local clinic targets. The 2022 checkup item belongs to PRAMS Phase 8 and describes a routine checkup around 4–6 weeks; it is not an early BP visit or a first-ten-days workflow completion rate. Postpartum insurance refers to survey completion. Depressive symptoms are self-reported, not diagnosed depression.

Weighted percentages must be read from the published estimate column, not recomputed as unweighted numerator / denominator. These contextual references are displayed separately from CareBridge's synthetic operational measures. No combined patient-level dataset or causal comparison is constructed.
