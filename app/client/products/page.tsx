"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ShoppingCart } from "lucide-react"
import Image from "next/image"
import { getClientProducts } from "@/lib/api/client-products"
import { getCurrentUser } from "@/lib/auth"
import type { Product } from "@/lib/supabase"

export default function ClientProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState("all")
  const [subCategory, setSubCategory] = useState("all")

  useEffect(() => {
    loadProducts()
  }, [searchTerm, category, subCategory])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const user = await getCurrentUser()

      if (!user?.client_id) {
        console.error("No client ID found for user")
        return
      }

      const filters = {
        search: searchTerm || undefined,
        category: category !== "all" ? category : undefined,
        subcategory: subCategory !== "all" ? subCategory : undefined,
      }

      const data = await getClientProducts(user.client_id, filters)
      setProducts(data)
    } catch (error) {
      console.error("Failed to load products:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Loading Products...</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200"></div>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Your Products ({products.length})</h1>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="LED">LED</SelectItem>
            <SelectItem value="FIXTURES">FIXTURES</SelectItem>
            <SelectItem value="EMERGENCY">EMERGENCY</SelectItem>
            <SelectItem value="RELAMP">RELAMP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              <Image
                src={product.image_url || "/placeholder.svg?height=200&width=200&text=Product"}
                alt={product.name}
                width={200}
                height={200}
                className="object-contain"
              />
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                  <CardDescription>SKU: {product.sku}</CardDescription>
                </div>
                <Badge variant="secondary">{product.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {product.specifications && typeof product.specifications === "object" && (
                  <div className="text-sm text-gray-600">
                    {Object.entries(product.specifications)
                      .slice(0, 2)
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-2xl font-bold text-blue-600">${product.unit_price?.toFixed(2)}</span>
                  {product.units_per_case && product.units_per_case > 1 && (
                    <div className="text-xs text-gray-500">
                      Case of {product.units_per_case}: ${product.case_price?.toFixed(2)}
                    </div>
                  )}
                </div>
                <Button>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Order
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  )
}
