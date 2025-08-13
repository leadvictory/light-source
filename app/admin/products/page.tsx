"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { updateProduct } from "@/lib/api/products"
import { getAllProducts as getAdminProducts } from "@/lib/api/client-products"
import type { Product } from "@/lib/api/products"
import { AssignProductModal } from "@/components/admin/assign-product-modal"

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState("all")
  const [subCategory, setSubCategory] = useState("all")
  const [sortBy, setSortBy] = useState("most-recent")
  const [isGreenFilter, setIsGreenFilter] = useState(false)
  const [isRelampFilter, setIsRelampFilter] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // Dynamic filter options
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([])

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    applyFilters()
    updateFilterOptions()
  }, [allProducts, searchTerm, category, subCategory, isGreenFilter, isRelampFilter])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, category, subCategory, isGreenFilter, isRelampFilter])

  const loadProducts = async () => {
    try {
      setLoading(true)
      console.log("Admin products page: Starting to load all products")
      const data = await getAdminProducts()
      console.log(`Admin products page: Loaded ${data.length} products`)
      setAllProducts(data)
    } catch (error) {
      console.error("Failed to load products:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateFilterOptions = () => {
    // Get unique categories
    const categories = [...new Set(allProducts.map((p) => p.category).filter(Boolean))].sort()
    setAvailableCategories(categories)

    // Get subcategories based on selected category
    let subcategories: string[] = []
    if (category === "all") {
      subcategories = [...new Set(allProducts.map((p) => p.subcategory).filter(Boolean))].sort()
    } else {
      subcategories = [
        ...new Set(
          allProducts
            .filter((p) => p.category === category)
            .map((p) => p.subcategory)
            .filter(Boolean),
        ),
      ].sort()
    }
    setAvailableSubcategories(subcategories)

    // Reset subcategory if it's no longer available
    if (subCategory !== "all" && !subcategories.includes(subCategory)) {
      setSubCategory("all")
    }
  }

  const applyFilters = () => {
    let filtered = [...allProducts]

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.sku?.toLowerCase().includes(searchLower) ||
          product.name?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower),
      )
    }

    // Category filter
    if (category !== "all") {
      filtered = filtered.filter((product) => product.category === category)
    }

    // Subcategory filter
    if (subCategory !== "all") {
      filtered = filtered.filter((product) => product.subcategory === subCategory)
    }

    // Green filter
    if (isGreenFilter) {
      filtered = filtered.filter((product) => {
        if (product.specifications && typeof product.specifications === "object") {
          return product.specifications.green === true
        }
        return false
      })
    }

    // Relamp filter
    if (isRelampFilter) {
      filtered = filtered.filter((product) => {
        if (product.specifications && typeof product.specifications === "object") {
          return product.specifications.relamp === true
        }
        return false
      })
    }

    // Apply sorting
    if (sortBy === "alphabetical") {
      filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    } else if (sortBy === "category") {
      filtered.sort((a, b) => {
        const categoryCompare = (a.category || "").localeCompare(b.category || "")
        if (categoryCompare === 0) {
          return (a.name || "").localeCompare(b.name || "")
        }
        return categoryCompare
      })
    } else {
      // most-recent (default)
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    setFilteredProducts(filtered)
  }

  const handleStatusUpdate = async (productId: string, status: string) => {
    try {
      await updateProduct(productId, { status })
      setAllProducts(allProducts.map((product) => (product.id === productId ? { ...product, status } : product)))
    } catch (error) {
      console.error("Failed to update product status:", error)
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = filteredProducts.slice(startIndex, endIndex)

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 7

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }

  const PaginationControls = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === "number" && setCurrentPage(page)}
              disabled={page === "..."}
              className={`min-w-[40px] ${page === currentPage ? "bg-slate-800 text-white" : ""}`}
            >
              {page}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="text-sm text-gray-600">
        Jump to page:
        <Input
          type="number"
          min="1"
          max={totalPages}
          value={currentPage}
          onChange={(e) => {
            const page = Number.parseInt(e.target.value)
            if (page >= 1 && page <= totalPages) {
              setCurrentPage(page)
            }
          }}
          className="w-20 ml-2 inline-block"
        />
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Loading All Products...</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Fetching all products from database...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment for large catalogs</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Products ({filteredProducts.length} of {allProducts.length} total)
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {allProducts.length === 3039
              ? "✅ All products loaded successfully"
              : allProducts.length > 1000
                ? "✅ Loading more than 1000 products"
                : "⚠️ May not be showing all products"}
          </p>
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48 bg-slate-600 text-white border-slate-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="most-recent">MOST RECENT</SelectItem>
            <SelectItem value="alphabetical">ALPHABETICAL</SelectItem>
            <SelectItem value="category">BY CATEGORY</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filter Toggles */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Switch id="green-filter" checked={isGreenFilter} onCheckedChange={setIsGreenFilter} />
          <label htmlFor="green-filter" className="text-sm font-medium">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              GREEN
            </Badge>
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="relamp-filter" checked={isRelampFilter} onCheckedChange={setIsRelampFilter} />
          <label htmlFor="relamp-filter" className="text-sm font-medium">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              RELAMP
            </Badge>
          </label>
        </div>
        {(isGreenFilter || isRelampFilter) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsGreenFilter(false)
              setIsRelampFilter(false)
            }}
            className="text-xs"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Search and Category Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products by item # or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40 bg-gray-400 text-white border-gray-400">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat} ({allProducts.filter((p) => p.category === cat).length})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={subCategory} onValueChange={setSubCategory}>
          <SelectTrigger className="w-48 bg-gray-400 text-white border-gray-400">
            <SelectValue placeholder="Sub Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subcategories</SelectItem>
            {availableSubcategories.map((subcat) => (
              <SelectItem key={subcat} value={subcat}>
                {subcat} (
                {
                  allProducts.filter((p) => p.subcategory === subcat && (category === "all" || p.category === category))
                    .length
                }
                )
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Top Pagination Info */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div>
          Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
        </div>
        <div>
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Top Pagination Controls */}
      <PaginationControls />

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Table Header */}
        <div className="bg-slate-800 text-white px-6 py-3">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium">
            <div className="col-span-1">ID</div>
            <div className="col-span-4">DESCRIPTION</div>
            <div className="col-span-3">INFO</div>
            <div className="col-span-2">ORDERS</div>
            <div className="col-span-2">ACTIONS</div>
          </div>
        </div>

        {/* Table Body - Made much taller */}
        <div className="divide-y divide-gray-200" style={{ height: "60vh", overflowY: "auto" }}>
          {currentProducts.map((product, index) => (
            <div key={product.id} className={`px-6 py-4 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Status Indicator & Image */}
                <div className="col-span-1 flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${product.status === "available" ? "bg-green-500" : product.status === "assigned" ? "bg-blue-500" : "bg-gray-400"}`}
                  />
                  <Image
                    src={product.image_url || "/placeholder.svg?height=40&width=40&text=Product"}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>

                {/* ID & Description */}
                <div className="col-span-4">
                  <div className="font-medium text-sm text-gray-900">{product.sku}</div>
                  <div className="text-sm text-gray-600">{product.name}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                    {product.subcategory && (
                      <Badge variant="outline" className="text-xs">
                        {product.subcategory}
                      </Badge>
                    )}
                    {product.specifications && typeof product.specifications === "object" && (
                      <>
                        {product.specifications.green && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            GREEN
                          </Badge>
                        )}
                        {product.specifications.relamp && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            RELAMP
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="col-span-3">
                  <div className="text-sm font-medium text-gray-900">{product.type}</div>
                  {product.specifications && (
                    <div className="text-sm text-gray-600">
                      {typeof product.specifications === "object"
                        ? Object.entries(product.specifications)
                            .filter(([key]) => !["green", "relamp", "disabled"].includes(key))
                            .slice(0, 2)
                            .map(([key, value]) => (
                              <div key={key}>
                                {key}: {String(value)}
                              </div>
                            ))
                        : product.specifications}
                    </div>
                  )}
                  <div className="text-sm text-gray-900 mt-1">
                    <span className="text-xs text-gray-500">
                      {product.units_per_case && product.units_per_case > 1 ? "CASE:" : "UNIT:"}
                    </span>
                    <br />
                    <span className="font-medium">
                      {product.units_per_case && product.units_per_case > 1
                        ? `${product.units_per_case} units • $${product.case_price ? Number(product.case_price).toFixed(2) : "N/A"}`
                        : `1 unit • $${product.unit_price ? Number(product.unit_price).toFixed(2) : "N/A"}`}
                    </span>
                  </div>
                </div>

                {/* Orders */}
                <div className="col-span-2">
                  <div className="text-sm text-gray-900">{product.orders_count || 0} orders</div>
                  <div className="text-xs text-gray-500">{product.assigned_clients_count || 0} clients assigned</div>
                </div>

                {/* Actions */}
                <div className="col-span-2 space-y-1">
                  <Button variant="outline" size="sm" className="w-full text-xs bg-transparent">
                    Delete
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-xs bg-transparent">
                    EDIT
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedProduct(product)
                      setShowAssignModal(true)
                    }}
                    className="w-full text-xs bg-slate-800 hover:bg-slate-700"
                  >
                    ASSIGN
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Pagination Controls */}
      <PaginationControls />

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found matching your filters.</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("")
              setCategory("all")
              setSubCategory("all")
              setIsGreenFilter(false)
              setIsRelampFilter(false)
            }}
            className="mt-4"
          >
            Clear All Filters
          </Button>
        </div>
      )}
      {/* Assignment Modal */}
      {selectedProduct && (
        <AssignProductModal
          product={selectedProduct}
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedProduct(null)
          }}
          onAssignmentChange={() => {
            loadProducts() // Reload products to update counts
          }}
        />
      )}
    </div>
  )
}
