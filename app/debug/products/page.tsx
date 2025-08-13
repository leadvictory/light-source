"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, RefreshCw } from "lucide-react"

export default function DebugProductsPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalClients: 0,
    totalAssignments: 0,
    sampleProducts: [],
    loading: true,
  })

  const loadStats = async () => {
    try {
      setStats((prev) => ({ ...prev, loading: true }))

      // Get total product count
      const { count: productCount, error: productError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })

      // Get total client count
      const { count: clientCount, error: clientError } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })

      // Get total assignment count
      const { count: assignmentCount, error: assignmentError } = await supabase
        .from("client_products")
        .select("*", { count: "exact", head: true })

      // Get sample products
      const { data: sampleProducts, error: sampleError } = await supabase
        .from("products")
        .select("sku, name, category, created_at")
        .order("created_at", { ascending: false })
        .limit(10)

      if (productError) console.error("Product count error:", productError)
      if (clientError) console.error("Client count error:", clientError)
      if (assignmentError) console.error("Assignment count error:", assignmentError)
      if (sampleError) console.error("Sample products error:", sampleError)

      setStats({
        totalProducts: productCount || 0,
        totalClients: clientCount || 0,
        totalAssignments: assignmentCount || 0,
        sampleProducts: sampleProducts || [],
        loading: false,
      })
    } catch (error) {
      console.error("Failed to load stats:", error)
      setStats((prev) => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const testProductFetch = async () => {
    try {
      console.log("Testing product fetch with different limits...")

      // Test with no limit
      const { data: noLimit, count: noLimitCount } = await supabase.from("products").select("id", { count: "exact" })

      console.log(`No limit: ${noLimit?.length} products, count: ${noLimitCount}`)

      // Test with 5000 limit
      const { data: limit5000, count: count5000 } = await supabase
        .from("products")
        .select("id", { count: "exact" })
        .limit(5000)

      console.log(`5000 limit: ${limit5000?.length} products, count: ${count5000}`)

      // Test with 10000 limit
      const { data: limit10000, count: count10000 } = await supabase
        .from("products")
        .select("id", { count: "exact" })
        .limit(10000)

      console.log(`10000 limit: ${limit10000?.length} products, count: ${count10000}`)
    } catch (error) {
      console.error("Test fetch error:", error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Database Debug</h1>
        <div className="space-x-2">
          <Button onClick={loadStats} variant="outline" disabled={stats.loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${stats.loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={testProductFetch} variant="outline">
            Test Fetch Limits
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.loading ? "..." : stats.totalProducts.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Products in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.loading ? "..." : stats.totalClients}</div>
            <p className="text-sm text-gray-600">Active clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats.loading ? "..." : stats.totalAssignments.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Total assignments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Products (Sample)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.sampleProducts.map((product: any, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{product.sku}</div>
                  <div className="text-sm text-gray-600">{product.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{product.category}</div>
                  <div className="text-xs text-gray-500">{new Date(product.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2">Debug Information</h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <div>Expected products: 3,125</div>
          <div>Actual products: {stats.totalProducts.toLocaleString()}</div>
          <div>Expected assignments: {stats.totalProducts * stats.totalClients}</div>
          <div>Actual assignments: {stats.totalAssignments.toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}
