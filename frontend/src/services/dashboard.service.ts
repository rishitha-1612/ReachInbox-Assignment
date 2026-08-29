import { api } from "@/lib/api";

export interface DashboardStats {
  total: number;
  scheduled: number;
  sent: number;
  failed: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get(
    "/dashboard/stats",
  );

  return response.data.data;
}