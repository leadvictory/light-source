"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Save, Upload, Building2, MapPin, Trash2, Users, Plus, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { Company } from "@/lib/supabase"

interface ClientEditModalProps {
  client: Company
  isOpen: boolean
  onClose: () => void
  onSave: (updatedClient: Company) => void
}

interface Tenant {
  id: string
  name: string
  email?: string
  phone?: string
  company_id: string
}

interface Floor {
  id: string
  name: string
  floor_number?: number
  tenant?: Tenant | null
  tenant_id?: string | null
}

interface Building {
  id: string
  name: string
  address: string
  floors: Floor[]
}

// Mock tenants data - in real app this would come from the database
const mockTenants: Tenant[] = [
  { id: "1", name: "Tech Startup Inc", email: "admin@techstartup.com", phone: "555-0123", company_id: "tenant1" },
  { id: "2", name: "Law Firm LLC", email: "contact@lawfirm.com", phone: "555-0124", company_id: "tenant2" },
  { id: "3", name: "Marketing Agency", email: "hello@marketing.com", phone: "555-0125", company_id: "tenant3" },
  { id: "4", name: "Consulting Group", email: "info@consulting.com", phone: "555-0126", company_id: "tenant4" },
  { id: "5", name: "Design Studio", email: "studio@design.com", phone: "555-0127", company_id: "tenant5" },
]

export function ClientEditModal({ client, isOpen, onClose, onSave }: ClientEditModalProps) {
  const [editedClient, setEditedClient] = useState<Company>(client)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [buildings, setBuildings] = useState<Building[]>(client.buildings || [])
  const [newBuilding, setNewBuilding] = useState({ name: "", address: "" })
  const [showAddBuilding, setShowAddBuilding] = useState(false)
  const [availableTenants] = useState<Tenant[]>(mockTenants)
  const [selectedBuildingForTenants, setSelectedBuildingForTenants] = useState<string | null>(null)
  const [deletionLog, setDeletionLog] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      setEditedClient(client)
      setErrors({})
      setDeletionLog([])
      // Initialize buildings with proper floor structure
      const initialBuildings = (client.buildings || []).map((building) => ({
        ...building,
        floors:
          building.floors?.map((floor) => ({
            ...floor,
            tenant: floor.tenant_id ? availableTenants.find((t) => t.id === floor.tenant_id) || null : null,
          })) || [],
      }))
      setBuildings(initialBuildings)
    }
  }, [isOpen, client, availableTenants])

  const handleInputChange = (field: keyof Company, value: string | boolean) => {
    setEditedClient((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const handleAddBuilding = () => {
    if (newBuilding.name.trim() && newBuilding.address.trim()) {
      const building: Building = {
        id: `building-${Date.now()}`,
        name: newBuilding.name.trim(),
        address: newBuilding.address.trim(),
        floors: [],
      }

      setBuildings((prev) => {
        const updatedBuildings = [...prev, building]
        console.log("Adding building:", building.name)
        console.log("Buildings count before:", prev.length)
        console.log("Buildings count after:", updatedBuildings.length)
        return updatedBuildings
      })

      setNewBuilding({ name: "", address: "" })
      setShowAddBuilding(false)

      // Log building addition
      setDeletionLog((prev) => [...prev, `✅ Added building: "${building.name}" at ${building.address}`])
    } else {
      setDeletionLog((prev) => [...prev, `❌ Cannot add building: Name and address are required`])
    }
  }

  const handleEditBuilding = (buildingId: string) => {
    const building = buildings.find((b) => b.id === buildingId)
    if (!building) return

    const newName = window.prompt("Edit building name:", building.name)
    if (newName && newName.trim() && newName !== building.name) {
      const newAddress = window.prompt("Edit building address:", building.address)
      if (newAddress && newAddress.trim()) {
        setBuildings((prev) =>
          prev.map((b) => (b.id === buildingId ? { ...b, name: newName.trim(), address: newAddress.trim() } : b)),
        )
        setDeletionLog((prev) => [...prev, `✏️ Edited building: "${building.name}" → "${newName.trim()}"`])
      }
    }
  }

  const handleRemoveBuilding = (buildingId: string) => {
    const buildingToDelete = buildings.find((b) => b.id === buildingId)
    if (!buildingToDelete) {
      setDeletionLog((prev) => [...prev, `❌ Error: Building with ID ${buildingId} not found`])
      return
    }

    const tenantsAffected = buildingToDelete.floors.filter((f) => f.tenant).length
    const floorsCount = buildingToDelete.floors.length
    const tenantNames = buildingToDelete.floors
      .filter((f) => f.tenant)
      .map((f) => f.tenant!.name)
      .join(", ")

    const confirmMessage =
      tenantsAffected > 0
        ? `Are you sure you want to delete "${buildingToDelete.name}"?\n\nThis will remove:\n• ${floorsCount} floors\n• ${tenantsAffected} tenant assignments\n• Affected tenants: ${tenantNames}\n\nThis action cannot be undone.`
        : `Are you sure you want to delete "${buildingToDelete.name}"?\n\nThis will remove ${floorsCount} floors.\n\nThis action cannot be undone.`

    if (window.confirm(confirmMessage)) {
      // Log deletion details before removing
      setDeletionLog((prev) => [
        ...prev,
        `🗑️ Deleted building: "${buildingToDelete.name}"`,
        `   • Removed ${floorsCount} floors`,
        `   • Removed ${tenantsAffected} tenant assignments`,
        ...(tenantNames ? [`   • Affected tenants: ${tenantNames}`] : []),
      ])

      // Remove the building
      setBuildings((prev) => {
        const newBuildings = prev.filter((b) => b.id !== buildingId)
        console.log("Buildings before deletion:", prev.length)
        console.log("Buildings after deletion:", newBuildings.length)
        console.log("Deleted building:", buildingToDelete.name)
        return newBuildings
      })

      // Close tenant management panel if it was open for this building
      if (selectedBuildingForTenants === buildingId) {
        setSelectedBuildingForTenants(null)
      }
    } else {
      setDeletionLog((prev) => [...prev, `❌ Deletion cancelled for: "${buildingToDelete.name}"`])
    }
  }

  const handleAddFloor = (buildingId: string) => {
    const floorName = window.prompt("Enter floor name:")
    if (floorName?.trim()) {
      const newFloor = {
        id: `floor-${Date.now()}`,
        name: floorName.trim(),
        tenant: null,
        tenant_id: null,
      }

      setBuildings((prev) =>
        prev.map((building) =>
          building.id === buildingId
            ? {
                ...building,
                floors: [...building.floors, newFloor],
              }
            : building,
        ),
      )

      const building = buildings.find((b) => b.id === buildingId)
      setDeletionLog((prev) => [...prev, `➕ Added floor "${floorName.trim()}" to building "${building?.name}"`])
    }
  }

  const handleRemoveFloor = (buildingId: string, floorId: string) => {
    const building = buildings.find((b) => b.id === buildingId)
    const floor = building?.floors.find((f) => f.id === floorId)

    setBuildings((prev) =>
      prev.map((building) =>
        building.id === buildingId
          ? {
              ...building,
              floors: building.floors.filter((f) => f.id !== floorId),
            }
          : building,
      ),
    )

    if (building && floor) {
      setDeletionLog((prev) => [
        ...prev,
        `➖ Removed floor "${floor.name}" from building "${building.name}"${floor.tenant ? ` (was assigned to ${floor.tenant.name})` : ""}`,
      ])
    }
  }

  const handleAssignTenant = (buildingId: string, floorId: string, tenantId: string | null) => {
    const tenant = tenantId ? availableTenants.find((t) => t.id === tenantId) || null : null
    const building = buildings.find((b) => b.id === buildingId)
    const floor = building?.floors.find((f) => f.id === floorId)

    setBuildings((prev) =>
      prev.map((building) =>
        building.id === buildingId
          ? {
              ...building,
              floors: building.floors.map((floor) =>
                floor.id === floorId ? { ...floor, tenant, tenant_id: tenantId } : floor,
              ),
            }
          : building,
      ),
    )

    if (building && floor) {
      if (tenant) {
        setDeletionLog((prev) => [
          ...prev,
          `👤 Assigned "${tenant.name}" to floor "${floor.name}" in "${building.name}"`,
        ])
      } else {
        setDeletionLog((prev) => [...prev, `👤 Unassigned tenant from floor "${floor.name}" in "${building.name}"`])
      }
    }
  }

  const getUnassignedTenants = (buildingId: string, currentFloorId?: string) => {
    const building = buildings.find((b) => b.id === buildingId)
    if (!building) return availableTenants

    const assignedTenantIds = building.floors
      .filter((f) => f.id !== currentFloorId && f.tenant_id)
      .map((f) => f.tenant_id)

    return availableTenants.filter((tenant) => !assignedTenantIds.includes(tenant.id))
  }

  const handleAdminUserChange = (field: string, value: string) => {
    setEditedClient((prev) => ({
      ...prev,
      admin_user: prev.admin_user
        ? {
            ...prev.admin_user,
            [field]: value,
          }
        : {
            id: "",
            email: "",
            name: "",
            role: "CUSTOMER" as const,
            phone: "",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            [field]: value,
          },
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!editedClient.name.trim()) {
      newErrors.name = "Company name is required"
    }

    if (editedClient.admin_user?.email && !isValidEmail(editedClient.admin_user.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (editedClient.admin_user?.phone && !isValidPhone(editedClient.admin_user.phone)) {
      newErrors.phone = "Please enter a valid phone number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isValidPhone = (phone: string) => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ""))
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const updatedClient = {
        ...editedClient,
        buildings: buildings,
        updated_at: new Date().toISOString(),
      }

      // Log final state before saving
      setDeletionLog((prev) => [
        ...prev,
        `💾 Saving client with ${buildings.length} buildings`,
        ...buildings.map(
          (b) => `   • "${b.name}": ${b.floors.length} floors, ${b.floors.filter((f) => f.tenant).length} assigned`,
        ),
      ])

      // In a real app, this would make an API call to update the client
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      onSave(updatedClient)
      onClose()
    } catch (error) {
      console.error("Error saving client:", error)
      setErrors({ general: "Failed to save client. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In a real app, you would upload the file to a storage service
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        handleInputChange("logo_url", imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearDeletionLog = () => {
    setDeletionLog([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Client</h2>
            <p className="text-sm text-gray-600 mt-1">Update client information, buildings, and tenant assignments</p>
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

            {/* Deletion Log - Only show if there are entries */}
            {deletionLog.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-blue-900 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Activity Log
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearDeletionLog}
                    className="text-xs bg-transparent"
                  >
                    Clear Log
                  </Button>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {deletionLog.map((entry, index) => (
                    <div key={index} className="text-xs text-blue-800 font-mono mb-1">
                      {entry}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Company Logo */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={editedClient.logo_url || "/placeholder.svg"} alt={editedClient.name} />
                <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-xl">
                  {editedClient.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <Label className="text-sm font-medium text-gray-700">Company Logo</Label>
                <div className="mt-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("logo-upload")?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Company Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name" className="text-sm font-medium text-gray-700">
                    Company Name *
                  </Label>
                  <Input
                    id="company-name"
                    value={editedClient.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`mt-1 ${errors.name ? "border-red-500" : ""}`}
                    placeholder="Enter company name"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="company-type" className="text-sm font-medium text-gray-700">
                    Company Type
                  </Label>
                  <Select
                    value={editedClient.type}
                    onValueChange={(value) => handleInputChange("type", value as "SUPERCUSTOMER" | "CUSTOMER")}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Customer</SelectItem>
                      <SelectItem value="SUPERCUSTOMER">Super Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editedClient.is_visible}
                  onCheckedChange={(checked) => handleInputChange("is_visible", checked)}
                  className="data-[state=checked]:bg-orange-500"
                />
                <div className="flex flex-col">
                  <Label className="text-sm font-medium text-gray-700">Enable client access to system</Label>
                  <span className="text-xs text-gray-500">
                    When disabled, client cannot log in or view their orders
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Admin Contact</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="admin-name" className="text-sm font-medium text-gray-700">
                    Admin Name
                  </Label>
                  <Input
                    id="admin-name"
                    value={editedClient.admin_user?.name || ""}
                    onChange={(e) => handleAdminUserChange("name", e.target.value)}
                    className="mt-1"
                    placeholder="Enter admin name"
                  />
                </div>

                <div>
                  <Label htmlFor="admin-email" className="text-sm font-medium text-gray-700">
                    Admin Email
                  </Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={editedClient.admin_user?.email || ""}
                    onChange={(e) => handleAdminUserChange("email", e.target.value)}
                    className={`mt-1 ${errors.email ? "border-red-500" : ""}`}
                    placeholder="admin@company.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="admin-phone" className="text-sm font-medium text-gray-700">
                    Admin Phone
                  </Label>
                  <Input
                    id="admin-phone"
                    type="tel"
                    value={editedClient.admin_user?.phone || ""}
                    onChange={(e) => handleAdminUserChange("phone", e.target.value)}
                    className={`mt-1 ${errors.phone ? "border-red-500" : ""}`}
                    placeholder="(555) 123-4567"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <Label htmlFor="admin-role" className="text-sm font-medium text-gray-700">
                    Admin Role
                  </Label>
                  <Select
                    value={editedClient.admin_user?.role || "CUSTOMER"}
                    onValueChange={(value) => handleAdminUserChange("role", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Customer</SelectItem>
                      <SelectItem value="SUPERCUSTOMER">Super Customer</SelectItem>
                      <SelectItem value="TENANT">Tenant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={editedClient.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="mt-1"
                rows={3}
                placeholder="Add any additional notes about this client..."
              />
            </div>

            {/* Buildings Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Buildings & Tenant Assignments ({buildings.length} buildings)
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddBuilding(true)}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Add Building
                </Button>
              </div>

              {/* Add Building Form */}
              {showAddBuilding && (
                <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Building</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="building-name" className="text-sm font-medium text-gray-700">
                        Building Name
                      </Label>
                      <Input
                        id="building-name"
                        value={newBuilding.name}
                        onChange={(e) => setNewBuilding((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Empire State Building"
                        className="mt-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            if (newBuilding.name.trim() && newBuilding.address.trim()) {
                              handleAddBuilding()
                            }
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="building-address" className="text-sm font-medium text-gray-700">
                        Address
                      </Label>
                      <Input
                        id="building-address"
                        value={newBuilding.address}
                        onChange={(e) => setNewBuilding((prev) => ({ ...prev, address: e.target.value }))}
                        placeholder="e.g., 350 5th Ave, New York, NY"
                        className="mt-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            if (newBuilding.name.trim() && newBuilding.address.trim()) {
                              handleAddBuilding()
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddBuilding(false)
                        setNewBuilding({ name: "", address: "" })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddBuilding}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={!newBuilding.name.trim() || !newBuilding.address.trim()}
                    >
                      Add Building
                    </Button>
                  </div>
                </div>
              )}

              {/* Buildings List */}
              <div className="space-y-4">
                {buildings.map((building) => (
                  <div key={building.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <h4 className="font-medium text-gray-900">{building.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            ID: {building.id}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <p className="text-sm text-gray-600">{building.address}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditBuilding(building.id)}
                          className="text-gray-600 border-gray-600 hover:bg-gray-50"
                        >
                          <Building2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedBuildingForTenants(
                              selectedBuildingForTenants === building.id ? null : building.id,
                            )
                          }
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <Users className="w-3 h-3 mr-1" />
                          {selectedBuildingForTenants === building.id ? "Hide" : "Manage"} Tenants
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveBuilding(building.id)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Floors and Tenant Management */}
                    <div className="ml-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Floors ({building.floors.length})</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddFloor(building.id)}
                          className="text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Floor
                        </Button>
                      </div>

                      {building.floors.length > 0 ? (
                        <div className="space-y-3">
                          {building.floors.map((floor) => (
                            <div
                              key={floor.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                            >
                              <div className="flex items-center space-x-3">
                                <span className="font-medium text-sm">{floor.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {floor.id}
                                </Badge>
                                {floor.tenant ? (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    <Users className="w-3 h-3 mr-1" />
                                    {floor.tenant.name}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-gray-500">
                                    Unassigned
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center space-x-2">
                                {selectedBuildingForTenants === building.id && (
                                  <Select
                                    value={floor.tenant_id || "unassigned"}
                                    onValueChange={(value) =>
                                      handleAssignTenant(building.id, floor.id, value === "unassigned" ? null : value)
                                    }
                                  >
                                    <SelectTrigger className="w-40 text-xs">
                                      <SelectValue placeholder="Assign tenant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="unassigned">Unassigned</SelectItem>
                                      {getUnassignedTenants(building.id, floor.id).map((tenant) => (
                                        <SelectItem key={tenant.id} value={tenant.id}>
                                          {tenant.name}
                                        </SelectItem>
                                      ))}
                                      {floor.tenant && (
                                        <SelectItem value={floor.tenant.id}>{floor.tenant.name} (Current)</SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleRemoveFloor(building.id, floor.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No floors added yet</p>
                      )}
                    </div>

                    {/* Tenant Summary */}
                    {building.floors.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <div className="text-xs font-medium text-blue-800 mb-2">Tenant Summary:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-blue-700">Assigned Floors: </span>
                            <span className="font-medium">{building.floors.filter((f) => f.tenant).length}</span>
                          </div>
                          <div>
                            <span className="text-blue-700">Available Floors: </span>
                            <span className="font-medium">{building.floors.filter((f) => !f.tenant).length}</span>
                          </div>
                        </div>
                        {building.floors.filter((f) => f.tenant).length > 0 && (
                          <div className="mt-2">
                            <span className="text-blue-700 text-xs">Active Tenants: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {building.floors
                                .filter((f) => f.tenant)
                                .map((f) => f.tenant!)
                                .filter((tenant, index, self) => self.findIndex((t) => t.id === tenant.id) === index)
                                .map((tenant) => (
                                  <Badge key={tenant.id} variant="outline" className="text-xs">
                                    {tenant.name}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {buildings.length === 0 && !showAddBuilding && (
                  <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No buildings added yet</p>
                    <p className="text-xs">Click "Add Building" to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Last updated: {new Date(editedClient.updated_at).toLocaleDateString()}
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
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
