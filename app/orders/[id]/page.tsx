"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Bell, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

interface OrderDetails {
  id: string
  orderNumber: string
  purchaseOrderNumber: string
  orderPlacedBy: string
  orderDate: string
  buildingUnit: string
  shipping: string
  address: string
  paymentType: string
  specialInstructions: string
  comments: string
  shippingDetails: string
  email: string
  phone: string
  fax: string
  geConfirmation: string
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED"
  items: Array<{
    tenant: string
    itemCode: string
    description: string
    unitPrice: number
    unitsOrdered: number
    itemSubtotal: number
  }>
  subtotal: number
  salesTax: number
  totalAmount: number
}

export default function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [editedOrder, setEditedOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  useEffect(() => {
    // Mock order data - in real app, fetch from API
    const mockOrders: { [key: string]: OrderDetails } = {
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
    }

    const mockOrder = mockOrders[params.id] || mockOrders["1"]

    setTimeout(() => {
      setOrder(mockOrder)
      setEditedOrder({ ...mockOrder })
      setLoading(false)
    }, 500)
  }, [params.id])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editedOrder) {
      // Recalculate totals based on items
      const newSubtotal = editedOrder.items.reduce((sum, item) => sum + item.itemSubtotal, 0)
      const newSalesTax = newSubtotal * 0.085 // 8.5% tax rate
      const newTotal = newSubtotal + newSalesTax

      const updatedOrder = {
        ...editedOrder,
        subtotal: newSubtotal,
        salesTax: newSalesTax,
        totalAmount: newTotal,
      }

      setOrder(updatedOrder)
      setEditedOrder(updatedOrder)
      setIsEditing(false)

      // In a real app, you would save to the backend here
      console.log("Saving order:", updatedOrder)
    }
  }

  const handleCancel = () => {
    if (order) {
      setEditedOrder({ ...order })
    }
    setIsEditing(false)
  }

  const handleInputChange = (field: keyof OrderDetails, value: string | number) => {
    if (editedOrder) {
      setEditedOrder({
        ...editedOrder,
        [field]: value,
      })
    }
  }

  const handleItemChange = (index: number, field: string, value: string | number) => {
    if (editedOrder) {
      const updatedItems = [...editedOrder.items]
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      }

      // Recalculate item subtotal if quantity or unit price changes
      if (field === "unitsOrdered" || field === "unitPrice") {
        updatedItems[index].itemSubtotal = updatedItems[index].unitPrice * updatedItems[index].unitsOrdered
      }

      setEditedOrder({
        ...editedOrder,
        items: updatedItems,
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: "In Arrears", className: "bg-orange-500 text-white" },
      PROCESSING: { label: "In Process", className: "bg-blue-900 text-white" },
      COMPLETED: { label: "Invoiced", className: "bg-purple-600 text-white" },
      CANCELLED: { label: "Cancelled", className: "bg-red-500 text-white" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-gray-500 text-white",
    }

    return <Badge className={config.className}>{config.label}</Badge>
  }

  const handleDuplicateOrder = async () => {
    setIsDuplicating(true)
    try {
      // Generate new order number by incrementing the current one
      const generateNewOrderNumber = (currentNumber: string) => {
        // Try to find a number at the end of the order number
        const match = currentNumber.match(/(\d+)$/)
        if (match) {
          const baseNumber = Number.parseInt(match[1])
          const newNumber = baseNumber + 1
          return currentNumber.replace(/\d+$/, newNumber.toString())
        } else {
          // If no number found, append "-2"
          return `${currentNumber}-2`
        }
      }

      const newOrderNumber = generateNewOrderNumber(currentOrder.orderNumber)
      const newOrderId = `${currentOrder.id}-dup-${Date.now()}`

      // Create duplicated order with new ID and order number
      const duplicatedOrder: OrderDetails = {
        ...currentOrder,
        id: newOrderId,
        orderNumber: newOrderNumber,
        purchaseOrderNumber: newOrderNumber, // Also update PO number
        orderDate: new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" }),
        status: "PENDING", // Reset status to pending
        // Keep all other fields the same including items, contact info, etc.
      }

      // In a real app, you would save this to the backend and get the actual new order ID
      console.log("Duplicated order created:", duplicatedOrder)

      // Show success message briefly
      alert(`Order duplicated successfully! New order number: ${newOrderNumber}`)

      // Redirect to the new order page
      // In a real app, you'd use the actual new order ID from the backend response
      window.location.href = `/orders/${newOrderId}`
    } catch (error) {
      console.error("Error duplicating order:", error)
      alert("Failed to duplicate order. Please try again.")
    } finally {
      setIsDuplicating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading order...</div>
      </div>
    )
  }

  if (!order || !editedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Order not found</div>
      </div>
    )
  }

  const currentOrder = isEditing ? editedOrder : order

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#14224c] border-b border-[#14224c] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <img src="/light-source-logo-white.png" alt="Light Source" className="h-8 w-auto" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Bell className="w-5 h-5 text-white" />
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="text-white font-medium">Paramount</div>
                <div className="text-xs text-gray-300">SUPERCUSTOMER</div>
              </div>
              <ChevronDown className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          <Link href="/orders" className="py-4 text-white bg-blue-900 px-4 rounded-t-lg flex items-center space-x-2">
            <span>📦</span>
            <span>Orders</span>
          </Link>
          <Link href="/" className="py-4 text-gray-600 hover:text-gray-900 flex items-center space-x-2">
            <span>📋</span>
            <span>Products</span>
          </Link>
          <button className="py-4 text-gray-600 hover:text-gray-900 flex items-center space-x-2">
            <span>🏢</span>
            <span>Offices</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">{currentOrder.orderNumber}</h1>

          <div className="bg-white rounded-lg shadow">
            {/* Header Section */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {isEditing ? "Edit Order" : "Order Confirmation Form"}
                  </h2>
                  {isEditing ? (
                    <Select
                      value={currentOrder.status}
                      onValueChange={(value) => handleInputChange("status", value as OrderDetails["status"])}
                    >
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
                    getStatusBadge(currentOrder.status)
                  )}
                </div>
                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="text-gray-700 border-gray-300 bg-transparent"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleDuplicateOrder}
                        disabled={isDuplicating}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isDuplicating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Duplicating...
                          </>
                        ) : (
                          "Duplicate Order"
                        )}
                      </Button>
                      <Button
                        onClick={handleEdit}
                        variant="outline"
                        className="text-gray-700 border-gray-300 bg-transparent"
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Order Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">PURCHASE ORDER #:</Label>
                    {isEditing ? (
                      <Input
                        value={currentOrder.purchaseOrderNumber}
                        onChange={(e) => handleInputChange("purchaseOrderNumber", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <div className="text-gray-900">{currentOrder.purchaseOrderNumber}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">ORDER PLACED BY:</Label>
                    {isEditing ? (
                      <Input
                        value={currentOrder.orderPlacedBy}
                        onChange={(e) => handleInputChange("orderPlacedBy", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <div className="text-gray-900">{currentOrder.orderPlacedBy}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">ORDER DATE:</Label>
                    <div className="text-gray-900 bg-gray-100 px-3 py-2 rounded border">
                      {currentOrder.orderDate} (Read-only)
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">BUILDING UNIT:</Label>
                    {isEditing ? (
                      <Input
                        value={currentOrder.buildingUnit}
                        onChange={(e) => handleInputChange("buildingUnit", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <div className="text-gray-900">{currentOrder.buildingUnit}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">SHIPPING:</Label>
                    {isEditing ? (
                      <Select
                        value={currentOrder.shipping}
                        onValueChange={(value) => handleInputChange("shipping", value)}
                      >
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
                      <div className="text-gray-900">{currentOrder.shipping}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">ADDRESS:</Label>
                    {isEditing ? (
                      <Textarea
                        value={currentOrder.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className="mt-1"
                        rows={4}
                      />
                    ) : (
                      <div className="text-gray-900 whitespace-pre-line">{currentOrder.address}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">PAYMENT TYPE:</Label>
                    {isEditing ? (
                      <Select
                        value={currentOrder.paymentType}
                        onValueChange={(value) => handleInputChange("paymentType", value)}
                      >
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
                      <div className="text-gray-900">{currentOrder.paymentType}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">E-MAIL:</Label>
                    {isEditing ? (
                      <Input
                        value={currentOrder.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <div className="text-blue-600">
                        {currentOrder.email.split(", ").map((email, index) => (
                          <div key={index}>{email}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">PHONE:</Label>
                    {isEditing ? (
                      <Input
                        value={currentOrder.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <div className="text-gray-900">{currentOrder.phone}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">FAX:</Label>
                    {isEditing ? (
                      <Input
                        value={currentOrder.fax}
                        onChange={(e) => handleInputChange("fax", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <div className="text-gray-900">{currentOrder.fax}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">GE CONFIRMATION #:</Label>
                    {isEditing ? (
                      <Input
                        value={currentOrder.geConfirmation}
                        onChange={(e) => handleInputChange("geConfirmation", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <div className="text-gray-900">{currentOrder.geConfirmation || "-"}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="mt-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">SPECIAL SHIPPING INSTRUCTIONS:</Label>
                  {isEditing ? (
                    <Textarea
                      value={currentOrder.specialInstructions}
                      onChange={(e) => handleInputChange("specialInstructions", e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  ) : (
                    <div className="text-gray-900">{currentOrder.specialInstructions}</div>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">COMMENTS:</Label>
                  {isEditing ? (
                    <Textarea
                      value={currentOrder.comments}
                      onChange={(e) => handleInputChange("comments", e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  ) : (
                    <div className="text-gray-900">{currentOrder.comments || "-"}</div>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">SHIPPING DETAILS:</Label>
                  {isEditing ? (
                    <Textarea
                      value={currentOrder.shippingDetails}
                      onChange={(e) => handleInputChange("shippingDetails", e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  ) : (
                    <div className="text-gray-900">{currentOrder.shippingDetails || "-"}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Details Table */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ORDER Details</h3>

              {/* Table Header */}
              <div className="bg-gray-800 text-white p-3 rounded-t grid grid-cols-7 gap-2 text-sm font-medium">
                <div>Tenant</div>
                <div>Item Code</div>
                <div className="col-span-2">Lamp Description</div>
                <div>Unit Price</div>
                <div>Units Ordered</div>
                <div>Item Subtotal</div>
              </div>

              {/* Table Body */}
              <div className="border border-t-0 rounded-b">
                {currentOrder.items.map((item, index) => (
                  <div key={index} className="p-3 border-b last:border-b-0">
                    <div className="grid grid-cols-7 gap-2 items-center text-sm">
                      <div>
                        {isEditing ? (
                          <Input
                            value={item.tenant}
                            onChange={(e) => handleItemChange(index, "tenant", e.target.value)}
                            className="text-xs"
                          />
                        ) : (
                          item.tenant
                        )}
                      </div>
                      <div>
                        {isEditing ? (
                          <Input
                            value={item.itemCode}
                            onChange={(e) => handleItemChange(index, "itemCode", e.target.value)}
                            className="text-xs font-medium"
                          />
                        ) : (
                          <span className="font-medium">{item.itemCode}</span>
                        )}
                      </div>
                      <div className="col-span-2">
                        {isEditing ? (
                          <Textarea
                            value={item.description}
                            onChange={(e) => handleItemChange(index, "description", e.target.value)}
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
                            onChange={(e) =>
                              handleItemChange(index, "unitPrice", Number.parseFloat(e.target.value) || 0)
                            }
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
                            onChange={(e) =>
                              handleItemChange(index, "unitsOrdered", Number.parseInt(e.target.value) || 0)
                            }
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

              {/* Totals */}
              <div className="mt-4 space-y-2 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${currentOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sales Tax (8.5%):</span>
                  <span>${currentOrder.salesTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total Amount:</span>
                  <span>${currentOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
                <strong>Note:</strong> Additional fee for shipping charges will apply (fee to be determined).
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 text-center">
              <div className="text-blue-600 text-lg font-medium mb-2">Thank you for your order.</div>
              <div className="text-gray-600 mb-4">We appreciate your business.</div>
              <div className="text-sm text-gray-600">
                <div className="font-medium">Light Source</div>
                <div>30690 Hill Street</div>
                <div>Thousand Palms, CA 92276</div>
                <div>(800) 624-0860 toll free</div>
                <div>(760) 343-4700 phone</div>
                <div>(760) 343-4720 fax</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
