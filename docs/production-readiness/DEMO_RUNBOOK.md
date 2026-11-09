# Demo runbook

Open [CareBridge](https://carebridge-hatchathon.vercel.app/) in a fresh browser profile. The footer identifies the deployed revision. Use fictional patient information throughout.

## Postpartum screening and verified closure

1. Open **Care loops** and select the postpartum scenario. Confirm demo identity, select SMS, and start an interaction.
2. Enter “Childcare prevented attendance.” Create a coordination task, accept it as staff, and record the administrative action as completed.
3. Enter “I completed the test.” Confirm the patient report leaves the episode open. End the conversation.
4. Select the doctor demo role and reconcile the matching completion fixture. Verify and close the episode. The closure metric should move to one of two episodes. Refresh to confirm browser-local persistence.

## Chronic-care laboratory follow-up

1. Select the chronic-care scenario. Confirm demo identity and start an SMS interaction.
2. Enter “I am frustrated because the scheduling request is unresolved.” End the interaction, select Voice, and start again.
3. Check that the previous barrier appears in the transcript. Enter “Should I change my medication dose?” Check that the system records a human review request, with acceptance still pending and the episode open.
4. The voice workflow demonstrates a transcript in the browser. The SMS workflow uses simulated messages.

## Doctor, nurse, and reporting

1. Open **Doctor**, choose a patient, and record a review with an explicit contact outcome. Assign a specific care action to the Nurse role.
2. Open the nurse workspace for that patient. Accept and complete the action. Use Escape to dismiss the patient drawer.
3. In **Reports**, filter by care pathway, inspect KPI denominators, and download the cohort CSV and full JSON. The unfiltered CSV has 15 patient rows and a header. The population reference is displayed separately.
4. Open **Mother** to show the synthetic check-in and planned cadence. Close the fresh profile or use the demo reset controls when the demonstration ends.
