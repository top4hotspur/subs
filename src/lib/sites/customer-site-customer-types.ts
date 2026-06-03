export type CustomerSiteCustomerRecord = {
  id: string;
  tenantSiteId: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  marketingOptIn: boolean;
  marketingOptInAt: string | null;
  crmNotes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSiteCustomerSessionSummary = {
  id: string;
  tenantSiteId: string;
  siteSlug: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
};
