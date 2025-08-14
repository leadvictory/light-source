"use client"

import { useEffect, useState } from "react"
import { ChevronDown, Bell, Plus, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase, type Company, mockCompanies } from "@/lib/supabase"
import Link from "next/link"
import { ClientEditModal } from "@/components/client-edit-modal"

export default function ClientsPage() {
  const [clients, setClients] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("recent")
  const [useSupabase, setUseSupabase] = useState(true)
  const [selectedClient, setSelectedClient] = useState<Company | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [sortBy, useSupabase])

  const fetchClients = async () => {
    try {
      setLoading(true)

      if (!useSupabase) {
        // Use mock data
        const sortedClients = [...mockCompanies]
        if (sortBy === "name") {
          sortedClients.sort((a, b) => a.name.localeCompare(b.name))
        } else if (sortBy === "oldest") {
          sortedClients.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        } else {
          sortedClients.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        }
        setClients(sortedClients)
        return
      }

      // Try to fetch from Supabase
      const { data: companies, error } = await supabase
        .from("companies")
        .select(`
          *,
          admin_user:users!companies_admin_user_id_fkey(
            id,
            name,
            email,
            phone
          ),
          buildings(id),
          orders(id),
          product_assignments(id)
        `)
        .order(sortBy === "recent" ? "updated_at" : sortBy === "oldest" ? "created_at" : "name", {
          ascending: sortBy === "name",
        })

      if (error) {
        console.warn("Supabase error, falling back to mock data:", error)
        setUseSupabase(false)
        return
      }

      // Transform data to include counts
      const transformedClients =
        companies?.map((company) => ({
          ...company,
          _count: {
            buildings: company.buildings?.length || 0,
            orders: company.orders?.length || 0,
            product_assignments: company.product_assignments?.length || 0,
          },
        })) || []

      setClients(transformedClients)
    } catch (error) {
      console.warn("Error fetching clients, using mock data:", error)
      setUseSupabase(false)
      setClients(mockCompanies)
    } finally {
      setLoading(false)
    }
  }

  const toggleClientVisibility = async (clientId: string, isVisible: boolean) => {
    try {
      if (useSupabase) {
        const { error } = await supabase.from("companies").update({ is_visible: isVisible }).eq("id", clientId)

        if (error) {
          console.warn("Supabase error:", error)
          setUseSupabase(false)
        }
      }

      // Update local state regardless
      setClients((prev) =>
        prev.map((client) => (client.id === clientId ? { ...client, is_visible: isVisible } : client)),
      )
    } catch (error) {
      console.error("Error updating client visibility:", error)
    }
  }

  const getClientStats = (client: Company) => {
    const buildingText = client._count?.buildings === 1 ? "office" : "offices"
    const orderText = client._count?.orders === 1 ? "order" : "orders"

    return `${client._count?.buildings || 0} ${buildingText} • ${client._count?.orders || 0} ${orderText} • ${client._count?.product_assignments || 0} products assigned`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    })
  }

  const handleSaveClient = (updatedClient: Company) => {
    setClients((prev) => prev.map((client) => (client.id === updatedClient.id ? updatedClient : client)))
    // In a real app, you would also update the backend here
    console.log("Client updated:", updatedClient)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading clients...</div>
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
          <Link href="/products" className="py-4 text-gray-600 hover:text-gray-900 flex items-center space-x-2">
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
        <div className="bg-white rounded-lg shadow">
          {/* Header Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Clients ({clients.length})</h1>
              <div className="flex items-center space-x-4">
                <Button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Plus className="w-4 h-4 mr-2" />
                  New Client
                </Button>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 bg-blue-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Client List */}
          <div className="divide-y divide-gray-200">
            {clients.map((client, index) => (
              <Link
                href={`/clients/${client.id}`}
                key={client.id}
                className={`block p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !client.is_visible ? "opacity-60 bg-red-50" : ""
                }`}
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Rest of the existing client row content remains the same */}
                  {/* Left Section - Logo and Info (4 columns) */}
                  <div className="col-span-4 flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={client.logo_url || "/placeholder.svg"} alt={client.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                        {client.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate flex items-center">
                        {client.name}
                        {!client.is_visible && (
                          <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            ACCESS DISABLED
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">{getClientStats(client)}</p>
                    </div>
                  </div>

                  {/* Center Section - Visibility Toggle (2 columns) */}
                  <div className="col-span-2 flex flex-col items-center justify-center">
                    <Switch
                      checked={client.is_visible}
                      onCheckedChange={(checked) => {
                        // Prevent navigation when clicking the switch
                        event?.preventDefault()
                        event?.stopPropagation()
                        toggleClientVisibility(client.id, checked)
                      }}
                      className="data-[state=checked]:bg-orange-500 mb-1"
                    />
                    <span className="text-xs text-gray-500">Access</span>
                  </div>

                  {/* Right Section - Admin Info (4 columns) */}
                  <div className="col-span-4 flex items-center justify-between">
                    <div className="flex-1 text-left">
                      <div className="text-lg font-medium text-gray-900 mb-1">
                        {client.admin_user?.name || "no admin"}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <button
                          className="text-blue-600 hover:text-blue-800 underline"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setSelectedClient(client)
                            setIsEditModalOpen(true)
                          }}
                        >
                          EDIT
                        </button>
                        {client.admin_user?.phone && (
                          <>
                            <span>•</span>
                            <span>{client.admin_user.phone}</span>
                          </>
                        )}
                        {client.admin_user?.email && (
                          <>
                            <span>•</span>
                            <button
                              className="text-blue-600 hover:text-blue-800 underline"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                window.location.href = `mailto:${client.admin_user?.email}`
                              }}
                            >
                              email {client.admin_user.name?.split(" ")[0]}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Date and Arrow (2 columns) */}
                    <div className="col-span-2 flex items-center justify-end space-x-4">
                      <span className="text-sm text-gray-500">{formatDate(client.updated_at)}</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        {selectedClient && (
          <ClientEditModal
            client={selectedClient}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedClient(null)
            }}
            onSave={handleSaveClient}
          />
        )}
      </main>
    </div>
  )
}
