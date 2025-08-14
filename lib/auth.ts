import { supabase } from "./supabase"

export interface User {
  id: string
  email: string
  role: "Owner" | "SuperClient" | "Client" | "Tenant"
  client_id?: string
  first_name?: string
  last_name?: string
  client?: {
    id: string
    name: string
  }
}

export async function signIn(email: string, password: string): Promise<User | null> {
  try {
    // First, get the user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password_hash", password)
      .eq("is_active", true)
      .single()

    if (userError || !userData) {
      console.error("User authentication error:", userError)
      return null
    }

    // If user has a client_id, get the client info
    let clientData = null
    if (userData.client_id) {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id, name")
        .eq("id", userData.client_id)
        .single()

      if (!clientError && client) {
        clientData = client
      }
    }

    // Update last login
    await supabase
      .from("users")
      .update({
        last_login: new Date().toISOString(),
      })
      .eq("id", userData.id)

    return {
      id: userData.id,
      email: userData.email,
      role: userData.role as "Owner" | "SuperClient" | "Client" | "Tenant",
      client_id: userData.client_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      client: clientData ?? undefined,
    }
  } catch (error) {
    console.error("Sign in error:", error)
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  // This would typically check a session/token
  // For now, we'll use localStorage (not secure, just for demo)
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem("currentUser")
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export async function signOut(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("currentUser")
  }
}

export function setCurrentUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("currentUser", JSON.stringify(user))
  }
}
