"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Package, Users, TrendingUp, AlertCircle, Clock } from "lucide-react"
import { getClients } from "@/lib/api/clients"
import { getAllProducts } from "@/lib/api/client-products"
import { getOrders } from "@/lib/api/orders"
import type { Order } from "@/lib/supabase"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalClients: 0,
    totalProducts: 0,
    totalRevenue: 0,
    recentOrders: [] as Order[],
    pendingActions: {
      inArrears: 0,
      unassignedProducts: 0,
      newRequests: 0,
    },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      console.log("Loading dashboard data...")

      const [clients, products, orders] = await Promise.all([getClients(), getAllProducts(), getOrders()])

      console.log(`Dashboard: Loaded ${products.length} products, ${clients.length} clients, ${orders.length} orders`)

      // Calculate revenue
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

      // Get recent orders (last 5)
      const recentOrders = orders.slice(0, 5)

      // Calculate pending actions
      const inArrears = orders.filter((order) => order.status === "in_arrears").length
      const unassignedProducts = products.filter((product) => product.status === "available").length

      setStats({
        totalOrders: orders.length,
        totalClients: clients.length,
        totalProducts: products.length, // This should now show the correct count
        totalRevenue,
        recentOrders,
        pendingActions: {
          inArrears,
          unassignedProducts,
          newRequests: 3, // This would come from a custom requests table
        },
      })

      console.log(`Dashboard stats updated: ${products.length} products, ${clients.length} clients`)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, Randy</h1>
          <p className="text-gray-600 mt-2">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, Randy</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with Light Source today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Active orders in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">Registered clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Products in catalog
              {stats.totalProducts > 3000 && <span className="text-green-600 ml-1">✓ Full catalog loaded</span>}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total order value</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Orders
            </CardTitle>
            <CardDescription>Latest orders requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentOrders.slice(0, 3).map((order) => (
              <div key={order.id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{order.order_number}</div>
                  <div className="text-sm text-gray-600">{order.ordered_by}</div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </div>
              </div>
            ))}
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                View All Orders
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Pending Actions
            </CardTitle>
            <CardDescription>Items that need your attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm">{stats.pendingActions.inArrears} orders in arrears</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">{stats.pendingActions.unassignedProducts} products need assignment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">{stats.pendingActions.newRequests} new client requests</span>
            </div>
            <Button variant="outline" className="w-full mt-4 bg-transparent">
              Review All
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full bg-transparent">
                Create New Order
              </Button>
            </Link>
            <Link href="/admin/clients">
              <Button variant="outline" className="w-full bg-transparent">
                Add New Client
              </Button>
            </Link>
            <Link href="/admin/products">
              <Button variant="outline" className="w-full bg-transparent">
                Manage Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
