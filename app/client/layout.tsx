import type React from "react"
import { ClientNavbar } from "@/components/client/client-navbar"
import { AuthGuard } from "@/components/auth-guard"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requiredRole="client">
      <div className="min-h-screen bg-gray-50">
        <ClientNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>
    </AuthGuard>
  )
}
