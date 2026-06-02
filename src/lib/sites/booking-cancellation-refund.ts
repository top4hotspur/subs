import type { CustomerSiteBookingRecord } from "@/lib/sites/customer-site-booking-types";

export type BookingRefundGuidanceInput = {
  booking: Pick<CustomerSiteBookingRecord, "startDateTime" | "preferredDate" | "preferredTime" | "paymentStatus" | "paymentMethod">;
  fullRefundNoticeDays?: number | null;
  noRefundWithinDays?: number | null;
  now?: Date;
};

export type BookingRefundGuidance = {
  refundStatus: NonNullable<CustomerSiteBookingRecord["refundStatus"]>;
  refundGuidance: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function bookingStartDate(booking: BookingRefundGuidanceInput["booking"]): Date | null {
  if (booking.startDateTime) {
    const date = new Date(booking.startDateTime);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (booking.preferredDate && booking.preferredTime) {
    const date = new Date(`${booking.preferredDate}T${booking.preferredTime}:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function hasPaymentToReview(booking: BookingRefundGuidanceInput["booking"]): boolean {
  return booking.paymentStatus === "PAID" || booking.paymentStatus === "PAYMENT_COMPLETED";
}

export function getBookingRefundGuidance(input: BookingRefundGuidanceInput): BookingRefundGuidance {
  if (!hasPaymentToReview(input.booking)) {
    return {
      refundStatus: "NOT_REQUIRED",
      refundGuidance: "Based on the current payment state, no refund is required.",
    };
  }

  const start = bookingStartDate(input.booking);
  const now = input.now ?? new Date();
  const fullRefundNoticeDays = input.fullRefundNoticeDays;
  const noRefundWithinDays = input.noRefundWithinDays;

  if (!start || fullRefundNoticeDays === null || fullRefundNoticeDays === undefined || noRefundWithinDays === null || noRefundWithinDays === undefined) {
    return {
      refundStatus: "REVIEW_REQUIRED",
      refundGuidance: "Based on the configured policy, refund eligibility needs manual review.",
    };
  }

  const daysUntilBooking = (start.getTime() - now.getTime()) / MS_PER_DAY;

  if (daysUntilBooking >= fullRefundNoticeDays) {
    return {
      refundStatus: "FULL_REFUND_ELIGIBLE",
      refundGuidance: `Based on the configured policy, this cancellation appears eligible for a full refund because it is at least ${fullRefundNoticeDays} day(s) before the appointment.`,
    };
  }

  if (daysUntilBooking <= noRefundWithinDays) {
    return {
      refundStatus: "NO_REFUND_RECOMMENDED",
      refundGuidance: `Based on the configured policy, no refund is recommended because this cancellation is within ${noRefundWithinDays} day(s) of the appointment.`,
    };
  }

  return {
    refundStatus: "REVIEW_REQUIRED",
    refundGuidance: "Based on the configured policy, this cancellation falls between refund windows and needs manual review.",
  };
}

export function cancellationRefundEmailLine(booking: Pick<CustomerSiteBookingRecord, "paymentStatus" | "paymentMethod" | "refundStatus">): string {
  if (booking.refundStatus === "REFUNDED") return "A refund has been processed.";
  if (booking.paymentStatus === "PAID" || booking.paymentStatus === "PAYMENT_COMPLETED") {
    return "The business will contact you about any payment or refund.";
  }
  if (booking.paymentStatus === "PENDING") {
    return "The business will contact you about any pending payment.";
  }
  return "No online payment was taken.";
}
