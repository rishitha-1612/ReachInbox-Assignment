import { api } from "@/lib/api";

export interface Sender {
  id: string;
  email: string;
  displayName: string;
  smtpHost: string;
  smtpPort: number;
  isDefault: boolean;
}

export async function getSenders(): Promise<
  Sender[]
> {
  const response =
    await api.get("/senders");

  return response.data.data;
}