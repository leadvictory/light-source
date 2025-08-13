"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Package, Plus, Minus, CheckCircle, Users, X, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Product {
  id: string
  sku: string
  name: string
  category: string
  unit_price: number
  image_url: string
  assigned?: boolean
}

interface Client {
  id: string
  name: string
  offices: number
}

interface AssignProductModalProps {
  client: Client
  trigger?: React.ReactNode
}

export function AssignProductModal({ client, trigger }: AssignProductModalProps) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [assignedProducts, setAssignedProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("assign")
  const [categories, setCategories] = useState<string[]>([])
  const [stats, setStats] = useState({ total: 0, assigned: 0, available: 0 })

  useEffect(() => {
    if (open) {
      loadProducts()
      loadAssignedProducts()
    }
  }, [open, client.id])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, categoryFilter])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, sku, name, category, unit_price, image_url")
        .eq("status", "available")
        .order("name")

      if (error) throw error

      // Check which products are already assigned
      const { data: assignments, error: assignError } = await supabase
        .from("client_products")
        .select("product_id")
        .eq("client_id", client.id)

      if (assignError) throw assignError

      const assignedIds = new Set(assignments?.map((a) => a.product_id) || [])
      const productsWithAssignment = data?.map((product) => ({
        ...product,
        assigned: assignedIds.has(product.id),
      })) || []

      setProducts(productsWithAssignment)

      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map((p) => p.category) || [])]
      setCategories(uniqueCategories)

      // Update stats
      setStats({
        total: productsWithAssignment.length,
        assigned: productsWithAssignment.filter((p) => p.assigned).length,
        available: productsWithAssignment.filter((p) => !p.assigned).length,
      })
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAssignedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("client_products")
        .select(`
          product_id,
          products (
            id, sku, name, category, unit_price, image_url
          )
        `)
        .eq("client_id", client.id)

      if (error) throw error

      const assigned = data?.map((item: any) => ({
        ...item.products,
        assigned: true,
      })) || []

      setAssignedProducts(assigned)
    } catch (error) {
      console.error("Error loading assigned products:", error)
    }
  }

  const filterProducts = () => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter) {
      filtered = filtered.filter((product) => product.category === categoryFilter)
    }

    setFilteredProducts(filtered)
  }

  const assignProduct = async (productId: string) => {
    setProcessing(true)
    try {
      const { error } = await supabase
        .from("client_products")
        .insert({ client_id: client.id, product_id: productId })

      if (error) throw error

      // Update local state
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, assigned: true } : p))
      )
      setStats((prev) => ({
        ...prev,
        assigned: prev.assigned + 1,
        available: prev.available - 1,
      }))

      await loadAssignedProducts()
    } catch (error) {
      console.error("Error assigning product:", error)
    } finally {
      setProcessing(false)
    }
  }

  const unassignProduct = async (productId: string) => {
    setProcessing(true)
    try {
      const { error } = await supabase
        .from("client_products")
        .delete()
        .eq("client_id", client.id)
        .eq("product_id", productId)

      if (error) throw error

      // Update local state
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, assigned: false } : p))
      )
      setStats((prev) => ({
        ...prev,
        assigned: prev.assigned - 1,
        available: prev.available + 1,
      }))

      await loadAssignedProducts()
    } catch (error) {
      console.error("Error unassigning product:", error)
    } finally {
      setProcessing(false)
    }
  }

  const assignAllProducts = async () => {
    setProcessing(true)
    setProgress(0)

    try {
      const availableProducts = products.filter((p) => !p.assigned)
      const assignments = availableProducts.map((product) => ({
        client_id: client.id,
        product_id: product.id,
      }))

      const batchSize = 100
      let processed = 0

      for (let i = 0; i < assignments.length; i += batchSize) {
        const batch = assignments.slice(i, i + batchSize)
        const { error } = await supabase.from("client_products").upsert(batch, {
          onConflict: "client_id,product_id",
          ignoreDuplicates: true,
        })

        if (error) throw error

        processed += batch.length
        setProgress((processed / assignments.length) * 100)
      }

      await loadProducts()
      await loadAssignedProducts()
    } catch (error) {
      console.error("Error assigning all products:", error)
    } finally {
      setProcessing(false)
      setProgress(0)
    }
  }

  const removeAllProducts = async () => {
    setProcessing(true)
    setProgress(0)

    try {
      const { error } = await supabase
        .from("client_products")
        .delete()
        .eq("client_id", client.id)

      if (error) throw error

      await loadProducts()
      await loadAssignedProducts()
      setProgress(100)
    } catch (error) {
      console.error("Error removing all products:", error)
    } finally {
      setProcessing(false)
      setProgress(0)
    }
  }

  const ProductCard = ({ product, showAssignButton = true }: { product: Product; showAssignButton?: boolean }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.name}
          className="w-12 h-12 object-cover rounded"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg?height=48&width=48&text=Product"
          }}
        />
        <div>
          <div className="font-medium">{product.name}</div>
          <div className="text-sm text-gray-500">
            {product.sku} • {product.category}
          </div>
          <div className="text-sm font-medium">${product.unit_price.toFixed(2)}</div>
        </div>
      </div>
      {showAssignButton && (
        <div className="flex items-center gap-2">
          {product.assigned ? (
            <Badge variant="secondary" className="text-green-700 bg-green-100">
              <CheckCircle className="h-3 w-3 mr-1" />
              Assigned
            </Badge>
          ) : null}
          <Button
            size="sm"
            variant={product.assigned ? "outline" : "default"}
            onClick={() => (product.assigned ? unassignProduct(product.id) : assignProduct(product.id))}
            disabled={processing}
          >
            {product.assigned ? (
              <>
                <Minus className="h-4 w-4 mr-1" />
                Remove
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Assign
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Package className="h-4 w-4 mr-2" />
            Manage Products
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Products for {client.name}
          </DialogTitle>
          <DialogDescription>
            Assign or remove products for this client. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.assigned}</div>
            <div className="text-sm text-gray-600">Assigned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.available}</div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
        </div>

        {processing && progress > 0 && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600 text-center">Processing... {Math.round(progress)}%</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assign">Assign Products</TabsTrigger>
            <TabsTrigger value="remove">Remove Products</TabsTrigger>
            <TabsTrigger value="view">View Assigned</TabsTrigger>
          </TabsList>

          <TabsContent value="assign" className="flex-1 flex flex-col space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Products</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <Label htmlFor="category">Filter by Category</Label>
                <select
                  id="category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={assignAllProducts}
                disabled={processing || stats.available === 0}
                size="sm"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Assign All Available ({stats.available})
              </Button>
              {categoryFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCategoryFilter("")}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filter
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || categoryFilter ? "No products match your filters" : "No products available"}
                </div>
              ) : (
                filteredProducts
                  .filter((p) => !p.assigned)
                  .map((product) => <ProductCard key={product.id} product={product} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="remove" className="flex-1 flex flex-col space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={removeAllProducts}
                disabled={processing || stats.assigned === 0}
                variant="destructive"
                size="sm"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Minus className="h-4 w-4 mr-2" />
                )}
                Remove All Assigned ({stats.assigned})
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {assignedProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No products assigned to this client</div>
              ) : (
                assignedProducts.map((product) => <ProductCard key={product.id} product={product} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="view" className="flex-1 flex flex-col space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This client has access to {stats.assigned} products out of {stats.total} total products.
              </AlertDescription>
            </Alert>

            <div className="flex-1 overflow-y-auto space-y-2">
              {assignedProducts.length ===
