"use client"

import { useState, useEffect } from "react"
import { X, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { type Product, type Company, type ProductAssignment, mockCompanies } from "@/lib/supabase"

interface ProductAssignmentModalProps {
  product: Product & { assignments: ProductAssignment[] }
  isOpen: boolean
  onClose: () => void
  onSave: (assignments: ProductAssignment[]) => void
}

export function ProductAssignmentModal({ product, isOpen, onClose, onSave }: ProductAssignmentModalProps) {
  const [clients, setClients] = useState<Company[]>([])
  const [assignments, setAssignments] = useState<Map<string, ProductAssignment>>(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Load clients (using mock data for now)
      setClients(mockCompanies)

      // Initialize assignments map
      const assignmentMap = new Map<string, ProductAssignment>()
      product.assignments.forEach((assignment) => {
        assignmentMap.set(assignment.assigned_to_company_id, assignment)
      })
      setAssignments(assignmentMap)
    }
  }, [isOpen, product])

  const handleAssignmentToggle = (clientId: string, isAssigned: boolean) => {
    const newAssignments = new Map(assignments)

    if (isAssigned) {
      // Create new assignment with default pricing
      const newAssignment: ProductAssignment = {
        id: `temp-${Date.now()}`,
        product_id: product.id,
        assigned_to_company_id: clientId,
        assigned_by_user_id: "owner",
        client_unit_price: product.base_unit_price,
        client_case_price: (product.base_unit_price || 0) * (product.base_units_per_case || 1),
        client_units_per_case: product.base_units_per_case,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assigned_to_company: clients.find((c) => c.id === clientId),
      }
      newAssignments.set(clientId, newAssignment)
    } else {
      // Remove assignment
      newAssignments.delete(clientId)
    }

    setAssignments(newAssignments)
  }

  const handlePricingChange = (clientId: string, field: string, value: number) => {
    const newAssignments = new Map(assignments)
    const assignment = newAssignments.get(clientId)

    if (assignment) {
      const updatedAssignment = {
        ...assignment,
        [field]: value,
        updated_at: new Date().toISOString(),
      }

      // Auto-calculate case price when unit price or units per case changes
      if (field === "client_unit_price" || field === "client_units_per_case") {
        updatedAssignment.client_case_price =
          (updatedAssignment.client_unit_price || 0) * (updatedAssignment.client_units_per_case || 1)
      }

      newAssignments.set(clientId, updatedAssignment)
      setAssignments(newAssignments)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const assignmentArray = Array.from(assignments.values())
      onSave(assignmentArray)
      onClose()
    } catch (error) {
      console.error("Error saving assignments:", error)
    } finally {
      setLoading(false)
    }
  }

  const isAssigned = (clientId: string) => assignments.has(clientId)
  const getAssignment = (clientId: string) => assignments.get(clientId)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Assign Product to Clients</h2>
            <p className="text-sm text-gray-600 mt-1">
              {product.item_number} - {product.name}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
              <div className="w-12 h-12 bg-white rounded shadow-sm"></div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{product.manufacturer}</h3>
              <p className="text-sm text-gray-600">{product.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="outline">Base: ${product.base_unit_price}</Badge>
                <Badge variant="outline">{product.base_units_per_case} units/case</Badge>
                {product.tag && <Badge className="bg-gray-500 text-white">{product.tag}</Badge>}
              </div>
            </div>
          </div>
        </div>

        {/* Client List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Clients & Set Pricing</h3>
            <div className="space-y-4">
              {clients.map((client) => {
                const assigned = isAssigned(client.id)
                const assignment = getAssignment(client.id)

                return (
                  <div key={client.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={client.logo_url || "/placeholder.svg"} alt={client.name} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                            {client.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-gray-900">{client.name}</h4>
                          <p className="text-sm text-gray-600">{client.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={assigned}
                          onCheckedChange={(checked) => handleAssignmentToggle(client.id, checked)}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <span className="text-sm text-gray-600">{assigned ? "Assigned" : "Not Assigned"}</span>
                      </div>
                    </div>

                    {assigned && assignment && (
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <Label htmlFor={`unit-price-${client.id}`} className="text-sm font-medium text-gray-700">
                            Unit Price
                          </Label>
                          <div className="relative mt-1">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              id={`unit-price-${client.id}`}
                              type="number"
                              step="0.01"
                              value={assignment.client_unit_price || ""}
                              onChange={(e) =>
                                handlePricingChange(
                                  client.id,
                                  "client_unit_price",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              className="pl-10"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`units-per-case-${client.id}`} className="text-sm font-medium text-gray-700">
                            Units per Case
                          </Label>
                          <Input
                            id={`units-per-case-${client.id}`}
                            type="number"
                            value={assignment.client_units_per_case || ""}
                            onChange={(e) =>
                              handlePricingChange(
                                client.id,
                                "client_units_per_case",
                                Number.parseInt(e.target.value) || 0,
                              )
                            }
                            className="mt-1"
                            placeholder="1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`case-price-${client.id}`} className="text-sm font-medium text-gray-700">
                            Case Price
                          </Label>
                          <div className="relative mt-1">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              id={`case-price-${client.id}`}
                              type="number"
                              step="0.01"
                              value={assignment.client_case_price || ""}
                              onChange={(e) =>
                                handlePricingChange(
                                  client.id,
                                  "client_case_price",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              className="pl-10"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {assignments.size} client{assignments.size !== 1 ? "s" : ""} selected
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? "Saving..." : "Save Assignments"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
