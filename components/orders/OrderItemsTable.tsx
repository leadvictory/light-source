"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type OrderItem = {
  tenant: string;
  itemCode: string;
  description: string;
  unitPrice: number;
  unitsOrdered: number;
  itemSubtotal: number;
};

type Props = {
  items: OrderItem[];
  isEditing: boolean;
  onChangeItem: (index: number, field: keyof OrderItem, value: string | number) => void;
};

export default function OrderItemsTable({ items, isEditing, onChangeItem }: Props) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">ORDER Details</h3>

      <div className="bg-gray-800 text-white p-3 rounded-t grid grid-cols-7 gap-2 text-sm font-medium">
        <div>Tenant</div>
        <div>Item Code</div>
        <div className="col-span-2">Lamp Description</div>
        <div>Unit Price</div>
        <div>Units Ordered</div>
        <div>Item Subtotal</div>
      </div>

      <div className="border border-t-0 rounded-b">
        {items.map((item, index) => (
          <div key={index} className="p-3 border-b last:border-b-0">
            <div className="grid grid-cols-7 gap-2 items-center text-sm">
              <div>
                {isEditing ? (
                  <Input value={item.tenant} onChange={(e) => onChangeItem(index, "tenant", e.target.value)} className="text-xs" />
                ) : (
                  item.tenant
                )}
              </div>
              <div>
                {isEditing ? (
                  <Input value={item.itemCode} onChange={(e) => onChangeItem(index, "itemCode", e.target.value)} className="text-xs font-medium" />
                ) : (
                  <span className="font-medium">{item.itemCode}</span>
                )}
              </div>
              <div className="col-span-2">
                {isEditing ? (
                  <Textarea
                    value={item.description}
                    onChange={(e) => onChangeItem(index, "description", e.target.value)}
                    className="text-xs"
                    rows={2}
                  />
                ) : (
                  item.description
                )}
              </div>
              <div>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => onChangeItem(index, "unitPrice", Number.parseFloat(e.target.value) || 0)}
                    className="text-xs"
                  />
                ) : (
                  `$${item.unitPrice.toFixed(2)}`
                )}
              </div>
              <div>
                {isEditing ? (
                  <Input
                    type="number"
                    value={item.unitsOrdered}
                    onChange={(e) => onChangeItem(index, "unitsOrdered", Number.parseInt(e.target.value) || 0)}
                    className="text-xs"
                  />
                ) : (
                  item.unitsOrdered
                )}
              </div>
              <div>${item.itemSubtotal.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
