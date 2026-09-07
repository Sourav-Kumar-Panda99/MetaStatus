export type AppStatus =
  | "Active"
  | "SDK Problem"
  | "Event Problem"
  | "OTP Problem"
  | "Payment Gateway Issue";

export const APP_STATUSES: AppStatus[] = [
  "Active",
  "SDK Problem",
  "Event Problem",
  "OTP Problem",
  "Payment Gateway Issue",
];

export interface AppRow {
  id: string;
  name: string;
  app_id: string | null;
  status: AppStatus;
  updated_at: string;
  updated_by: string | null;
  created_at: string;
}
