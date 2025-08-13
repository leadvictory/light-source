"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Bell, ArrowLeft, Plus, Edit, Trash2, MapPin, Package, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { supabase, mockCompanies } from "@/lib/supabase"
import Link from "next/link"
import { ClientEditModal } from "@/components/client-edit-modal"

// Mock data for client details
const mockClientDetails = {
  "1": {
    ...mockCompanies[0],
    buildings: [
      {
        id: "1",
        name: "Empire State Building",
        address: "350 5th Ave, New York, NY 10118",
        floors: [
          { id: "1", name: "42nd Floor", tenant_count: 3 },
          { id: "2", name: "43rd Floor", tenant_count: 2 },
          { id: "3", name: "44th Floor", tenant_count: 1 },
        ],
      },
      {
        id: "2",
        name: "One Market Plaza",
        address: "1 Market St, San Francisco, CA 94105",
        floors: [
          { id: "4", name: "7th Floor", tenant_count: 1 },
          { id: "5", name: "8th Floor", tenant_count: 2 },
        ],
      },
      {
        id: "3",
        name: "Chrysler Building",
        address: "405 Lexington Ave, New York, NY 10174",
        floors: [{ id: "6", name: "60th Floor", tenant_count: 1 }],
      },
    ],
    orders: [
      {
        id: "1",
        order_number: "PO: 50B-0972-AR",
        status: "PROCESSING",
        total_amount: 1175.06,
        created_at: "2024-03-24T00:00:00Z",
        building_name: "50 Beale Street",
      },
      {
        id: "2",
        order_number: "1234",
        status: "PENDING",
        total_amount: 2450.0,
        created_at: "2024-03-24T00:00:00Z",
        building_name: "One Market Plaza",
      },
      {
        id: "3",
        order_number: "A987612",
        status: "PROCESSING",
        total_amount: 890.5,
        created_at: "2024-03-23T00:00:00Z",
        building_name: "Empire State Building",
      },
      {
        id: "4",
        order_number: "PO 121212",
        status: "COMPLETED",
        total_amount: 1250.0,
        created_at: "2024-03-22T00:00:00Z",
        building_name: "One Market Plaza",
      },
    ],
    assignedProducts: [
      {
        id: "1",
        item_number: "JHBL 24000LM GL WD MVOLT GZ10 50K 80CRI HC3P DWH",
        name: "INTERMATIC Spring Wound Timer",
        manufacturer: "INTERMATIC",
        client_unit_price: 250.0,
        assigned_date: "2024-01-15T00:00:00Z",
      },
      {
        id: "2",
        item_number: "DVF-103P-WH",
        name: "Lutron Preset Dimmer",
        manufacturer: "Lutron",
        client_unit_price: 850.0,
        assigned_date: "2024-01-20T00:00:00Z",
      },
    ],
  },
  "4": {
    ...mockCompanies[3],
    buildings: [
      {
        id: "4",
        name: "50 Beale St",
        address: "50 Beale St, San Francisco, CA 94105",
        floors: [{ id: "7", name: "8th Floor", tenant_count: 1 }],
      },
    ],
    orders: [
      {
        id: "5",
        order_number: "BEALE-001",
        status: "COMPLETED",
        total_amount: 3200.0,
        created_at: "2024-03-20T00:00:00Z",
        building_name: "50 Beale St",
      },
    ],
    assignedProducts: [
      {
        id: "1",
        item_number: "JHBL 24000LM GL WD MVOLT GZ10 50K 80CRI HC3P DWH",
        name: "INTERMATIC Spring Wound Timer",
        manufacturer: "INTERMATIC",
        client_unit_price: 280.0,
        assigned_date: "2024-02-01T00:00:00Z",
      },
    ],
  },
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [useSupabase, setUseSupabase] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    fetchClientDetails()
  }, [params.id, useSupabase])

  const fetchClientDetails = async () => {
    try {
      setLoading(true)

      if (!useSupabase) {
        // Use mock data
        const mockClient = mockClientDetails[params.id as keyof typeof mockClientDetails] || mockClientDetails["1"]
        setClient(mockClient)
        return
      }

      // Try to fetch from Supabase
      const { data: company, error } = await supabase
        .from("companies")
        .select(`
          *,
          admin_user:users!companies_admin_user_id_fkey(*),
          buildings(*),
          orders(*),
          product_assignments(
            *,
            product:products(*)
          )
        `)
        .eq("id", params.id)
        .single()

      if (error) {
        console.warn("Supabase error, falling back to mock data:", error)
        setUseSupabase(false)
        return
      }

      setClient(company)
    } catch (error) {
      console.warn("Error fetching client details, using mock data:", error)
      setUseSupabase(false)
      setClient(mockClientDetails[params.id as keyof typeof mockClientDetails] || mockClientDetails["1"])
    } finally {
      setLoading(false)
    }
  }

  const toggleClientVisibility = async (isVisible: boolean) => {
    try {
      if (useSupabase) {
        const { error } = await supabase.from("companies").update({ is_visible: isVisible }).eq("id", params.id)

        if (error) {
          console.warn("Supabase error:", error)
          setUseSupabase(false)
        }
      }

      // Update local state
      setClient((prev: any) => ({ ...prev, is_visible: isVisible }))
    } catch (error) {
      console.error("Error updating client visibility:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: "In Arrears", className: "bg-orange-500 text-white" },
      PROCESSING: { label: "In Process", className: "bg-blue-900 text-white" },
      COMPLETED: { label: "Invoiced", className: "bg-purple-600 text-white" },
      CANCELLED: { label: "Cancelled", className: "bg-red-500 text-white" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-gray-500 text-white",
    }

    return <Badge className={config.className}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const handleSaveClient = (updatedClient: any) => {
    setClient(updatedClient)
    // In a real app, you would also update the backend here
    console.log("Client updated:", updatedClient)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading client details...</div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Client not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#14224c] border-b border-[#14224c] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <img src="/light-source-logo-white.png" alt="Light Source" className="h-8 w-auto" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {!useSupabase && <div className="text-xs text-orange-200 bg-orange-800 px-2 py-1 rounded">Demo Mode</div>}
            <Bell className="w-5 h-5 text-white" />
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="text-white font-medium">RANDY</div>
                <div className="text-xs text-gray-300">OWNER</div>
              </div>
              <ChevronDown className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          <Link href="/orders" className="py-4 text-gray-600 hover:text-gray-900 flex items-center space-x-2">
            <span>📦</span>
            <span>Orders</span>
          </Link>
          <Link href="/" className="py-4 text-gray-600 hover:text-gray-900 flex items-center space-x-2">
            <span>📋</span>
            <span>Products</span>
          </Link>
          <Link href="/clients" className="py-4 text-white bg-blue-900 px-4 rounded-t-lg flex items-center space-x-2">
            <span>👥</span>
            <span>Clients</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link href="/clients" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Link>

          {/* Client Header */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={client.logo_url || "/placeholder.svg"} alt={client.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-xl">
                      {client.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{client.name}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <Badge variant={client.type === "SUPERCUSTOMER" ? "default" : "secondary"}>{client.type}</Badge>
                      <span>•</span>
                      <span>Created {formatDate(client.created_at)}</span>
                      <span>•</span>
                      <span>Last updated {formatDate(client.updated_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={client.is_visible}
                      onCheckedChange={toggleClientVisibility}
                      className="data-[state=checked]:bg-orange-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600">Client Access</span>
                      <span className="text-xs text-gray-500">
                        {client.is_visible ? "Client can access system" : "Client access disabled"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="text-gray-700 bg-transparent"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Client
                  </Button>
                  <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Admin User Info */}
              {client.admin_user && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Admin Contact</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{client.admin_user.name}</div>
                      <div className="text-sm text-gray-600">{client.admin_user.email}</div>
                      {client.admin_user.phone && (
                        <div className="text-sm text-gray-600">{client.admin_user.phone}</div>
                      )}
                    </div>
                    <Button size="sm" variant="outline">
                      Contact Admin
                    </Button>
                  </div>
                  {client.is_visible ? (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                      ✓ Client can access their orders and place new orders
                    </div>
                  ) : (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                      ✗ Client access disabled - cannot view orders or place new orders
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Buildings</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{client.buildings?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {client.type === "SUPERCUSTOMER" ? "Multiple locations" : "Single location"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{client.orders?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(client.orders?.reduce((sum: number, order: any) => sum + order.total_amount, 0) || 0)}{" "}
                  total value
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{client.assignedProducts?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Products available for ordering</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Floors</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {client.buildings?.reduce((sum: number, building: any) => sum + (building.floors?.length || 0), 0) ||
                    0}
                </div>
                <p className="text-xs text-muted-foreground">Across all buildings</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="buildings">Buildings & Floors</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="products">Assigned Products</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {client.orders?.slice(0, 5).map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium">{order.order_number}</div>
                            <div className="text-sm text-gray-600">{order.building_name}</div>
                            <div className="text-xs text-gray-500">{formatDate(order.created_at)}</div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(order.status)}
                            <div className="text-sm font-medium mt-1">{formatCurrency(order.total_amount)}</div>
                          </div>
                        </div>
                      ))}
                      {(!client.orders || client.orders.length === 0) && (
                        <div className="text-center py-8 text-gray-500">No orders yet</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Buildings Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Buildings Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {client.buildings?.map((building: any) => (
                        <div key={building.id} className="p-3 border rounded">
                          <div className="font-medium">{building.name}</div>
                          <div className="text-sm text-gray-600">{building.address}</div>
                          <div className="text-xs text-gray-500 mt-1">{building.floors?.length || 0} floors</div>
                        </div>
                      ))}
                      {(!client.buildings || client.buildings.length === 0) && (
                        <div className="text-center py-8 text-gray-500">No buildings assigned</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="buildings" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Buildings & Floors</CardTitle>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Building
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {client.buildings?.map((building: any) => (
                      <div key={building.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{building.name}</h3>
                            <p className="text-gray-600">{building.address}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 bg-transparent">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {building.floors?.map((floor: any) => (
                            <div key={floor.id} className="p-3 bg-gray-50 rounded border">
                              <div className="font-medium">{floor.name}</div>
                              <div className="text-sm text-gray-600">
                                {floor.tenant_count} tenant{floor.tenant_count !== 1 ? "s" : ""}
                              </div>
                            </div>
                          ))}
                          <Button variant="outline" className="p-3 border-dashed bg-transparent">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Floor
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!client.buildings || client.buildings.length === 0) && (
                      <div className="text-center py-12 text-gray-500">
                        <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <div className="text-lg font-medium mb-2">No buildings yet</div>
                        <div className="text-sm">Add a building to get started</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Order History</CardTitle>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Order
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {client.orders?.map((order: any) => (
                      <Link
                        href={`/orders/${order.id}`}
                        key={order.id}
                        className="block p-4 border rounded hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-lg">{order.order_number}</div>
                            <div className="text-sm text-gray-600">{order.building_name}</div>
                            <div className="text-xs text-gray-500">{formatDate(order.created_at)}</div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(order.status)}
                            <div className="text-lg font-medium mt-1">{formatCurrency(order.total_amount)}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {(!client.orders || client.orders.length === 0) && (
                      <div className="text-center py-12 text-gray-500">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <div className="text-lg font-medium mb-2">No orders yet</div>
                        <div className="text-sm">Orders will appear here once placed</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Assigned Products</CardTitle>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Assign Products
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {client.assignedProducts?.map((product: any) => (
                      <div key={product.id} className="p-4 border rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{product.item_number}</div>
                            <div className="text-sm text-gray-600">{product.manufacturer}</div>
                            <div className="text-sm text-gray-600 line-clamp-2">{product.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-medium">{formatCurrency(product.client_unit_price)}</div>
                            <div className="text-xs text-gray-500">Assigned {formatDate(product.assigned_date)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!client.assignedProducts || client.assignedProducts.length === 0) && (
                      <div className="text-center py-12 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <div className="text-lg font-medium mb-2">No products assigned</div>
                        <div className="text-sm">Assign products to allow this client to place orders</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        {client && (
          <ClientEditModal
            client={client}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveClient}
          />
        )}
      </main>
    </div>
  )
}
