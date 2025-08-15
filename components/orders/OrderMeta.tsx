"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type OrderMetaData = {
  purchaseOrderNumber: string;
  orderPlacedBy: string;
  orderDate: string; // read-only
  buildingUnit: string;
  shipping: string;
  address: string;
  paymentType: string;
  email: string;
  phone: string;
  fax: string;
  geConfirmation: string;
  specialInstructions: string;
  comments: string;
  shippingDetails: string;
};

type Props = {
  value: OrderMetaData;
  isEditing: boolean;
  onChange: (patch: Partial<OrderMetaData>) => void;
};

export default function OrderMeta({ value, isEditing, onChange }: Props) {
  const set = (k: keyof OrderMetaData, v: string) => onChange({ [k]: v });

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">PURCHASE ORDER #:</Label>
            {isEditing ? (
              <Input value={value.purchaseOrderNumber} onChange={(e) => set("purchaseOrderNumber", e.target.value)} className="mt-1" />
            ) : (
              <div className="text-gray-900">{value.purchaseOrderNumber}</div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">ORDER PLACED BY:</Label>
            {isEditing ? (
              <Input value={value.orderPlacedBy} onChange={(e) => set("orderPlacedBy", e.target.value)} className="mt-1" />
            ) : (
              <div className="text-gray-900">{value.orderPlacedBy}</div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">ORDER DATE:</Label>
            <div className="text-gray-900 bg-gray-100 px-3 py-2 rounded border">{value.orderDate} (Read-only)</div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">BUILDING UNIT:</Label>
            {isEditing ? (
              <Input value={value.buildingUnit} onChange={(e) => set("buildingUnit", e.target.value)} className="mt-1" />
            ) : (
              <div className="text-gray-900">{value.buildingUnit}</div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">SHIPPING:</Label>
            {isEditing ? (
              <Select value={value.shipping} onValueChange={(v) => set("shipping", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ground Shipment (3-5 days)">Ground Shipment (3-5 days)</SelectItem>
                  <SelectItem value="Express Shipment (1-2 days)">Express Shipment (1-2 days)</SelectItem>
                  <SelectItem value="Overnight">Overnight</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="text-gray-900">{value.shipping}</div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">ADDRESS:</Label>
            {isEditing ? (
              <Textarea value={value.address} onChange={(e) => set("address", e.target.value)} className="mt-1" rows={4} />
            ) : (
              <div className="text-gray-900 whitespace-pre-line">{value.address}</div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">PAYMENT TYPE:</Label>
            {isEditing ? (
              <Select value={value.paymentType} onValueChange={(v) => set("paymentType", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Invoice">Invoice</SelectItem>
                  <SelectItem value="NET 30">NET 30</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="text-gray-900">{value.paymentType}</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">E-MAIL:</Label>
            {isEditing ? (
              <Input value={value.email} onChange={(e) => set("email", e.target.value)} className="mt-1" />
            ) : (
              <div className="text-blue-600">
                {value.email.split(", ").map((em, i) => (
                  <div key={i}>{em}</div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">PHONE:</Label>
            {isEditing ? (
              <Input value={value.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1" />
            ) : (
              <div className="text-gray-900">{value.phone}</div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">FAX:</Label>
            {isEditing ? (
              <Input value={value.fax} onChange={(e) => set("fax", e.target.value)} className="mt-1" />
            ) : (
              <div className="text-gray-900">{value.fax}</div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">GE CONFIRMATION #:</Label>
            {isEditing ? (
              <Input value={value.geConfirmation} onChange={(e) => set("geConfirmation", e.target.value)} className="mt-1" />
            ) : (
              <div className="text-gray-900">{value.geConfirmation || "-"}</div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6 space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-700">SPECIAL SHIPPING INSTRUCTIONS:</Label>
          {isEditing ? (
            <Textarea value={value.specialInstructions} onChange={(e) => set("specialInstructions", e.target.value)} className="mt-1" rows={2} />
          ) : (
            <div className="text-gray-900">{value.specialInstructions}</div>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700">COMMENTS:</Label>
          {isEditing ? (
            <Textarea value={value.comments} onChange={(e) => set("comments", e.target.value)} className="mt-1" rows={2} />
          ) : (
            <div className="text-gray-900">{value.comments || "-"}</div>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700">SHIPPING DETAILS:</Label>
          {isEditing ? (
            <Textarea value={value.shippingDetails} onChange={(e) => set("shippingDetails", e.target.value)} className="mt-1" rows={2} />
          ) : (
            <div className="text-gray-900">{value.shippingDetails || "-"}</div>
          )}
        </div>
      </div>
    </>
  );
}
