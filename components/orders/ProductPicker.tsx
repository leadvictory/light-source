"use client";

import { Button } from "@/components/ui/button";
import { type Product, type ProductAssignment } from "@/lib/supabase";

type ProductWithAssignments = Product & { assignments: ProductAssignment[] };

type Props = {
  products: ProductWithAssignments[];
  onAdd: (product: ProductWithAssignments) => void;
  title?: string;
};

export default function ProductPicker({ products, onAdd, title = "Available Products" }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {products.map((product) => (
          <div key={product.id} className="flex items-center justify-between p-2 border rounded">
            <div className="flex-1">
              <div className="text-sm font-medium">{product.item_number}</div>
              <div className="text-xs text-gray-600">{product.name}</div>
              <div className="text-xs text-green-600">
                ${product.assignments[0]?.client_unit_price || product.base_unit_price}
              </div>
            </div>
            <Button size="sm" onClick={() => onAdd(product)}>
              Add
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
