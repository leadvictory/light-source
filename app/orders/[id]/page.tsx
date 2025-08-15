"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/header";
import Nav from "@/components/navbar";
import OrderToolbar from "@/components/orders/OrderToolbar";
import OrderMeta, { type OrderMetaData } from "@/components/orders/OrderMeta";
import OrderItemsTable, { type OrderItem } from "@/components/orders/OrderItemsTable";
import OrderTotals from "@/components/orders/OrderTotals";
import { Footer } from "@/components/footer";
import type { OrderStatus } from "@/components/orders/OrderStatusBadge";

export type OrderDetails = {
  id: string;
  orderNumber: string;
  purchaseOrderNumber: string;
  orderPlacedBy: string;
  orderDate: string;
  buildingUnit: string;
  shipping: string;
  address: string;
  paymentType: string;
  specialInstructions: string;
  comments: string;
  shippingDetails: string;
  email: string;
  phone: string;
  fax: string;
  geConfirmation: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  salesTax: number;
  totalAmount: number;
};

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  // ✅ Unwrap params Promise in client component
  const { id } = React.use(params);

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [editedOrder, setEditedOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // --- mock fetch (replace with Supabase fetch) ---
  useEffect(() => {
    const mockOrders: Record<string, OrderDetails> = {
      "1": {
        id: "1",
        orderNumber: "PO: 50B-0972-AR",
        purchaseOrderNumber: "50B-0972-AR",
        orderPlacedBy: "Molly",
        orderDate: "3/24/24",
        buildingUnit: "Paramount Group 50 Beale Street",
        shipping: "Ground Shipment (3-5 days)",
        address: "50 Beale St\nAttn SUITE 2400/\nEngineering\nSan Francisco, CA 94105",
        paymentType: "Invoice",
        specialInstructions: "CALL SUZY WHEN THE PRODUCTS SHIP",
        comments: "",
        shippingDetails: "",
        email: "Molly@paramount-group.com",
        phone: "415-780-1101",
        fax: "415-636-0139",
        geConfirmation: "",
        status: "PROCESSING",
        items: [
          {
            tenant: "Common Areas (All)",
            itemCode: "91496",
            description: "GE LED2T8/G/4/835 2600 Lumens 70,000 Life Hours",
            unitPrice: 10.83,
            unitsOrdered: 100,
            itemSubtotal: 1083.0,
          },
        ],
        subtotal: 1083.0,
        salesTax: 92.06,
        totalAmount: 1175.06,
      },
      "2": {
        id: "2",
        orderNumber: "1234",
        purchaseOrderNumber: "1234",
        orderPlacedBy: "Suzzane",
        orderDate: "3/24/24",
        buildingUnit: "Paramount Group 7thFloor- One Market Plaza",
        shipping: "Ground Shipment (3-5 days)",
        address: "7thFloor- One Market Plaza\nSan Francisco, CA 94105",
        paymentType: "Invoice",
        specialInstructions: "",
        comments: "",
        shippingDetails: "",
        email: "Suzz@dot.com",
        phone: "415-780-1101",
        fax: "",
        geConfirmation: "",
        status: "PENDING",
        items: [
          {
            tenant: "7th Floor",
            itemCode: "JHBL 24000LM",
            description: "INTERMATIC Spring Wound Timer",
            unitPrice: 245.0,
            unitsOrdered: 10,
            itemSubtotal: 2450.0,
          },
        ],
        subtotal: 2450.0,
        salesTax: 208.25,
        totalAmount: 2658.25,
      },
    };

    const data = mockOrders[id] || mockOrders["1"];
    const t = setTimeout(() => {
      setOrder(data);
      setEditedOrder({ ...data });
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [id]);

  const [userRole] = useState<"Owner" | "SuperClient" | "Client" | "Tenant">("Owner");
  const currentOrder = useMemo(() => (isEditing ? editedOrder : order), [isEditing, editedOrder, order]);

  // ----- handlers -----
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleEdit = () => setIsEditing(true);

  const handleSave = () => {
    if (!editedOrder) return;
    const newSubtotal = editedOrder.items.reduce((s, it) => s + it.itemSubtotal, 0);
    const newSalesTax = newSubtotal * 0.085;
    const newTotal = newSubtotal + newSalesTax;
    const updated: OrderDetails = { ...editedOrder, subtotal: newSubtotal, salesTax: newSalesTax, totalAmount: newTotal };
    setOrder(updated);
    setEditedOrder(updated);
    setIsEditing(false);
    console.log("Saving order:", updated);
  };

  const handleCancel = () => {
    if (order) setEditedOrder({ ...order });
    setIsEditing(false);
  };

  const setStatus = (s: OrderStatus) => {
    if (!editedOrder) return;
    setEditedOrder({ ...editedOrder, status: s });
  };

  const handleMetaChange = (patch: Partial<OrderMetaData>) => {
    if (!editedOrder) return;
    setEditedOrder({ ...editedOrder, ...patch });
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    if (!editedOrder) return;
    const items = editedOrder.items.map((it, i) =>
      i === index
        ? {
            ...it,
            [field]: value,
            itemSubtotal:
              field === "unitPrice" || field === "unitsOrdered"
                ? (field === "unitPrice" ? Number(value) : it.unitPrice) *
                  (field === "unitsOrdered" ? Number(value) : it.unitsOrdered)
                : it.itemSubtotal,
          }
        : it
    );
    setEditedOrder({ ...editedOrder, items });
  };

  const handleDuplicateOrder = async () => {
    if (!currentOrder) return;
    setIsDuplicating(true);
    try {
      const generateNewOrderNumber = (num: string) => {
        const m = num.match(/(\d+)$/);
        if (m) return num.replace(/\d+$/, String(parseInt(m[1], 10) + 1));
        return `${num}-2`;
      };
      const newOrderNumber = generateNewOrderNumber(currentOrder.orderNumber);
      const newOrderId = `${currentOrder.id}-dup-${Date.now()}`;

      const duplicated: OrderDetails = {
        ...currentOrder,
        id: newOrderId,
        orderNumber: newOrderNumber,
        purchaseOrderNumber: newOrderNumber,
        orderDate: new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" }),
        status: "PENDING",
      };

      console.log("Duplicated order created:", duplicated);
      alert(`Order duplicated successfully! New order number: ${newOrderNumber}`);
      window.location.href = `/orders/${newOrderId}`;
    } catch (e) {
      console.error(e);
      alert("Failed to duplicate order. Please try again.");
    } finally {
      setIsDuplicating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading order...</div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Order not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        userRole={userRole}
        userName={userRole === "Owner" ? "RANDY" : "Paramount"}
        onLogout={handleLogout}
      />

      <Nav userRole={userRole} />

      {/* Main */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">{currentOrder.orderNumber}</h1>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <OrderToolbar
                isEditing={isEditing}
                status={currentOrder.status}
                setStatus={setStatus}
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                onDuplicate={handleDuplicateOrder}
                duplicating={isDuplicating}
              />

              <OrderMeta
                value={{
                  purchaseOrderNumber: currentOrder.purchaseOrderNumber,
                  orderPlacedBy: currentOrder.orderPlacedBy,
                  orderDate: currentOrder.orderDate,
                  buildingUnit: currentOrder.buildingUnit,
                  shipping: currentOrder.shipping,
                  address: currentOrder.address,
                  paymentType: currentOrder.paymentType,
                  email: currentOrder.email,
                  phone: currentOrder.phone,
                  fax: currentOrder.fax,
                  geConfirmation: currentOrder.geConfirmation,
                  specialInstructions: currentOrder.specialInstructions,
                  comments: currentOrder.comments,
                  shippingDetails: currentOrder.shippingDetails,
                }}
                isEditing={isEditing}
                onChange={(patch) => {
                  if (!isEditing || !editedOrder) return;
                  setEditedOrder({ ...editedOrder, ...patch });
                }}
              />
            </div>

            <OrderItemsTable items={currentOrder.items} isEditing={isEditing} onChangeItem={handleItemChange} />

            <div className="px-6 pb-6">
              <OrderTotals
                subtotal={currentOrder.subtotal}
                salesTax={currentOrder.salesTax}
                totalAmount={currentOrder.totalAmount}
                taxLabel="Sales Tax (8.5%):"
              />
            </div>

            <Footer />
          </div>
        </div>
      </main>
    </div>
  );
}
