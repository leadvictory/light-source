"use client";

import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import OrderStatusBadge, { type OrderStatus } from "./OrderStatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  isEditing: boolean;
  status: OrderStatus;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDuplicate: () => void;
  setStatus: (s: OrderStatus) => void;
  duplicating?: boolean;
};

export default function OrderToolbar({
  isEditing,
  status,
  onEdit,
  onSave,
  onCancel,
  onDuplicate,
  setStatus,
  duplicating,
}: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? "Edit Order" : "Order Confirmation Form"}
        </h2>
        {isEditing ? (
          <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">In Arrears</SelectItem>
              <SelectItem value="PROCESSING">In Process</SelectItem>
              <SelectItem value="COMPLETED">Invoiced</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <OrderStatusBadge status={status} />
        )}
      </div>

      <div className="flex space-x-2">
        {isEditing ? (
          <>
            <Button onClick={onSave} className="bg-green-600 hover:bg-green-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button onClick={onCancel} variant="outline" className="text-gray-700 border-gray-300 bg-transparent">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onDuplicate} disabled={!!duplicating} className="bg-blue-600 hover:bg-blue-700 text-white">
              {duplicating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Duplicating...
                </>
              ) : (
                "Duplicate Order"
              )}
            </Button>
            <Button onClick={onEdit} variant="outline" className="text-gray-700 border-gray-300 bg-transparent">
              Edit
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
