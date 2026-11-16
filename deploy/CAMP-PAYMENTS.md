# Camp payment links

- $100 deposit: https://www.zeffy.com/en-US/ticketing/summer-camp-deposit-4
- Staff-confirmed balance/full amount: https://www.zeffy.com/en-US/ticketing/campsevents

Both public pages were inspected: the first lists a $100 Summer Camp Deposit, the second lists Summer Camp Balance with Pay what you can pricing. No payment was submitted and no campaign settings were changed.

Registration page and acknowledgment emails instruct guests to register first, wait for staff confirmation, and pay the exact staff-approved amount. Family Camp uses one deposit per family reservation. No custom amount, medical/personal data, or registration details are put in payment URLs. No API credentials are required. There is no redirect after registration and no payment-status update merely from clicking a link or returning from checkout.

Staff must reconcile transactions, apply discounts/camperships/previous payments, and send reminders before the two-week balance deadline. Retain payment confirmation references in the appropriate private records. The website does not automatically reconcile Zeffy transactions.

## Zeffy dashboard follow-up
- Change the campaign introductions so payment does not promise enrollment before staff confirmation.
- Add required participant name/session questions (and a registration reference if one is assigned). The public page extraction did not establish these questions exist; verify in an actual checkout without completing payment.
- Confirm the balance option permits legitimate small remaining amounts; do not apply a $100 floor to balances.
- Verify the $100 deposit quantity/instructions make the one-family-reservation rule clear.
- Verify purchase limits, confirmation emails, and receipt/tax settings for tuition separately from charitable donations.

## Rollout
Publish the website and redeploy the forms Apps Script to activate payment links in future acknowledgments. Preserve Turnstile Script Properties. See `2027-POLICIES.md` for the Payment preference Sheet header. Test links and checkout questions on desktop/mobile. No automatic card charges, calculated-amount API checkout, or payment webhook integration is included.
