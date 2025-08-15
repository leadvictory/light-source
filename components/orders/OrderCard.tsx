"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type OrderView = {
  id: string;
  order_number: string;
  created_at: string;
  building_id?: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED" | string;
  company_name: string;
  user_name: string;
};

function getStatusBadge(status: string) {
  const m: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "In Arrears", cls: "bg-orange-500 text-white" },
    PROCESSING: { label: "In Process", cls: "bg-blue-900 text-white" },
    COMPLETED: { label: "Invoiced", cls: "bg-purple-600 text-white" },
    CANCELLED: { label: "Cancelled", cls: "bg-red-500 text-white" },
  };
  const cfg = m[status] ?? { label: status, cls: "bg-gray-500 text-white" };
  return <Badge className={cfg.cls}>{cfg.label}</Badge>;
}

function fmt(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" });
}

type Props = {
  order: OrderView;
  onDuplicate?: (order: OrderView) => void;
  companyNameOverride?: string; // if you group by company and want to pass the heading name
};

export default function OrderCard({ order, onDuplicate, companyNameOverride }: Props) {
  const companyLabel = companyNameOverride ?? order.company_name;
  return (
    <Link
      href={`/orders/${order.id}`}
      className="block px-6 py-4 hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg mb-2 mx-4 cursor-pointer hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="text-sm text-gray-600 w-16">{fmt(order.created_at)}</div>
          <div className="flex-1">
            <div className="text-lg font-semibold text-gray-900 mb-1">{order.order_number}</div>
            <div className="text-sm text-gray-600">
              {order.building_id ? "50 Beale Street" : "7thFloor- One Market Plaza"}
            </div>
            <div className="text-sm text-gray-600">{companyLabel}</div>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-sm text-gray-600">Ordered by {order.user_name}</div>
            <div className="text-sm text-blue-600 underline">{order.user_name}@paramountgroup.com</div>
          </div>
          <div className="flex flex-col items-center space-y-2">{getStatusBadge(order.status)}</div>
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-600 bg-blue-50"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDuplicate?.(order);
            }}
          >
            Duplicate order
          </Button>
        </div>
      </div>
    </Link>
  );
}
