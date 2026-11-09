# CareBridge interface audit

Scope covers the public demo shell, patient portal, nurse queue, doctor workspace, care loops, reports, and the new Pip companion. The baseline is main at commit `3bfbeac`.

| Area | Finding | Change in this release |
| --- | --- | --- |
| Shared shell | The fixed pill consumed mobile space, could scroll out of view horizontally, and required different top offsets on every page. | Full-width header in document flow, five visible destinations, current-page indication, and a keyboard skip link. |
| Entry and patient portal | Visitors first landed on the clinical queue and had to find the patient experience themselves. | The Patient portal is the default entry. Existing workspace links continue to work. |
| Nurse queue | The desktop rail took space without offering navigation. Search depended on placeholder text. Fixed minimum metric widths could crowd a narrow grid. | Removed the rail, named the search input, and allowed metric tiles to shrink. |
| Doctor workspace | On small screens, selecting a patient left the review workspace below the queue. | The queue has a shorter mobile scroll area and selection moves focus into the chosen workspace on mobile. |
| Care loops | An unsaved appointment time could carry over when changing scenarios. | The appointment field clears with the rest of the scenario drafts. |
| Reporting and episode audit | Horizontal tables were difficult to discover and operate by keyboard. | Scrollable regions are named and keyboard-focusable. |
| Visitor help | There was no shared entry point for questions about the demo. | Pip answers common typed questions, offers starter prompts, and links to the relevant workspace. The chat is scripted, browser-local, and clears on reload. |

## Verification

Run `npm test` and `npm run build` from `app`. For browser acceptance, exercise the five destinations at phone and desktop widths, open and dismiss Pip by keyboard, try its suggestion and free-text inputs, and verify the doctor queue moves focus to the selected workspace on mobile. Check report scrolling and the Care loops scenario switch with an unsaved appointment draft.

The patient portal's internal task views and the staff workspace content were reviewed at source level. A browser and assistive-technology pass is needed to assess rendered contrast, touch ergonomics, and screen-reader behavior.
