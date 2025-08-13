"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, ShoppingCart, TrendingUp, Calendar } from "lucide-react"
import Link from "next/link"
import { getClientPortalData, type ClientPortalData } from "@/lib/api/client-portal"
import { getCurrentUser } from "@/lib/auth"

export default function ClientDashboard() {
  const [portalData, setPortalData] = useState<ClientPortalData>({
    totalProducts: 0,
    totalOrders: 0,
    recentOrders: [],
    productCategories: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPortalData()
  }, [])

  const loadPortalData = async () => {
    try {
      setLoading(true)
      setError(null)

      const user = await getCurrentUser()
      if (!user?.client_id) {
        setError("No client account found")
        return
      }

      const data = await getClientPortalData(user.client_id)
      setPortalData(data)
    } catch (err) {
      console.error("Error loading portal data:", err)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return "N/A"
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
    if (isNaN(numPrice)) return "N/A"
    return `$${numPrice.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadPortalData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Dashboard</h1>
        <p className="text-gray-600">Welcome to your Light Source ordering portal</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portalData.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Products assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portalData.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Orders placed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Categories</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portalData.productCategories.length}</div>
            <p className="text-xs text-muted-foreground">Categories available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portalData.recentOrders.length}</div>
            <p className="text-xs text-muted-foreground">Recent orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Browse Products</CardTitle>
            <CardDescription>View and order from your assigned product catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/client/products">
              <Button className="w-full">
                <Package className="mr-2 h-4 w-4" />
                View Products
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>View your past orders and track current ones</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/client/orders">
              <Button variant="outline" className="w-full bg-transparent">
                <ShoppingCart className="mr-2 h-4 w-4" />
                View Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Your latest order activity</CardDescription>
        </CardHeader>
        <CardContent>
          {portalData.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {portalData.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Order #{order.order_number}</div>
                    <div className="text-sm text-gray-600">{formatDate(order.created_at)}</div>
                    <div className="text-sm text-gray-500">{order.order_items?.length || 0} item(s)</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatPrice(order.total_amount)}</div>
                    <Badge
                      variant={
                        order.status === "completed" ? "default" : order.status === "pending" ? "secondary" : "outline"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>No orders yet</p>
              <p className="text-sm">Start by browsing your available products</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Categories */}
      {portalData.productCategories.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Available Categories</CardTitle>
            <CardDescription>Product categories assigned to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {portalData.productCategories.map((category) => (
                <Badge key={category} variant="outline">
                  {category}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
