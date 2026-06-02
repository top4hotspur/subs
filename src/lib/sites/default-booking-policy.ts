export const DEFAULT_BOOKING_POLICY_TITLE = "Booking and cancellation policy";

export const DEFAULT_BOOKING_POLICY_BODY =
  "Bookings can be cancelled or changed up to 24 hours before the appointment. Cancellations made with less than 24 hours' notice may not be eligible for a refund where payment has already been taken. If you cannot attend, please contact the business as soon as possible.\n\nWhere no online payment has been taken, the business may still apply its own cancellation/no-show policy.";

export function isCustomPolicyContent(input: {
  policyTitle?: string | null;
  policyIntro?: string | null;
  policyBody?: string | null;
  cancellationPolicyNote?: string | null;
}): boolean {
  return Boolean(
    input.policyTitle?.trim() ||
      input.policyIntro?.trim() ||
      input.policyBody?.trim() ||
      input.cancellationPolicyNote?.trim(),
  );
}
