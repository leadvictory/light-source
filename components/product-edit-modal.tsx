"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Save, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Product, Category, Subcategory, ProductAssignment } from "@/lib/supabase"

interface ProductEditModalProps {
  product?: Product & { assignments: ProductAssignment[] }
  isOpen: boolean
  onClose: () => void
  onSave: (product: Product & { assignments: ProductAssignment[] }) => void
  categories: Category[]
  isNewProduct?: boolean
}

export function ProductEditModal({
  product,
  isOpen,
  onClose,
  onSave,
  categories,
  isNewProduct = false,
}: ProductEditModalProps) {
  const [editedProduct, setEditedProduct] = useState<Product & { assignments: ProductAssignment[] }>({
    id: "",
    item_number: "",
    name: "",
    description: "",
    manufacturer: "",
    category: "",
    sub_category: "",
    subcategory_id: "",
    info_type: "",
    info_details: "",
    unit_type: "units",
    base_unit_price: 0,
    base_units_per_case: 1,
    status: "AVAILABLE",
    tag: "",
    image_url: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignments: [],
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedCategory, setSelectedCategory] = useState<string>("none")
  const [availableSubcategories, setAvailableSubcategories] = useState<Subcategory[]>([])

  useEffect(() => {
    if (isOpen) {
      if (product && !isNewProduct) {
        setEditedProduct(product)
        setSelectedCategory(product.subcategory?.category_id || "default")
      } else {
        // Always start with completely empty product for new items
        setEditedProduct({
          id: `temp-${Date.now()}`,
          item_number: "",
          name: "",
          description: "",
          manufacturer: "",
          category: "",
          sub_category: "",
          subcategory_id: "",
          info_type: "",
          info_details: "",
          unit_type: "units",
          base_unit_price: 0,
          base_units_per_case: 1,
          status: "AVAILABLE",
          tag: "",
          image_url: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assignments: [],
        })
        setSelectedCategory("none")
      }
      setErrors({})
    }
  }, [isOpen, product, isNewProduct])

  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find((c) => c.id === selectedCategory)
      setAvailableSubcategories(category?.subcategories || [])
    } else {
      setAvailableSubcategories([])
    }
  }, [selectedCategory, categories])

  const handleInputChange = (field: keyof Product, value: string | number | boolean) => {
    setEditedProduct((prev) => ({
      ...prev,
      [field]: value,
      updated_at: new Date().toISOString(),
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const handleCategoryChange = (categoryValue: string) => {
    setSelectedCategory(categoryValue)
    const category = categories.find((c) => c.name.toLowerCase().replace(/[^a-z0-9]/g, "-") === categoryValue)

    setEditedProduct((prev) => ({
      ...prev,
      category:
        categoryValue !== "none" ? categoryValue.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "",
      subcategory_id: "",
      sub_category: "",
      updated_at: new Date().toISOString(),
    }))
  }

  const handleSubcategoryChange = (subcategoryId: string) => {
    const subcategory = availableSubcategories.find((s) => s.id === subcategoryId)

    setEditedProduct((prev) => ({
      ...prev,
      subcategory_id: subcategoryId,
      sub_category: subcategory?.name || "",
      updated_at: new Date().toISOString(),
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In a real app, you would upload the file to a storage service
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        handleInputChange("image_url", imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!editedProduct.item_number.trim()) {
      newErrors.item_number = "Item number is required"
    }

    if (!editedProduct.name.trim()) {
      newErrors.name = "Product name is required"
    }

    if (!editedProduct.manufacturer?.trim()) {
      newErrors.manufacturer = "Manufacturer is required"
    }

    if (!selectedCategory || selectedCategory === "none") {
      newErrors.category = "Category is required"
    }

    if (!editedProduct.subcategory_id) {
      newErrors.subcategory_id = "Subcategory is required"
    }

    if (!editedProduct.base_unit_price || editedProduct.base_unit_price <= 0) {
      newErrors.base_unit_price = "Base unit price must be greater than 0"
    }

    if (!editedProduct.base_units_per_case || editedProduct.base_units_per_case <= 0) {
      newErrors.base_units_per_case = "Units per case must be greater than 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // In a real app, this would make an API call to save the product
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      onSave(editedProduct)
      onClose()
    } catch (error) {
      console.error("Error saving product:", error)
      setErrors({ general: "Failed to save product. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{isNewProduct ? "Add New Product" : "Edit Product"}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {isNewProduct ? "Create a new product in the catalog" : `Editing: ${product?.item_number}`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-96">
          <div className="p-6 space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{errors.general}</div>
            )}

            {/* Product Image */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center">
                {editedProduct.image_url ? (
                  <img
                    src={editedProduct.image_url || "/placeholder.svg"}
                    alt="Product"
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-white rounded shadow-sm"></div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Product Image</Label>
                <div className="mt-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("image-upload")?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item-number" className="text-sm font-medium text-gray-700">
                    Item Number *
                  </Label>
                  <Input
                    id="item-number"
                    value={editedProduct.item_number}
                    onChange={(e) => handleInputChange("item_number", e.target.value)}
                    className={`mt-1 ${errors.item_number ? "border-red-500" : ""}`}
                    placeholder="e.g., JHBL 24000LM GL WD"
                  />
                  {errors.item_number && <p className="text-red-500 text-xs mt-1">{errors.item_number}</p>}
                </div>

                <div>
                  <Label htmlFor="manufacturer" className="text-sm font-medium text-gray-700">
                    Manufacturer *
                  </Label>
                  <Input
                    id="manufacturer"
                    value={editedProduct.manufacturer || ""}
                    onChange={(e) => handleInputChange("manufacturer", e.target.value)}
                    className={`mt-1 ${errors.manufacturer ? "border-red-500" : ""}`}
                    placeholder="e.g., INTERMATIC"
                  />
                  {errors.manufacturer && <p className="text-red-500 text-xs mt-1">{errors.manufacturer}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Product Name *
                </Label>
                <Input
                  id="name"
                  value={editedProduct.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`mt-1 ${errors.name ? "border-red-500" : ""}`}
                  placeholder="e.g., INTERMATIC Spring Wound Timer"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={editedProduct.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="mt-1"
                  rows={3}
                  placeholder="Detailed product description..."
                />
              </div>
            </div>

            {/* Category Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Category & Classification</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Category *
                  </Label>
                  <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                    <SelectTrigger className={`mt-1 ${errors.category ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ballast">Ballast</SelectItem>
                      <SelectItem value="batteries">Batteries</SelectItem>
                      <SelectItem value="cold-cathode">Cold Cathode</SelectItem>
                      <SelectItem value="compact-fluorescent">Compact Fluorescent</SelectItem>
                      <SelectItem value="fixture">Fixture</SelectItem>
                      <SelectItem value="halogen">Halogen</SelectItem>
                      <SelectItem value="high-intensity-discharge">High Intensity Discharge</SelectItem>
                      <SelectItem value="incandescent">Incandescent</SelectItem>
                      <SelectItem value="led">LED</SelectItem>
                      <SelectItem value="lens">Lens</SelectItem>
                      <SelectItem value="linear-fluorescent">Linear Fluorescent</SelectItem>
                      <SelectItem value="miniature">Miniature</SelectItem>
                      <SelectItem value="misc">Misc.</SelectItem>
                      <SelectItem value="re-lamp-item">Re-lamp Item</SelectItem>
                      <SelectItem value="recycling">Recycling</SelectItem>
                      <SelectItem value="relamp">Relamp</SelectItem>
                      <SelectItem value="safety-products">Safety Products</SelectItem>
                      <SelectItem value="sensor">Sensor</SelectItem>
                      <SelectItem value="socket">Socket</SelectItem>
                      <SelectItem value="switch">Switch</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>

                <div>
                  <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700">
                    Subcategory {selectedCategory === "default" ? "(Select category first)" : "*"}
                  </Label>
                  <Select
                    value={editedProduct.subcategory_id || "none"}
                    onValueChange={(value) => handleSubcategoryChange(value === "none" ? "" : value)}
                    disabled={selectedCategory === "none"}
                  >
                    <SelectTrigger className={`mt-1 ${errors.subcategory_id ? "border-red-500" : ""}`}>
                      <SelectValue
                        placeholder={selectedCategory === "default" ? "Select category first" : "Select subcategory"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select subcategory</SelectItem>
                      {availableSubcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subcategory_id && <p className="text-red-500 text-xs mt-1">{errors.subcategory_id}</p>}
                  {selectedCategory === "none" && (
                    <p className="text-gray-500 text-xs mt-1">Please select a category first to see subcategories</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="info-type" className="text-sm font-medium text-gray-700">
                    Info Type
                  </Label>
                  <Select
                    value={editedProduct.info_type || "none"}
                    onValueChange={(value) => handleInputChange("info_type", value === "none" ? "" : value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select info type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select info type</SelectItem>
                      <SelectItem value="Ballast">Ballast</SelectItem>
                      <SelectItem value="Dimmer">Dimmer</SelectItem>
                      <SelectItem value="Fixture">Fixture</SelectItem>
                      <SelectItem value="Bulbs">Bulbs</SelectItem>
                      <SelectItem value="Switch">Switch</SelectItem>
                      <SelectItem value="Sensor">Sensor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="info-details" className="text-sm font-medium text-gray-700">
                    Info Details
                  </Label>
                  <Input
                    id="info-details"
                    value={editedProduct.info_details || ""}
                    onChange={(e) => handleInputChange("info_details", e.target.value)}
                    className="mt-1"
                    placeholder="e.g., 2 x 2 parabolic"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Pricing & Units</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="unit-type" className="text-sm font-medium text-gray-700">
                    Unit Type
                  </Label>
                  <Select
                    value={editedProduct.unit_type || "units"}
                    onValueChange={(value) => handleInputChange("unit_type", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="units">Units</SelectItem>
                      <SelectItem value="cases">Cases</SelectItem>
                      <SelectItem value="fixtures">Fixtures</SelectItem>
                      <SelectItem value="boxes">Boxes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="base-unit-price" className="text-sm font-medium text-gray-700">
                    Base Unit Price *
                  </Label>
                  <Input
                    id="base-unit-price"
                    type="number"
                    step="0.01"
                    value={editedProduct.base_unit_price || ""}
                    onChange={(e) => handleInputChange("base_unit_price", Number.parseFloat(e.target.value) || 0)}
                    className={`mt-1 ${errors.base_unit_price ? "border-red-500" : ""}`}
                    placeholder="0.00"
                  />
                  {errors.base_unit_price && <p className="text-red-500 text-xs mt-1">{errors.base_unit_price}</p>}
                </div>

                <div>
                  <Label htmlFor="units-per-case" className="text-sm font-medium text-gray-700">
                    Units per Case *
                  </Label>
                  <Input
                    id="units-per-case"
                    type="number"
                    value={editedProduct.base_units_per_case || ""}
                    onChange={(e) => handleInputChange("base_units_per_case", Number.parseInt(e.target.value) || 1)}
                    className={`mt-1 ${errors.base_units_per_case ? "border-red-500" : ""}`}
                    placeholder="1"
                  />
                  {errors.base_units_per_case && (
                    <p className="text-red-500 text-xs mt-1">{errors.base_units_per_case}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Status and Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Status & Tags</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Status
                  </Label>
                  <Select
                    value={editedProduct.status}
                    onValueChange={(value) => handleInputChange("status", value as Product["status"])}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="ASSIGNED">Assigned</SelectItem>
                      <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tag" className="text-sm font-medium text-gray-700">
                    Tag
                  </Label>
                  <Select
                    value={editedProduct.tag || "none"}
                    onValueChange={(value) => handleInputChange("tag", value === "none" ? "" : value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Tag</SelectItem>
                      <SelectItem value="RELAMP">RELAMP</SelectItem>
                      <SelectItem value="GREEN">GREEN</SelectItem>
                      <SelectItem value="NEW">NEW</SelectItem>
                      <SelectItem value="SALE">SALE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {isNewProduct
              ? "Creating new product"
              : `Last updated: ${new Date(editedProduct.updated_at).toLocaleDateString()}`}
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isNewProduct ? "Create Product" : "Save Changes"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
