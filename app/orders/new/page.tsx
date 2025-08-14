"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Bell, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  mockProducts,
  type Product,
  type ProductAssignment,
} from "@/lib/supabase";
import Link from "next/link";
import Nav from "@/components/navbar";
import Header from "@/components/header";
import { supabase } from "@/lib/supabase";

interface CartItem {
  product: Product & { assignments: ProductAssignment[] };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function NewOrderPage() {
  const [orderForm, setOrderForm] = useState({
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
  const [userRole] = useState<"Owner" | "SuperClient" | "Client" | "Tenant">(
    "Owner"
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [availableProducts] = useState(
    mockProducts.filter((p) => p.assignments.length > 0)
  );

  const addToCart = (
    product: Product & { assignments: ProductAssignment[] }
  ) => {
    const assignment = product.assignments[0]; // Use first assignment for pricing
    const newItem: CartItem = {
      product,
      quantity: 1,
      unitPrice: assignment.client_unit_price || product.base_unit_price || 0,
      totalPrice: assignment.client_unit_price || product.base_unit_price || 0,
    };

    setCart((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }
      return [...prev, newItem];
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * item.unitPrice,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const salesTaxRate = 0.085; // 8.5%
  const salesTaxAmount = subtotal * salesTaxRate;
  const totalAmount = subtotal + salesTaxAmount;
  
  const router = useRouter();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };
  const handleInputChange = (field: string, value: string) => {
    setOrderForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitOrder = () => {
    console.log("Submitting order:", { orderForm, cart, totalAmount });
    // Here you would submit to your backend
    alert("Order submitted successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        userRole={userRole}
        userName={userRole === "Owner" ? "RANDY" : "Paramount"}
        onLogout={handleLogout}
      />
      <Nav userRole={userRole} />

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">New Order</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Form
                </h2>
                <div className="text-right">
                  <div className="text-sm text-gray-600">ORDER DATE</div>
                  <div className="font-medium">June 22, 2025</div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Purchase Order & Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="po-number">PURCHASE ORDER #:</Label>
                    <Input
                      id="po-number"
                      placeholder="enter PO number or order number"
                      value={orderForm.purchaseOrderNumber}
                      onChange={(e) =>
                        handleInputChange("purchaseOrderNumber", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>CONTACT</Label>
                    <Select value="randy@light-source.com">
                      <SelectTrigger className="bg-gray-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="randy@light-source.com">
                          randy@light-source.com
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      placeholder="enter contact Name"
                      value={orderForm.contactName}
                      onChange={(e) =>
                        handleInputChange("contactName", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>BUILDING</Label>
                    <Select
                      value={orderForm.building}
                      onValueChange={(value) =>
                        handleInputChange("building", value)
                      }
                    >
                      <SelectTrigger className="bg-gray-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50 Beale St">50 Beale St</SelectItem>
                        <SelectItem value="One Market Plaza">
                          One Market Plaza
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      placeholder="enter email"
                      value={orderForm.contactEmail}
                      onChange={(e) =>
                        handleInputChange("contactEmail", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>TENANT</Label>
                    <Select
                      value={orderForm.tenant}
                      onValueChange={(value) =>
                        handleInputChange("tenant", value)
                      }
                    >
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
                    <Select
                      value={orderForm.shippingType}
                      onValueChange={(value) =>
                        handleInputChange("shippingType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ground Shipment (3-5 days)">
                          Ground Shipment (3-5 days)
                        </SelectItem>
                        <SelectItem value="Express">Express</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>BILLING</Label>
                    <Select
                      value={orderForm.billing}
                      onValueChange={(value) =>
                        handleInputChange("billing", value)
                      }
                    >
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

                {/* Address Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ADDRESS 1</Label>
                      <Input
                        placeholder="address 1"
                        value={orderForm.address1}
                        onChange={(e) =>
                          handleInputChange("address1", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>SALES TAX</Label>
                      <Select
                        value={orderForm.salesTax}
                        onValueChange={(value) =>
                          handleInputChange("salesTax", value)
                        }
                      >
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
                      <Input
                        placeholder="address 2"
                        value={orderForm.address2}
                        onChange={(e) =>
                          handleInputChange("address2", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>PHONE</Label>
                      <Input
                        placeholder="phone"
                        value={orderForm.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>CITY</Label>
                      <Input
                        placeholder="City"
                        value={orderForm.city}
                        onChange={(e) =>
                          handleInputChange("city", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>FAX</Label>
                      <Input
                        placeholder="fax"
                        value={orderForm.fax}
                        onChange={(e) =>
                          handleInputChange("fax", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>STATE</Label>
                      <Select
                        value={orderForm.state}
                        onValueChange={(value) =>
                          handleInputChange("state", value)
                        }
                      >
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
                      <Input
                        placeholder="enter #"
                        value={orderForm.geConfirmation}
                        onChange={(e) =>
                          handleInputChange("geConfirmation", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>ZIP</Label>
                      <Input
                        placeholder="Postal Code"
                        value={orderForm.zip}
                        onChange={(e) =>
                          handleInputChange("zip", e.target.value)
                        }
                      />
                    </div>
                    <div></div>
                  </div>
                </div>

                {/* Text Areas */}
                <div className="space-y-4">
                  <div>
                    <Label>SPECIAL SHIPPING INSTRUCTIONS:</Label>
                    <Textarea
                      value={orderForm.specialInstructions}
                      onChange={(e) =>
                        handleInputChange("specialInstructions", e.target.value)
                      }
                      className="min-h-[60px]"
                    />
                  </div>

                  <div>
                    <Label>COMMENTS:</Label>
                    <Textarea
                      value={orderForm.comments}
                      onChange={(e) =>
                        handleInputChange("comments", e.target.value)
                      }
                      className="min-h-[60px]"
                    />
                  </div>

                  <div>
                    <Label>SHIPPING DETAILS</Label>
                    <Textarea
                      value={orderForm.shippingDetails}
                      onChange={(e) =>
                        handleInputChange("shippingDetails", e.target.value)
                      }
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Shopping Cart */}
            <div className="space-y-6">
              {/* Available Products */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Available Products
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {product.item_number}
                        </div>
                        <div className="text-xs text-gray-600">
                          {product.name}
                        </div>
                        <div className="text-xs text-green-600">
                          $
                          {product.assignments[0]?.client_unit_price ||
                            product.base_unit_price}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => addToCart(product)}>
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shopping Cart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Shopping Cart Contains:
                </h3>

                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Your cart is empty
                  </div>
                ) : (
                  <>
                    {/* Cart Header */}
                    <div className="bg-gray-800 text-white p-3 rounded-t grid grid-cols-6 gap-2 text-sm font-medium">
                      <div>Item Code</div>
                      <div className="col-span-2">Lamp Description</div>
                      <div>Unit Price</div>
                      <div>Units Ordered</div>
                      <div>Item Subtotal</div>
                    </div>

                    {/* Cart Items */}
                    <div className="border border-t-0 rounded-b">
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="p-3 border-b last:border-b-0"
                        >
                          <div className="grid grid-cols-6 gap-2 items-center text-sm">
                            <div className="font-medium">
                              {item.product.item_number}
                            </div>
                            <div className="col-span-2">
                              <div className="font-medium">
                                {item.product.manufacturer}
                              </div>
                              <div className="text-xs text-gray-600 line-clamp-2">
                                {item.product.description}
                              </div>
                            </div>
                            <div>${item.unitPrice.toFixed(2)}</div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity - 1
                                  )
                                }
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity + 1
                                  )
                                }
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>${item.totalPrice.toFixed(2)}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 bg-transparent"
                                onClick={() => removeFromCart(item.product.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cart Totals */}
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sales Tax (8.5%):</span>
                        <span>${salesTaxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total Amount:</span>
                        <span>${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
                      <strong>Note:</strong> Additional fee for shipping charges
                      will apply (fee to be determined).
                    </div>

                    <Button
                      className="w-full mt-6 bg-green-600 hover:bg-green-700"
                      onClick={handleSubmitOrder}
                      disabled={cart.length === 0}
                    >
                      Submit Order
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
