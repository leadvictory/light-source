"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/navbar";
import Header from "@/components/header";
import { supabase, mockProducts, type Product, type ProductAssignment } from "@/lib/supabase";
import OrderForm, { type OrderFormState } from "@/components/orders/OrderForm";
import ProductPicker from "@/components/orders/ProductPicker";
import Cart, { type CartItem } from "@/components/orders/Cart";

type ProductWithAssignments = Product & { assignments: ProductAssignment[] };

export default function NewOrderPage() {
  const [userRole] = useState<"Owner" | "SuperClient" | "Client" | "Tenant">("Owner");
  const router = useRouter();

  const [orderForm, setOrderForm] = useState<OrderFormState>({
    purchaseOrderNumber: "",
    contactName: "",
    contactEmail: "",
    building: "50 Beale St",
    tenant: "7th Floor",
    billing: "INVOICE",
    salesTax: "select",
    phone: "",
    fax: "",
    geConfirmation: "",
    shippingType: "Select shipping type",
    address1: "",
    address2: "",
    city: "",
    state: "select",
    zip: "",
    specialInstructions: "",
    comments: "",
    shippingDetails: "",
  });

  const [cart, setCart] = useState<CartItem<ProductWithAssignments>[]>([]);
  const availableProducts = useMemo(
    () => (mockProducts as ProductWithAssignments[]).filter((p) => p.assignments.length > 0),
    []
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const addToCart = (product: ProductWithAssignments) => {
    const price = product.assignments[0]?.client_unit_price || product.base_unit_price || 0;
    setCart((prev) => {
      const found = prev.find((it) => it.product.id === product.id);
      if (found) {
        return prev.map((it) =>
          it.product.id === product.id
            ? { ...it, quantity: it.quantity + 1, totalPrice: (it.quantity + 1) * it.unitPrice }
            : it
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: price, totalPrice: price }];
    });
  };

  const inc = (productId: string) =>
    setCart((prev) =>
      prev.map((it) =>
        it.product.id === productId ? { ...it, quantity: it.quantity + 1, totalPrice: (it.quantity + 1) * it.unitPrice } : it
      )
    );
  const dec = (productId: string) =>
    setCart((prev) =>
      prev
        .map((it) =>
          it.product.id === productId ? { ...it, quantity: it.quantity - 1, totalPrice: (it.quantity - 1) * it.unitPrice } : it
        )
        .filter((it) => it.quantity > 0)
    );
  const removeItem = (productId: string) => setCart((prev) => prev.filter((it) => it.product.id !== productId));

  const subtotal = cart.reduce((s, it) => s + it.totalPrice, 0);
  const taxRate = 0.085;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const handleSubmitOrder = () => {
    console.log("Submitting order:", { orderForm, cart, total });
    alert("Order submitted successfully!");
    // TODO: call Supabase RPC/insert here.
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole={userRole} userName={userRole === "Owner" ? "RANDY" : "Paramount"} onLogout={handleLogout} />
      <Nav userRole={userRole} />

      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">New Order</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Order form */}
            <OrderForm
              value={orderForm}
              onChange={(patch) => setOrderForm((prev) => ({ ...prev, ...patch }))}
              orderDateLabel={new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            />

            {/* Right: Products + Cart */}
            <div className="space-y-6">
              <ProductPicker products={availableProducts} onAdd={addToCart} />
              <Cart
                items={cart}
                onInc={inc}
                onDec={dec}
                onRemove={removeItem}
                onSubmit={handleSubmitOrder}
                totals={{ subtotal, taxRate, taxAmount, total }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
