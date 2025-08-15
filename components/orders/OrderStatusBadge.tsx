"use client";

import { Badge } from "@/components/ui/badge";

export type OrderStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";

export default function OrderStatusBadge({ status }: { status: OrderStatus | string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "In Arrears", cls: "bg-orange-500 text-white" },
    PROCESSING: { label: "In Process", cls: "bg-blue-900 text-white" },
    COMPLETED: { label: "Invoiced", cls: "bg-purple-600 text-white" },
    CANCELLED: { label: "Cancelled", cls: "bg-red-500 text-white" },
  };
  const cfg = map[status] ?? { label: String(status), cls: "bg-gray-500 text-white" };
  return <Badge className={cfg.cls}>{cfg.label}</Badge>;
}
