export type CustomerSitePaymentPolicySettings = {
  acceptCardPayments?: boolean | null;
  acceptCashPayments?: boolean | null;
  requireBookingPrepayment?: boolean | null;
  allowInStorePaymentRecording?: boolean | null;
  paymentProcessorSetupMode?: string | null;
  paymentProcessorName?: string | null;
  paymentProcessorAccountRef?: string | null;
  paymentProviderConnected?: boolean | null;
  paymentProviderCheckoutEnabled?: boolean | null;
};

export type CustomerSiteBookingPaymentDecision = {
  canCreateBooking: boolean;
  publicCopy: string;
  blockedReason: "ONLINE_PAYMENT_NOT_CONNECTED" | "NO_PAYMENT_METHOD" | null;
  paymentStatus: "NOT_REQUIRED" | "PENDING";
  paymentMethod: "NONE" | "CASH" | "MANUAL" | "CARD_ONLINE";
  requiresOnlinePrepayment: boolean;
  onlineCheckoutAvailable: boolean;
};

const ONLINE_PAYMENT_NOT_CONNECTED_COPY =
  "This business requires payment before online booking, but online payment is not connected yet. Please contact the business to book.";

const ONLINE_PAYMENT_CONNECTED_CHECKOUT_DISABLED_COPY =
  "Online payment setup is connected but checkout is not enabled yet. Please contact the business to book.";

const NO_PAYMENT_METHOD_COPY =
  "This business does not currently have a payment method available for online booking. Please contact the business to book.";

export function getSubscriberCheckoutAvailable(): boolean {
  // Subscriber-site payment processors are deliberately not connected yet. Platform Stripe billing
  // is separate and must not be treated as a business customer's booking checkout.
  return false;
}

export function getCustomerSiteBookingPaymentDecision(
  settings: CustomerSitePaymentPolicySettings | null | undefined,
): CustomerSiteBookingPaymentDecision {
  const acceptCardPayments = Boolean(settings?.acceptCardPayments);
  const acceptCashPayments = Boolean(settings?.acceptCashPayments);
  const requireBookingPrepayment = Boolean(settings?.requireBookingPrepayment);
  const allowInStorePaymentRecording = Boolean(settings?.allowInStorePaymentRecording);
  const providerConnected = Boolean(settings?.paymentProviderConnected);
  const onlineCheckoutAvailable = Boolean(settings?.paymentProviderCheckoutEnabled) && getSubscriberCheckoutAvailable();
  const manualPaymentAllowed = acceptCashPayments || allowInStorePaymentRecording;

  if (requireBookingPrepayment && acceptCardPayments && providerConnected && !onlineCheckoutAvailable) {
    return {
      canCreateBooking: false,
      publicCopy: ONLINE_PAYMENT_CONNECTED_CHECKOUT_DISABLED_COPY,
      blockedReason: "ONLINE_PAYMENT_NOT_CONNECTED",
      paymentStatus: "PENDING",
      paymentMethod: "CARD_ONLINE",
      requiresOnlinePrepayment: true,
      onlineCheckoutAvailable,
    };
  }

  if (requireBookingPrepayment && acceptCardPayments && !onlineCheckoutAvailable) {
    return {
      canCreateBooking: false,
      publicCopy: ONLINE_PAYMENT_NOT_CONNECTED_COPY,
      blockedReason: "ONLINE_PAYMENT_NOT_CONNECTED",
      paymentStatus: "PENDING",
      paymentMethod: "CARD_ONLINE",
      requiresOnlinePrepayment: true,
      onlineCheckoutAvailable,
    };
  }

  if (requireBookingPrepayment && !acceptCardPayments && !manualPaymentAllowed) {
    return {
      canCreateBooking: false,
      publicCopy: NO_PAYMENT_METHOD_COPY,
      blockedReason: "NO_PAYMENT_METHOD",
      paymentStatus: "PENDING",
      paymentMethod: "MANUAL",
      requiresOnlinePrepayment: false,
      onlineCheckoutAvailable,
    };
  }

  if (requireBookingPrepayment && manualPaymentAllowed) {
    return {
      canCreateBooking: true,
      publicCopy: "Payment will be arranged directly with the business before your booking is completed.",
      blockedReason: null,
      paymentStatus: "PENDING",
      paymentMethod: acceptCashPayments ? "CASH" : "MANUAL",
      requiresOnlinePrepayment: false,
      onlineCheckoutAvailable,
    };
  }

  if (acceptCashPayments || allowInStorePaymentRecording) {
    return {
      canCreateBooking: true,
      publicCopy: "No payment is taken online for this booking. Payment will be arranged directly with the business.",
      blockedReason: null,
      paymentStatus: "PENDING",
      paymentMethod: acceptCashPayments ? "CASH" : "MANUAL",
      requiresOnlinePrepayment: false,
      onlineCheckoutAvailable,
    };
  }

  return {
    canCreateBooking: true,
    publicCopy: "No payment is taken online for this booking.",
    blockedReason: null,
    paymentStatus: "NOT_REQUIRED",
    paymentMethod: "NONE",
    requiresOnlinePrepayment: false,
    onlineCheckoutAvailable,
  };
}

export function customerSitePaymentBlockMessage(reason: CustomerSiteBookingPaymentDecision["blockedReason"]): string {
  if (reason === "ONLINE_PAYMENT_NOT_CONNECTED") return ONLINE_PAYMENT_NOT_CONNECTED_COPY;
  if (reason === "NO_PAYMENT_METHOD") return NO_PAYMENT_METHOD_COPY;
  return "This booking cannot be completed online right now. Please contact the business to book.";
}
