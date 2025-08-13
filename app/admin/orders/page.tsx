"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, ChevronRight } from "lucide-react"
import { getOrders, duplicateOrder } from "@/lib/api/orders"
import type { Order } from "@/lib/supabase"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("client-a-z")

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const data = await getOrders()
      setOrders(data)
    } catch (error) {
      console.error("Failed to load orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicateOrder = async (orderId: string) => {
    try {
      await duplicateOrder(orderId)
      // Reload orders to show the new duplicate
      loadOrders()
    } catch (error) {
      console.error("Failed to duplicate order:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "invoiced":
        return "bg-slate-600"
      case "shipped":
        return "bg-gray-500"
      case "in_arrears":
        return "bg-orange-500"
      case "in_process":
        return "bg-slate-700"
      case "pending":
        return "bg-blue-500"
      default:
        return "bg-gray-400"
    }
  }

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Group orders by client
  const ordersByClient = orders.reduce(
    (acc, order) => {
      const clientName = order.client?.name || "Unknown Client"
      if (!acc[clientName]) {
        acc[clientName] = []
      }
      acc[clientName].push(order)
      return acc
    },
    {} as Record<string, Order[]>,
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Loading Orders...</h1>
        </div>
        <div className="space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="space-y-3">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="bg-white rounded-lg border p-6 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Orders ({orders.length})</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="bg-white">
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48 bg-slate-600 text-white border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client-a-z">CLIENT A-Z</SelectItem>
              <SelectItem value="most-recent">MOST RECENT</SelectItem>
              <SelectItem value="status">BY STATUS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search orders by item # or keyword..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Orders by Client */}
      <div className="space-y-8">
        {Object.entries(ordersByClient).map(([clientName, clientOrders]) => (
          <div key={clientName} className="space-y-4">
            {/* Client Header */}
            <h2 className="text-2xl font-bold text-gray-900">{clientName}</h2>

            {/* Orders */}
            <div className="space-y-3">
              {clientOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    {/* Left - Date and Order Info */}
                    <div className="flex items-center space-x-6">
                      <div className="text-lg font-medium text-gray-900 min-w-[80px]">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          month: "numeric",
                          day: "numeric",
                          year: "2-digit",
                        })}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{order.order_number}</div>
                        {order.notes && <div className="text-sm text-gray-600 whitespace-pre-line">{order.notes}</div>}
                      </div>
                    </div>

                    {/* Middle - Order Details */}
                    <div className="flex-1 px-6">
                      <div className="text-sm">
                        <div className="text-gray-600">Ordered by {order.ordered_by}</div>
                        {order.ordered_by_email && (
                          <div className="text-blue-600 hover:underline cursor-pointer">{order.ordered_by_email}</div>
                        )}
                      </div>
                      {order.status && (
                        <Badge className={`mt-2 text-white ${getStatusColor(order.status)}`}>
                          {formatStatus(order.status)}
                        </Badge>
                      )}
                      {order.total_amount && (
                        <div className="text-sm text-gray-600 mt-1">Total: ${order.total_amount.toFixed(2)}</div>
                      )}
                    </div>

                    {/* Right - Actions */}
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicateOrder(order.id)}
                        className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                      >
                        Duplicate order
                      </Button>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
