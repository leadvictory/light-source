"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Users, Package, Building2, Mail, Phone } from "lucide-react"
import { getClients, getClientProductCounts } from "@/lib/api/clients"
import { ClientProductsModal } from "@/components/admin/client-products-modal"

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Client products modal state
  const [productsModalOpen, setProductsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const filtered = clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredClients(filtered)
  }, [clients, searchTerm])

  const loadData = async () => {
    setLoading(true)
    try {
      const [clientsResult, countsResult] = await Promise.all([getClients(), getClientProductCounts()])

      setClients(clientsResult)
      setProductCounts(countsResult)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageProducts = (clientId: string, clientName: string) => {
    setSelectedClient({ id: clientId, name: clientName })
    setProductsModalOpen(true)
  }

  const handleAssignmentChange = () => {
    // Reload product counts when assignments change
    getClientProductCounts().then(setProductCounts)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-2">Loading clients...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <p className="text-gray-600 mt-2">Manage your clients and their product assignments</p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search clients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Showing {filteredClients.length} filtered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients with Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(productCounts).length}</div>
            <p className="text-xs text-muted-foreground">Have assigned products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(productCounts).reduce((sum, count) => sum + count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Product assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {client.email}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{productCounts[client.id] || 0} products</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {client.phone && (
                <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {client.phone}
                </p>
              )}

              {client.address && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{client.address}</p>}

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">
                  Created: {new Date(client.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{productCounts[client.id] || 0} assigned</span>
                </div>
              </div>

              <Button className="w-full" onClick={() => handleManageProducts(client.id, client.name)}>
                Manage Products
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-600">
              {searchTerm ? "Try adjusting your search terms." : "No clients have been added yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Client Products Modal */}
      {selectedClient && (
        <ClientProductsModal
          isOpen={productsModalOpen}
          onClose={() => {
            setProductsModalOpen(false)
            setSelectedClient(null)
          }}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          onAssignmentChange={handleAssignmentChange}
        />
      )}
    </div>
  )
}
