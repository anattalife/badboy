/**
 * Applicant authorization shown above the submit button and stored with each application.
 * DRAFT: have the dealership's lender(s) and attorney review this wording before launch.
 * The exact text shown is saved with every application.
 */
export const consentText = (legalName: string) =>
  `I certify that the information in this application is true and complete. I authorize ${legalName} ` +
  'and the lenders it works with to obtain my credit report and to verify the information in this application ' +
  'in order to evaluate my request for financing. I understand that submitting this application does not ' +
  'guarantee approval, and that the lender decides whether to extend credit and on what terms.'
