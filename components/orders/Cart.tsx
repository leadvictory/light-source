"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

export type CartItem<TProduct = any> = {
  product: TProduct;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type Props<TProduct> = {
  items: CartItem<TProduct>[];
  onInc: (productId: string) => void;
  onDec: (productId: string) => void;
  onRemove: (productId: string) => void;
  onSubmit: () => void;
  totals: { subtotal: number; taxRate: number; taxAmount: number; total: number };
};

export default function Cart<TProduct extends { id: string; item_number: string; manufacturer?: string; description?: string }>(
  { items, onInc, onDec, onRemove, onSubmit, totals }: Props<TProduct>
) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Shopping Cart Contains:</h3>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Your cart is empty</div>
      ) : (
        <>
          <div className="bg-gray-800 text-white p-3 rounded-t grid grid-cols-6 gap-2 text-sm font-medium">
            <div>Item Code</div>
            <div className="col-span-2">Lamp Description</div>
            <div>Unit Price</div>
            <div>Units Ordered</div>
            <div>Item Subtotal</div>
          </div>

          <div className="border border-t-0 rounded-b">
            {items.map((item) => (
              <div key={item.product.id} className="p-3 border-b last:border-b-0">
                <div className="grid grid-cols-6 gap-2 items-center text-sm">
                  <div className="font-medium">{item.product.item_number}</div>
                  <div className="col-span-2">
                    <div className="font-medium">{item.product.manufacturer}</div>
                    <div className="text-xs text-gray-600 line-clamp-2">{item.product.description}</div>
                  </div>
                  <div>${item.unitPrice.toFixed(2)}</div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => onDec(item.product.id)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button size="sm" variant="outline" onClick={() => onInc(item.product.id)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>${item.totalPrice.toFixed(2)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 bg-transparent"
                      onClick={() => onRemove(item.product.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sales Tax ({(totals.taxRate * 100).toFixed(1)}%):</span>
              <span>${totals.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total Amount:</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
            <strong>Note:</strong> Additional fee for shipping charges will apply (fee to be determined).
          </div>

          <Button className="w-full mt-6 bg-green-600 hover:bg-green-700" onClick={onSubmit} disabled={items.length === 0}>
            Submit Order
          </Button>
        </>
      )}
    </div>
  );
}
