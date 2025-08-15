"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type OrderFormState = {
  purchaseOrderNumber: string;
  contactName: string;
  contactEmail: string;
  building: string;
  tenant: string;
  billing: string;
  salesTax: string;
  phone: string;
  fax: string;
  geConfirmation: string;
  shippingType: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  specialInstructions: string;
  comments: string;
  shippingDetails: string;
};

type Props = {
  value: OrderFormState;
  onChange: (next: Partial<OrderFormState>) => void;
  orderDateLabel?: string;
};

export default function OrderForm({ value, onChange, orderDateLabel = "" }: Props) {
  const set = (k: keyof OrderFormState, v: string) => onChange({ [k]: v });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Order Form</h2>
        {orderDateLabel && (
          <div className="text-right">
            <div className="text-sm text-gray-600">ORDER DATE</div>
            <div className="font-medium">{orderDateLabel}</div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* PO + Contact select (email) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="po-number">PURCHASE ORDER #:</Label>
            <Input
              id="po-number"
              placeholder="enter PO number or order number"
              value={value.purchaseOrderNumber}
              onChange={(e) => set("purchaseOrderNumber", e.target.value)}
            />
          </div>
          <div>
            <Label>CONTACT</Label>
            <Select value={value.contactEmail} onValueChange={(v) => set("contactEmail", v)}>
              <SelectTrigger className="bg-gray-800 text-white">
                <SelectValue placeholder="Select contact email" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="randy@light-source.com">randy@light-source.com</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              placeholder="enter contact Name"
              value={value.contactName}
              onChange={(e) => set("contactName", e.target.value)}
            />
          </div>
          <div>
            <Label>BUILDING</Label>
            <Select value={value.building} onValueChange={(v) => set("building", v)}>
              <SelectTrigger className="bg-gray-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50 Beale St">50 Beale St</SelectItem>
                <SelectItem value="One Market Plaza">One Market Plaza</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              placeholder="enter email"
              value={value.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
          </div>
          <div>
            <Label>TENANT</Label>
            <Select value={value.tenant} onValueChange={(v) => set("tenant", v)}>
              <SelectTrigger className="bg-gray-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7th Floor">7th Floor</SelectItem>
                <SelectItem value="8th Floor">8th Floor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Shipping & Billing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>SHIPPING</Label>
            <Select value={value.shippingType} onValueChange={(v) => set("shippingType", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ground Shipment (3-5 days)">Ground Shipment (3-5 days)</SelectItem>
                <SelectItem value="Express">Express</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>BILLING</Label>
            <Select value={value.billing} onValueChange={(v) => set("billing", v)}>
              <SelectTrigger className="bg-gray-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INVOICE">INVOICE</SelectItem>
                <SelectItem value="NET 30">NET 30</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Address + tax */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ADDRESS 1</Label>
              <Input placeholder="address 1" value={value.address1} onChange={(e) => set("address1", e.target.value)} />
            </div>
            <div>
              <Label>SALES TAX</Label>
              <Select value={value.salesTax} onValueChange={(v) => set("salesTax", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8.5%">8.5%</SelectItem>
                  <SelectItem value="exempt">Tax Exempt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ADDRESS 2</Label>
              <Input placeholder="address 2" value={value.address2} onChange={(e) => set("address2", e.target.value)} />
            </div>
            <div>
              <Label>PHONE</Label>
              <Input placeholder="phone" value={value.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>CITY</Label>
              <Input placeholder="City" value={value.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <Label>FAX</Label>
              <Input placeholder="fax" value={value.fax} onChange={(e) => set("fax", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>STATE</Label>
              <Select value={value.state} onValueChange={(v) => set("state", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CA">California</SelectItem>
                  <SelectItem value="NY">New York</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>GE CONFIRMATION #:</Label>
              <Input placeholder="enter #" value={value.geConfirmation} onChange={(e) => set("geConfirmation", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ZIP</Label>
              <Input placeholder="Postal Code" value={value.zip} onChange={(e) => set("zip", e.target.value)} />
            </div>
            <div />
          </div>
        </div>

        {/* Text Areas */}
        <div className="space-y-4">
          <div>
            <Label>SPECIAL SHIPPING INSTRUCTIONS:</Label>
            <Textarea
              value={value.specialInstructions}
              onChange={(e) => set("specialInstructions", e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <div>
            <Label>COMMENTS:</Label>
            <Textarea value={value.comments} onChange={(e) => set("comments", e.target.value)} className="min-h-[60px]" />
          </div>

          <div>
            <Label>SHIPPING DETAILS</Label>
            <Textarea
              value={value.shippingDetails}
              onChange={(e) => set("shippingDetails", e.target.value)}
              className="min-h-[60px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
