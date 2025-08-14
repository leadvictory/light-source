"use client"

import { useEffect, useState } from "react"
import { Search, Plus, Edit, ChevronLeft, ChevronRight, Package, ShoppingCart, Users, Building2 } from "lucide-react"
import Header from "@/components/header"
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type Product,
  type ProductAssignment,
  type Category,
  type Subcategory,
  mockProducts,
  mockCategories,
  supabase,
} from "@/lib/supabase"
import { ProductAssignmentModal } from "@/components/product-assignment-modal"
import { ProductEditModal } from "@/components/product-edit-modal"
import Link from "next/link"

const ITEMS_PER_PAGE = 20

export default function ProductsPage() {
  const [products, setProducts] = useState<(Product & { assignments: ProductAssignment[] })[]>([])
  const [filteredProducts, setFilteredProducts] = useState<(Product & { assignments: ProductAssignment[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [assignmentFilter, setAssignmentFilter] = useState("all")
  const [tagFilter, setTagFilter] = useState("all") // New tag filter state
  const [useSupabase, setUseSupabase] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<(Product & { assignments: ProductAssignment[] }) | null>(null)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [subcategoryFilter, setSubcategoryFilter] = useState("all")
  const [userRole] = useState<"OWNER" | "SUPERCUSTOMER" | "CUSTOMER">("OWNER") // This would come from auth context
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Product editing states
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<
    (Product & { assignments: ProductAssignment[] }) | null
  >(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isNewProduct, setIsNewProduct] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [useSupabase])

  useEffect(() => {
    applyFilters()
  }, [products, searchTerm, categoryFilter, subcategoryFilter, assignmentFilter, tagFilter])

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, subcategoryFilter, assignmentFilter, tagFilter])

  const fetchProducts = async () => {
    try {
      setLoading(true)

      if (!useSupabase) {
        // Use mock data - expand it for demonstration
        const expandedMockProducts = []
        for (let i = 0; i < 50; i++) {
          expandedMockProducts.push(
            ...mockProducts.map((product, index) => ({
              ...product,
              id: `${product.id}-${i}`,
              item_number: `${product.item_number}-${i.toString().padStart(3, "0")}`,
              name: `${product.name} (Variant ${i + 1})`,
              // Vary tags for demonstration
              tag: i % 4 === 0 ? "GREEN" : i % 3 === 0 ? "RELAMP" : i % 5 === 0 ? "NEW" : product.tag,
            })),
          )
        }
        setProducts(expandedMockProducts)
        return
      }

      const query = supabase.from("products").select(`
          *,
          subcategory:subcategories(
            *,
            category:categories(*)
          ),
          product_assignments(
            id,
            assigned_to_company_id,
            assigned_to_user_id,
            client_unit_price,
            client_case_price,
            client_units_per_case,
            is_active,
            assigned_to_company:companies(name),
            assigned_to_user:users(name)
          )
        `)

      const { data, error } = await query.order("updated_at", { ascending: false })

      if (error) {
        console.warn("Supabase error, falling back to mock data:", error)
        setUseSupabase(false)
        return
      }

      // Transform data to include assignments
      const transformedProducts =
        data?.map((product) => ({
          ...product,
          assignments: product.product_assignments || [],
        })) || []

      setProducts(transformedProducts)
    } catch (error) {
      console.warn("Error fetching products, using mock data:", error)
      setUseSupabase(false)
      // Create expanded mock data for demonstration
      const expandedMockProducts = []
      for (let i = 0; i < 50; i++) {
        expandedMockProducts.push(
          ...mockProducts.map((product, index) => ({
            ...product,
            id: `${product.id}-${i}`,
            item_number: `${product.item_number}-${i.toString().padStart(3, "0")}`,
            name: `${product.name} (Variant ${i + 1})`,
            // Vary tags for demonstration
            tag: i % 4 === 0 ? "GREEN" : i % 3 === 0 ? "RELAMP" : i % 5 === 0 ? "NEW" : product.tag,
          })),
        )
      }
      setProducts(expandedMockProducts)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...products]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.item_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter)
    }

    // Apply subcategory filter
    if (subcategoryFilter !== "all") {
      filtered = filtered.filter((product) => product.subcategory_id === subcategoryFilter)
    }

    // Apply assignment filter
    if (assignmentFilter === "assigned") {
      filtered = filtered.filter((p) => p.assignments.length > 0)
    } else if (assignmentFilter === "unassigned") {
      filtered = filtered.filter((p) => p.assignments.length === 0)
    }

    // Apply tag filter
    if (tagFilter !== "all") {
      filtered = filtered.filter((product) => product.tag === tagFilter)
    }

    setFilteredProducts(filtered)
    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE))
  }

  const fetchCategories = async () => {
    try {
      if (!useSupabase) {
        setCategories(mockCategories)
        setSubcategories(mockCategories.flatMap((cat) => cat.subcategories || []))
        return
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select(`
        *,
        subcategories(*)
      `)
        .eq("is_active", true)
        .order("sort_order")

      if (categoriesError) {
        console.warn("Categories error, using mock data:", categoriesError)
        setCategories(mockCategories)
        setSubcategories(mockCategories.flatMap((cat) => cat.subcategories || []))
        return
      }

      setCategories(categoriesData || [])
      setSubcategories(categoriesData?.flatMap((cat) => cat.subcategories || []) || [])
    } catch (error) {
      console.warn("Error fetching categories:", error)
      setCategories(mockCategories)
      setSubcategories(mockCategories.flatMap((cat) => cat.subcategories || []))
    }
  }

  const handleTagFilter = (tag: string) => {
    setTagFilter(tag)
  }

  const handleAssignProduct = (product: Product & { assignments: ProductAssignment[] }) => {
    setSelectedProduct(product)
    setIsAssignmentModalOpen(true)
  }

  const handleEditProduct = (product: Product & { assignments: ProductAssignment[] }) => {
    setSelectedProductForEdit(product)
    setIsNewProduct(false)
    setIsEditModalOpen(true)
  }

  const handleAddNewProduct = () => {
    setSelectedProductForEdit(null)
    setIsNewProduct(true)
    setIsEditModalOpen(true)
  }

  const handleSaveAssignments = (assignments: ProductAssignment[]) => {
    // Update the product in the local state
    setProducts((prev) =>
      prev.map((product) => (product.id === selectedProduct?.id ? { ...product, assignments } : product)),
    )

    // In a real app, this would also update the database
    console.log("Saving assignments:", assignments)
  }

  const handleSaveProduct = (updatedProduct: Product & { assignments: ProductAssignment[] }) => {
    if (isNewProduct) {
      // Add new product to the list
      setProducts((prev) => [updatedProduct, ...prev])
      console.log("Creating new product:", updatedProduct)
    } else {
      // Update existing product
      setProducts((prev) => prev.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)))
      console.log("Updating product:", updatedProduct)
    }

    // In a real app, this would also update the database
  }

  // Get current page products
  const getCurrentPageProducts = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredProducts.slice(startIndex, endIndex)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading products...</div>
      </div>
    )
  }

  const currentPageProducts = getCurrentPageProducts()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        userRole={userRole}
        userName={userRole === "OWNER" ? "RANDY" : "Paramount"}
        onLogout={handleLogout}
      />

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          <Link href="/orders" className="py-4 text-gray-600 hover:text-gray-900 flex items-center space-x-2">
            <span>📦</span>
            <span>Orders</span>
          </Link>
          <Link href="/" className="py-4 text-white bg-blue-900 px-4 rounded-t-lg flex items-center space-x-2">
            <span>📋</span>
            <span>Products</span>
          </Link>
          <Link href="/clients" className="py-4 text-gray-600 hover:text-gray-900 flex items-center space-x-2">
            <span>👥</span>
            <span>Clients</span>
          </Link>
        </div>
      </nav>

      {/* Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Main Content */}
        <main className="p-6">
          <div className="bg-white rounded-lg shadow">
            {/* Header Section */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Products ({filteredProducts.length.toLocaleString()})
                  </h1>
                  {filteredProducts.length !== products.length && (
                    <p className="text-sm text-gray-600 mt-1">
                      Showing {filteredProducts.length.toLocaleString()} of {products.length.toLocaleString()} products
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {userRole === "OWNER" && (
                    <Button onClick={handleAddNewProduct} className="bg-green-600 hover:bg-green-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Product
                    </Button>
                  )}
                  <Button
                    variant={tagFilter === "GREEN" ? "default" : "outline"}
                    className={
                      tagFilter === "GREEN"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "text-green-600 border-green-600 bg-transparent hover:bg-green-50"
                    }
                    onClick={() => handleTagFilter(tagFilter === "GREEN" ? "all" : "GREEN")}
                  >
                    GREEN
                    {tagFilter === "GREEN" && (
                      <span className="ml-2 text-xs bg-green-800 text-white px-2 py-1 rounded">
                        {filteredProducts.filter((p) => p.tag === "GREEN").length}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant={tagFilter === "RELAMP" ? "default" : "outline"}
                    className={
                      tagFilter === "RELAMP"
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "text-purple-600 border-purple-600 bg-transparent hover:bg-purple-50"
                    }
                    onClick={() => handleTagFilter(tagFilter === "RELAMP" ? "all" : "RELAMP")}
                  >
                    RELAMP
                    {tagFilter === "RELAMP" && (
                      <span className="ml-2 text-xs bg-purple-800 text-white px-2 py-1 rounded">
                        {filteredProducts.filter((p) => p.tag === "RELAMP").length}
                      </span>
                    )}
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">Bulk Assign Products</Button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search products by item # or keyword..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40 bg-gray-400 text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                  <SelectTrigger className="w-40 bg-gray-400 text-white">
                    <SelectValue placeholder="Sub Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sub Categories</SelectItem>
                    {subcategories
                      .filter((sub) => categoryFilter === "all" || sub.category_id === categoryFilter)
                      .map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                  <SelectTrigger className="w-48 bg-green-600 text-white">
                    <SelectValue placeholder="Filter by Assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="assigned">Assigned Only</SelectItem>
                    <SelectItem value="unassigned">Unassigned Only</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-40 bg-blue-600 text-white">
                    <SelectValue placeholder="MOST RECENT" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters Display */}
              {(tagFilter !== "all" ||
                searchTerm ||
                categoryFilter !== "all" ||
                subcategoryFilter !== "all" ||
                assignmentFilter !== "all") && (
                <div className="flex items-center space-x-2 mt-4">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {tagFilter !== "all" && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Tag: {tagFilter}
                      <button onClick={() => setTagFilter("all")} className="ml-2 text-blue-600 hover:text-blue-800">
                        ×
                      </button>
                    </Badge>
                  )}
                  {searchTerm && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Search: "{searchTerm}"
                      <button onClick={() => setSearchTerm("")} className="ml-2 text-blue-600 hover:text-blue-800">
                        ×
                      </button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTagFilter("all")
                      setSearchTerm("")
                      setCategoryFilter("all")
                      setSubcategoryFilter("all")
                      setAssignmentFilter("all")
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Clear all filters
                  </Button>
                </div>
              )}

              {/* Top Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of{" "}
                    {filteredProducts.length.toLocaleString()} products
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center space-x-1">
                      {getPageNumbers().map((pageNum) => (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 ${
                            currentPage === pageNum ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          {pageNum}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Table Header */}
            <div className="bg-blue-900 text-white px-6 py-3">
              <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium">
                <div className="col-span-3">ITEM NUMBER</div>
                <div className="col-span-4">DESCRIPTION</div>
                <div className="col-span-2">CATEGORY & PRICING</div>
                <div className="col-span-3">ACTIONS</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {currentPageProducts.map((product, index) => (
                <div key={product.id} className={`px-6 py-4 ${index % 2 === 1 ? "bg-gray-50" : "bg-white"}`}>
                  <div className="grid grid-cols-12 gap-4 items-start">
                    {/* Product Image and Item Number */}
                    <div className="col-span-3 flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                          {product.image_url ? (
                            <img
                              src={product.image_url || "/placeholder.svg"}
                              alt={product.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-white rounded shadow-sm"></div>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 break-words">{product.item_number}</div>
                        {product.tag && (
                          <Badge
                            variant="secondary"
                            className={`mt-1 ${
                              product.tag === "GREEN"
                                ? "bg-green-500 text-white"
                                : product.tag === "RELAMP"
                                  ? "bg-purple-500 text-white"
                                  : "bg-gray-500 text-white"
                            }`}
                          >
                            {product.tag}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="col-span-4">
                      <div className="text-sm font-medium text-gray-900 mb-1">{product.manufacturer}</div>
                      <div className="text-sm text-gray-900 mb-1">{product.name}</div>
                      <div className="text-xs text-gray-600 line-clamp-2">{product.description}</div>
                    </div>

                    {/* Category & Pricing */}
                    <div className="col-span-2">
                      <div className="text-sm text-gray-900">{product.subcategory?.name || product.sub_category}</div>
                      <div className="text-sm text-gray-600">
                        {product.subcategory?.category?.name || product.category}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        BASE PRICE:
                        <br />${product.base_unit_price} • {product.base_units_per_case} {product.unit_type}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 flex flex-col space-y-2">
                      {userRole === "OWNER" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            EDIT PRODUCT
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleAssignProduct(product)}
                          >
                            ASSIGN TO CLIENTS
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                          >
                            DELETE
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of{" "}
                    {filteredProducts.length.toLocaleString()} products
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center space-x-1">
                      {getPageNumbers().map((pageNum) => (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 ${
                            currentPage === pageNum ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          {pageNum}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredProducts.length === 0 && (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-500 text-lg mb-2">No products found</div>
                <div className="text-gray-400 text-sm">
                  Try adjusting your search terms or filters to find what you're looking for.
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Product Assignment Modal */}
        {selectedProduct && (
          <ProductAssignmentModal
            product={selectedProduct}
            isOpen={isAssignmentModalOpen}
            onClose={() => {
              setIsAssignmentModalOpen(false)
              setSelectedProduct(null)
            }}
            onSave={handleSaveAssignments}
          />
        )}

        {/* Product Edit Modal */}
        <ProductEditModal
          product={selectedProductForEdit || undefined}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedProductForEdit(null)
            setIsNewProduct(false)
          }}
          onSave={handleSaveProduct}
          categories={categories}
          isNewProduct={isNewProduct}
        />
      </div>
    </div>
  )
}
