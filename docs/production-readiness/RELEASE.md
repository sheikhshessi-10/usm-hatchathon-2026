# Release verification

Use the [production app](https://carebridge-hatchathon.vercel.app/) and its [build metadata](https://carebridge-hatchathon.vercel.app/build-info.json) to identify the active deployment. Compare the full `commit` field to [GitHub main](https://github.com/sheikhshessi-10/usm-hatchathon-2026/commits/main/) and require `environment` to be `production`. The build marker reflects the revision built by Vercel.

## Before merging

1. Run `npm ci`, `npm test`, and `npm run build` from `app/`.
2. Serve `app/dist` with `npm run preview` and run the demo scenarios and report downloads in a clean browser session.
3. Check a doctor patient link through refresh and browser history. Check nurse drawer keyboard focus and dismissal. Check both 360px and 390px widths.
4. Run `python scripts/build_open_data.py` from the repository root and check that the generated source matches.

## After merging

1. Find the Git-triggered Vercel deployment for the merged revision. Confirm production metadata matches the full merge SHA.
2. Repeat the scenario and browser checks against production and record the URL, SHA, and result in the release handoff.
3. If the build fails or the SHA differs, inspect deployment status and build logs for that revision. A Vercel project owner can restore a known working production deployment from the project's Deployments page. Recheck the public app and record the restored revision.

The Vite application lives under `app/` and builds to `app/dist/`. Vercel supplies the Git SHA at build time. This is the release process for the synthetic demonstration.
