"use client";

export default function OrderTotals({
  subtotal,
  salesTax,
  totalAmount,
  taxLabel = "Sales Tax (8.5%):",
}: {
  subtotal: number;
  salesTax: number;
  totalAmount: number;
  taxLabel?: string;
}) {
  return (
    <>
      <div className="mt-4 space-y-2 text-right">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>{taxLabel}</span>
          <span>${salesTax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total Amount:</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
        <strong>Note:</strong> Additional fee for shipping charges will apply (fee to be determined).
      </div>
    </>
  );
}
