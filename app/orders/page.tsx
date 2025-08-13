"use client"

import { useState, useEffect } from "react"
import { Search, ChevronDown, Bell, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { supabase, type Order } from "@/lib/supabase"
import Link from "next/link"

// Mock orders data
const mockOrders: (Order & { company_name: string; user_name: string })[] = [
  {
    id: "1",
    order_number: "PO: 50B-0972-AR",
    user_id: "1",
    company_id: "1",
    building_id: "1",
    status: "PROCESSING",
    total_amount: 1175.06,
    notes: "CALL SUZY WHEN THE PRODUCTS SHIP",
    created_at: "2024-03-24T00:00:00Z",
    updated_at: "2024-03-24T00:00:00Z",
    company_name: "Paramount Group",
    user_name: "Molly",
  },
  {
    id: "2",
    order_number: "1234",
    user_id: "2",
    company_id: "1",
    status: "PENDING",
    total_amount: 2450.0,
    created_at: "2024-03-24T00:00:00Z",
    updated_at: "2024-03-24T00:00:00Z",
    company_name: "Paramount Group",
    user_name: "Suzzane",
  },
  {
    id: "3",
    order_number: "A987612",
    user_id: "1",
    company_id: "1",
    status: "PROCESSING",
    total_amount: 890.5,
    created_at: "2024-03-24T00:00:00Z",
    updated_at: "2024-03-24T00:00:00Z",
    company_name: "Paramount Group",
    user_name: "Molly",
  },
  {
    id: "4",
    order_number: "PO 121212",
    user_id: "1",
    company_id: "1",
    status: "PROCESSING",
    total_amount: 1250.0,
    created_at: "2024-03-24T00:00:00Z",
    updated_at: "2024-03-24T00:00:00Z",
    company_name: "Paramount Group",
    user_name: "Molly",
  },
  {
    id: "5",
    order_number: "87_a_nmeleiftr",
    user_id: "1",
    company_id: "1",
    status: "PROCESSING",
    total_amount: 675.25,
    created_at: "2024-03-24T00:00:00Z",
    updated_at: "2024-03-24T00:00:00Z",
    company_name: "Paramount Group",
    user_name: "Molly",
  },
  {
    id: "6",
    order_number: "PO: ACME_27",
    user_id: "4",
    company_id: "2",
    status: "COMPLETED",
    total_amount: 3200.0,
    created_at: "2024-03-24T00:00:00Z",
    updated_at: "2024-03-24T00:00:00Z",
    company_name: "ACME",
    user_name: "Steve Jackson",
  },
  {
    id: "7",
    order_number: "PO: ACME_26",
    user_id: "4",
    company_id: "2",
    status: "COMPLETED",
    total_amount: 1850.75,
    created_at: "2024-03-24T00:00:00Z",
    updated_at: "2024-03-24T00:00:00Z",
    company_name: "ACME",
    user_name: "Steve",
  },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<(Order & { company_name: string; user_name: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [userRole] = useState<"OWNER" | "SUPERCUSTOMER">("OWNER") // This would come from auth context
  const [useSupabase, setUseSupabase] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [searchTerm, sortBy, useSupabase])

  const fetchOrders = async () => {
    try {
      setLoading(true)

      if (!useSupabase) {
        // Use mock data
        let filteredOrders = [...mockOrders]

        // Apply search filter
        if (searchTerm) {
          filteredOrders = filteredOrders.filter(
            (order) =>
              order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
              order.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              order.user_name.toLowerCase().includes(searchTerm.toLowerCase()),
          )
        }

        // Apply sorting
        if (sortBy === "recent") {
          filteredOrders.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        } else if (sortBy === "client") {
          filteredOrders.sort((a, b) => a.company_name.localeCompare(b.company_name))
        }

        setOrders(filteredOrders)
        return
      }

      // Try to fetch from Supabase
      let query = supabase.from("orders").select(`
          *,
          user:users(name),
          company:companies(name)
        `)

      if (searchTerm) {
        query = query.or(`order_number.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query.order("updated_at", { ascending: false })

      if (error) {
        console.warn("Supabase error, falling back to mock data:", error)
        setUseSupabase(false)
        return
      }

      const transformedOrders =
        data?.map((order) => ({
          ...order,
          company_name: order.company?.name || "Unknown",
          user_name: order.user?.name || "Unknown",
        })) || []

      setOrders(transformedOrders)
    } catch (error) {
      console.warn("Error fetching orders, using mock data:", error)
      setUseSupabase(false)
      setOrders(mockOrders)
    } finally {
      setLoading(false)
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    })
  }

  const groupOrdersByCompany = (orders: (Order & { company_name: string; user_name: string })[]) => {
    return orders.reduce(
      (groups, order) => {
        const company = order.company_name
        if (!groups[company]) {
          groups[company] = []
        }
        groups[company].push(order)
        return groups
      },
      {} as Record<string, (Order & { company_name: string; user_name: string })[]>,
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading orders...</div>
      </div>
    )
  }

  const groupedOrders = userRole === "OWNER" ? groupOrdersByCompany(orders) : null

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
            {!useSupabase && <div className="text-xs text-orange-200 bg-orange-800 px-2 py-1 rounded">Demo Mode</div>}
            <Bell className="w-5 h-5 text-white" />
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="text-white font-medium">{userRole === "OWNER" ? "RANDY" : "Paramount"}</div>
                <div className="text-xs text-gray-300">{userRole}</div>
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
          {userRole === "OWNER" && (
            <Link href="/clients" className="py-4 text-gray-600 hover:text-gray-900 flex items-center space-x-2">
              <span>👥</span>
              <span>Clients</span>
            </Link>
          )}
          {userRole === "SUPERCUSTOMER" && (
            <button className="py-4 text-gray-600 hover:text-gray-900 flex items-center space-x-2">
              <span>🏢</span>
              <span>Offices</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        <div className="bg-white rounded-lg shadow">
          {/* Header Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Orders ({orders.length})</h1>
              <div className="flex items-center space-x-4">
                <Button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Plus className="w-4 h-4 mr-2" />
                  New Order
                </Button>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 bg-blue-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">MOST RECENT</SelectItem>
                    <SelectItem value="client">CLIENT A-Z</SelectItem>
                    <SelectItem value="oldest">OLDEST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search orders by item # or keyword..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="p-4">
            {userRole === "OWNER" && groupedOrders
              ? // Owner view - grouped by company
                Object.entries(groupedOrders).map(([companyName, companyOrders]) => (
                  <div key={companyName}>
                    <div className="px-6 py-4 bg-gray-100">
                      <h2 className="text-lg font-bold text-gray-900">{companyName}</h2>
                    </div>
                    {companyOrders.map((order) => (
                      <Link
                        href={`/orders/${order.id}`}
                        key={order.id}
                        className="block px-6 py-4 hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg mb-2 mx-4 cursor-pointer hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            <div className="text-sm text-gray-600 w-16">{formatDate(order.created_at)}</div>
                            <div className="flex-1">
                              <div className="text-lg font-semibold text-gray-900 mb-1">{order.order_number}</div>
                              <div className="text-sm text-gray-600">
                                {order.building_id ? "50 Beale Street" : "7thFloor- One Market Plaza"}
                              </div>
                              <div className="text-sm text-gray-600">Paramount Group</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Ordered by {order.user_name}</div>
                              <div className="text-sm text-blue-600 underline">
                                {order.user_name}@paramountgroup.com
                              </div>
                            </div>
                            <div className="flex flex-col items-center space-y-2">{getStatusBadge(order.status)}</div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-600 bg-blue-50"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log("Duplicate order:", order.order_number)
                              }}
                            >
                              Duplicate order
                            </Button>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ))
              : // SuperCustomer view - flat list
                orders.map((order) => (
                  <Link
                    href={`/orders/${order.id}`}
                    key={order.id}
                    className="block px-6 py-4 hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg mb-2 mx-4 cursor-pointer hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="text-sm text-gray-600 w-16">{formatDate(order.created_at)}</div>
                        <div className="flex-1">
                          <div className="text-lg font-semibold text-gray-900 mb-1">{order.order_number}</div>
                          <div className="text-sm text-gray-600">
                            {order.building_id ? "50 Beale Street" : "7thFloor- One Market Plaza"}
                          </div>
                          <div className="text-sm text-gray-600">Paramount Group</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Ordered by {order.user_name}</div>
                          <div className="text-sm text-blue-600 underline">{order.user_name}@paramountgroup.com</div>
                        </div>
                        <div className="flex flex-col items-center space-y-2">{getStatusBadge(order.status)}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-600 bg-blue-50"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log("Duplicate order:", order.order_number)
                          }}
                        >
                          Duplicate order
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </main>
    </div>
  )
}
