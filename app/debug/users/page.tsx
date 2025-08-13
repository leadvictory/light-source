"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Database } from "lucide-react"

export default function DebugUsersPage() {
  const [users, setUsers] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [tablesExist, setTablesExist] = useState({
    users: false,
    clients: false,
  })
  const [setupStatus, setSetupStatus] = useState("")

  useEffect(() => {
    checkTablesAndLoadData()
  }, [])

  const checkTablesAndLoadData = async () => {
    try {
      // Check if tables exist by trying to query them
      const [usersResult, clientsResult] = await Promise.allSettled([
        supabase.from("users").select("count", { count: "exact", head: true }),
        supabase.from("clients").select("count", { count: "exact", head: true }),
      ])

      const tablesStatus = {
        users: usersResult.status === "fulfilled",
        clients: clientsResult.status === "fulfilled",
      }

      setTablesExist(tablesStatus)

      // If tables exist, load data
      if (tablesStatus.users) {
        const { data: usersData, error: usersError } = await supabase.from("users").select("*").order("created_at")
        if (!usersError) {
          setUsers(usersData || [])
        }
      }

      if (tablesStatus.clients) {
        const { data: clientsData, error: clientsError } = await supabase.from("clients").select("*").order("name")
        if (!clientsError) {
          setClients(clientsData || [])
        }
      }
    } catch (error) {
      console.error("Failed to check tables:", error)
    } finally {
      setLoading(false)
    }
  }

  const createTestUser = async () => {
    try {
      setSetupStatus("Creating Randy's account...")

      if (!tablesExist.users) {
        setSetupStatus("Error: Users table doesn't exist. Please run database setup first.")
        return
      }

      // Check if Randy already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("email", "randy@lightsource.com")
        .single()

      if (existingUser) {
        setSetupStatus("Randy's account already exists!")
        return
      }

      // Create Randy
      const { error } = await supabase.from("users").insert([
        {
          email: "randy@lightsource.com",
          password_hash: "demo123",
          role: "owner",
          first_name: "Randy",
          last_name: "Owner",
          client_id: null,
          is_active: true,
        },
      ])

      if (error) {
        console.error("Error creating Randy:", error)
        setSetupStatus(`Error creating Randy: ${error.message}`)
      } else {
        setSetupStatus("Randy's account created successfully!")
        checkTablesAndLoadData()
      }
    } catch (error) {
      console.error("Failed to create test user:", error)
      setSetupStatus(`Failed to create test user: ${error.message}`)
    }
  }

  const createClientUser = async () => {
    try {
      setSetupStatus("Creating Paramount user...")

      if (!tablesExist.users || !tablesExist.clients) {
        setSetupStatus("Error: Required tables don't exist. Please run database setup first.")
        return
      }

      // Find Paramount client
      const paramountClient = clients.find((c: any) => c.name.toLowerCase().includes("paramount"))

      if (!paramountClient) {
        setSetupStatus("Paramount client not found! Please ensure clients are created first.")
        return
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("email", "paramount@company.com")
        .single()

      if (existingUser) {
        setSetupStatus("Paramount user already exists!")
        return
      }

      // Create client user
      const { error } = await supabase.from("users").insert([
        {
          email: "paramount@company.com",
          password_hash: "demo123",
          role: "client",
          first_name: "Steve",
          last_name: "Jackson",
          client_id: paramountClient.id,
          is_active: true,
        },
      ])

      if (error) {
        console.error("Error creating client user:", error)
        setSetupStatus(`Error creating client user: ${error.message}`)
      } else {
        setSetupStatus("Paramount user created successfully!")
        checkTablesAndLoadData()
      }
    } catch (error) {
      console.error("Failed to create client user:", error)
      setSetupStatus(`Failed to create client user: ${error.message}`)
    }
  }

  if (loading) {
    return <div className="p-8">Loading database information...</div>
  }

  const getUserClient = (user: any) => {
    if (!user.client_id) return null
    return clients.find((c: any) => c.id === user.client_id)
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Database Setup & Debug</h1>
        <div className="space-x-2">
          <Button onClick={createTestUser} variant="outline" disabled={!tablesExist.users}>
            Create Randy Account
          </Button>
          <Button onClick={createClientUser} variant="outline" disabled={!tablesExist.users || !tablesExist.clients}>
            Create Paramount Account
          </Button>
        </div>
      </div>

      {/* Setup Status */}
      {setupStatus && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm">{setupStatus}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              {tablesExist.users ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Users table: {tablesExist.users ? "Exists" : "Missing"}</span>
            </div>
            <div className="flex items-center space-x-2">
              {tablesExist.clients ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">Clients table: {tablesExist.clients ? "Exists" : "Missing"}</span>
            </div>
          </div>

          {(!tablesExist.users || !tablesExist.clients) && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Setup Required:</strong> Some database tables are missing. Please run the database setup scripts
                in the following order:
              </p>
              <ol className="mt-2 text-sm text-yellow-700 list-decimal list-inside">
                <li>scripts/00-setup-database.sql</li>
                <li>scripts/01-seed-initial-data.sql</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Users */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Users ({users.length})</h2>
          <div className="space-y-4">
            {users.map((user: any) => {
              const client = getUserClient(user)
              return (
                <Card key={user.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {user.first_name} {user.last_name} ({user.role})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <strong>Email:</strong> {user.email}
                      </div>
                      <div>
                        <strong>Password:</strong> {user.password_hash}
                      </div>
                      <div>
                        <strong>Role:</strong> {user.role}
                      </div>
                      <div>
                        <strong>Active:</strong> {user.is_active ? "Yes" : "No"}
                      </div>
                      <div>
                        <strong>Client:</strong> {client?.name || "N/A"}
                      </div>
                      <div>
                        <strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {users.length === 0 && tablesExist.users && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No users found in database</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Clients */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Clients ({clients.length})</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {clients.slice(0, 10).map((client: any) => (
              <Card key={client.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <div>
                      <strong>Offices:</strong> {client.offices || 0}
                    </div>
                    <div>
                      <strong>Visible:</strong> {client.visible ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>Created:</strong> {new Date(client.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {clients.length > 10 && (
            <p className="text-sm text-gray-500 mt-2">Showing first 10 of {clients.length} clients</p>
          )}

          {clients.length === 0 && tablesExist.clients && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No clients found in database</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
