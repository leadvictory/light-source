"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { Navbar } from "./navbar"
import { AdminNavbar } from "./admin/admin-navbar"
import { ClientNavbar } from "./client/client-navbar"
import { Footer } from "./footer"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isAdminRoute = pathname?.startsWith("/admin")
  const isClientRoute = pathname?.startsWith("/client")
  const isAuthRoute = pathname?.startsWith("/auth")

  // Don't show navbar/footer on auth pages
  if (isAuthRoute) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col">
      {isAdminRoute ? <AdminNavbar /> : isClientRoute ? <ClientNavbar /> : <Navbar />}

      <main className="flex-1">{children}</main>

      {!isAdminRoute && !isClientRoute && <Footer />}
    </div>
  )
}
