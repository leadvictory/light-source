"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Package, Check, X, ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Product {
  id: string
  name: string
  sku: string
  category: string
  price: number
  assigned?: boolean
}

interface ClientProductsModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  clientName: string
  onAssignmentChange?: () => void
}

export function ClientProductsModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  onAssignmentChange,
}: ClientProductsModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    if (isOpen) {
      loadProducts()
    }
  }, [isOpen, clientId])

  useEffect(() => {
    const filtered = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
      return matchesSearch && matchesCategory
    })

    setTotalPages(Math.ceil(filtered.length / itemsPerPage))
    setCurrentPage(1)

    const startIndex = 0
    const endIndex = itemsPerPage
    setFilteredProducts(filtered.slice(startIndex, endIndex))
  }, [products, searchTerm, categoryFilter])

  useEffect(() => {
    // Handle pagination
    const filtered = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
      return matchesSearch && matchesCategory
    })

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setFilteredProducts(filtered.slice(startIndex, endIndex))
  }, [currentPage])

  const loadProducts = async () => {
    setLoading(true)
    try {
      // Get all products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, sku, category, price")
        .order("name")

      if (productsError) throw productsError

      // Get current assignments for this client
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("client_products")
        .select("product_id")
        .eq("client_id", clientId)

      if (assignmentsError) throw assignmentsError

      const assignedProductIds = new Set(assignmentsData?.map((a) => a.product_id) || [])

      const productsWithAssignments =
        productsData?.map((product) => ({
          ...product,
          assigned: assignedProductIds.has(product.id),
        })) || []

      setProducts(productsWithAssignments)

      // Extract unique categories
      const uniqueCategories = [...new Set(productsData?.map((p) => p.category) || [])]
      setCategories(uniqueCategories.sort())
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductToggle = async (productId: string, assigned: boolean) => {
    setSaving(true)
    try {
      if (assigned) {
        // Add assignment
        const { error } = await supabase.from("client_products").insert({ client_id: clientId, product_id: productId })

        if (error) throw error
      } else {
        // Remove assignment
        const { error } = await supabase
          .from("client_products")
          .delete()
          .eq("client_id", clientId)
          .eq("product_id", productId)

        if (error) throw error
      }

      // Update local state
      setProducts((prev) => prev.map((product) => (product.id === productId ? { ...product, assigned } : product)))

      onAssignmentChange?.()
    } catch (error) {
      console.error("Error updating assignment:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleAssignAll = async () => {
    setSaving(true)
    try {
      const unassignedProducts = filteredProducts.filter((p) => !p.assigned)

      if (unassignedProducts.length > 0) {
        const assignments = unassignedProducts.map((product) => ({
          client_id: clientId,
          product_id: product.id,
        }))

        const { error } = await supabase.from("client_products").insert(assignments)

        if (error) throw error

        // Update local state
        setProducts((prev) =>
          prev.map((product) =>
            unassignedProducts.some((up) => up.id === product.id) ? { ...product, assigned: true } : product,
          ),
        )

        onAssignmentChange?.()
      }
    } catch (error) {
      console.error("Error assigning all:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleUnassignAll = async () => {
    setSaving(true)
    try {
      const assignedProducts = filteredProducts.filter((p) => p.assigned)

      if (assignedProducts.length > 0) {
        const { error } = await supabase
          .from("client_products")
          .delete()
          .eq("client_id", clientId)
          .in(
            "product_id",
            assignedProducts.map((p) => p.id),
          )

        if (error) throw error

        // Update local state
        setProducts((prev) =>
          prev.map((product) =>
            assignedProducts.some((ap) => ap.id === product.id) ? { ...product, assigned: false } : product,
          ),
        )

        onAssignmentChange?.()
      }
    } catch (error) {
      console.error("Error unassigning all:", error)
    } finally {
      setSaving(false)
    }
  }

  const assignedCount = filteredProducts.filter((p) => p.assigned).length
  const totalCount = filteredProducts.length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Manage Products for: {clientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats and Bulk Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {assignedCount} of {totalCount} products assigned (Page {currentPage} of {totalPages})
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleAssignAll}
                disabled={saving || assignedCount === totalCount}
              >
                <Check className="h-4 w-4 mr-1" />
                Assign All
              </Button>
              <Button size="sm" variant="outline" onClick={handleUnassignAll} disabled={saving || assignedCount === 0}>
                <X className="h-4 w-4 mr-1" />
                Unassign All
              </Button>
            </div>
          </div>

          {/* Product List */}
          <ScrollArea className="h-96 border rounded-md">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No products found</div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded border">
                    <Checkbox
                      checked={product.assigned}
                      onCheckedChange={(checked) => handleProductToggle(product.id, checked as boolean)}
                      disabled={saving}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        SKU: {product.sku} | Category: {product.category} | ${product.price}
                      </div>
                    </div>
                    {product.assigned && <Check className="h-4 w-4 text-green-600" />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
