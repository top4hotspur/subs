import { WebsiteTemplateSlug } from "@/lib/sites/types";

export type AdminMetricCard = {
  id: string;
  label: string;
  value: string;
  helperText?: string;
  tone?: "neutral" | "info" | "warning" | "success" | "danger";
};

export type ServicePerformanceSummary = {
  serviceName: string;
  requestCount: number;
  completedCount: number;
  estimatedIncomeGbp: number;
};

export type StaffWorkloadSummary = {
  staffName: string;
  assignedCount: number;
  completedCount: number;
  estimatedIncomeGbp: number;
};

export type FinancialSummary = {
  estimatedGrossIncomeGbp: number;
  confirmedIncomeGbp: number;
  completedIncomeGbp: number;
  unpaidOrPendingGbp: number;
  requestCount: number;
  completedCount: number;
};

export type LocalAnalyticsSummary = {
  industrySlug?: WebsiteTemplateSlug;
  totalRequests: number;
  submittedRequests: number;
  confirmedRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  noShowRequests: number;
  conversionRatePercent?: number;
  financialSummary: FinancialSummary;
  topServices: ServicePerformanceSummary[];
  staffWorkload: StaffWorkloadSummary[];
  generatedAtIso: string;
};
