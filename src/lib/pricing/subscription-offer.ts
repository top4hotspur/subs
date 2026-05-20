import { WebsiteSubscriptionOffer } from "@/lib/sites/types";

export const WEBSITE_SUBSCRIPTION_OFFER: WebsiteSubscriptionOffer = {
  setupFeeGbp: 149,
  monthlyFeeGbp: 30,
  domainRegistrationFeeGbp: 49,
  whatsappAddonMonthlyFeeGbp: 10,
  emailIncluded: true,
  fullFeatureSetIncluded: true,
  summary:
    "One simple website subscription: the demo you customise is the site you get.",
  includedFeatures: [
    "Full industry-specific website",
    "Mobile-friendly design",
    "Customer enquiry/booking flow placeholder",
    "Email notifications included",
    "Website hosting and maintenance",
    "Content updates and ongoing management",
    "Domain connection support",
    "Customer portal planned",
    "Admin portal planned",
  ],
};

export function getWebsiteSubscriptionOffer(): WebsiteSubscriptionOffer {
  return WEBSITE_SUBSCRIPTION_OFFER;
}
