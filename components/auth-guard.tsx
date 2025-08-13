"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/auth"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "owner" | "client"
  redirectTo?: string
}

export function AuthGuard({ children, requiredRole, redirectTo = "/auth/login" }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()

        if (!currentUser) {
          router.push(redirectTo)
          return
        }

        if (requiredRole && currentUser.role !== requiredRole) {
          // Redirect to appropriate dashboard based on role
          if (currentUser.role === "owner") {
            router.push("/admin")
          } else {
            router.push("/client")
          }
          return
        }

        setUser(currentUser)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push(redirectTo)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [requiredRole, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return <>{children}</>
}
