export type CustomerSiteAdminUserRecord = {
  id: string;
  tenantSiteId: string;
  email: string;
  displayName: string | null;
  role: "OWNER" | "ADMIN";
  active: boolean;
  invitationStatus: "INVITED" | "ACTIVE" | "DISABLED";
  accessCodeHash: string | null;
  createdAt: string;
  updatedAt: string;
};

