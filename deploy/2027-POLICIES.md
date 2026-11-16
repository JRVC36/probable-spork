# Approved policy updates

- Family Camp: one reservation and one $100 deposit per family. Existing balance deadline (two weeks before the stay) and full-refund cancellation window (more than 30 days before the stay) apply to both three- and six-night stays.
- Registration records a deposit/full-payment preference; it does not collect payment or assert a paid status. Zeffy camp checkout is not implemented by this change.
- Wednesday checkout: 10 a.m.; check-in: 4 p.m. Sunday check-in remains 3–4:30 p.m., Saturday checkout 9–10 a.m.
- $40 sibling and $50 additional-week discounts may stack. Staff confirm applicability; no automatic Family/Adult Camp discount calculation is introduced.
- Standard retreat meals: $30/person/day, separately from rental rates; custom menus are quoted individually.
- Staff may confirm a courtesy hold up to one week before the existing 25% retreat deposit is required. Existing retreat cancellation and balance policies remain unchanged.
- Registration/health records: up to seven years. Updating policy copy does not implement deletion; staff must maintain an appropriate retention/disposal process.

## Deploy
Publish rebuilt HTML and redeploy the forms Apps Script version, retaining Turnstile properties. Add **S1: Payment preference** to the existing Registrations Sheet, after P–R (Stay option, Adult occupancy, Family members and ages). No existing columns were reordered. The new value is `deposit` or `full`; it is a preference, not payment confirmation. Legacy requests without this field remain accepted; unexpected nonempty values are rejected.

No calendar entries, spreadsheet headers, deployment settings, or actual retention jobs were changed remotely.
