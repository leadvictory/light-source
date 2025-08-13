"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut } from "lucide-react"
import { signOut } from "@/lib/auth"
import { useRouter } from "next/navigation"

export function AdminNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <nav className="bg-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/admin" className="flex-shrink-0 flex items-center">
              <Image
                src="/images/light-source-logo-2025.png"
                alt="Light Source"
                width={48}
                height={48}
                className="h-12 w-auto"
              />
              <span className="ml-2 text-xl font-bold text-white">Light Source Admin</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/admin" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/admin/products" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium">
              Products
            </Link>
            <Link href="/admin/clients" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium">
              Clients
            </Link>
            <Link href="/admin/orders" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium">
              Orders
            </Link>
            <Link href="/admin/import" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium">
              Import
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="text-white border-white hover:bg-white hover:text-slate-800 bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-slate-700"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-800 border-t border-slate-700">
            <Link
              href="/admin"
              className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-slate-700"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/products"
              className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-slate-700"
              onClick={() => setIsOpen(false)}
            >
              Products
            </Link>
            <Link
              href="/admin/clients"
              className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-slate-700"
              onClick={() => setIsOpen(false)}
            >
              Clients
            </Link>
            <Link
              href="/admin/orders"
              className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-slate-700"
              onClick={() => setIsOpen(false)}
            >
              Orders
            </Link>
            <Link
              href="/admin/import"
              className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-slate-700"
              onClick={() => setIsOpen(false)}
            >
              Import
            </Link>
            <div className="px-3 py-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="w-full text-white border-white hover:bg-white hover:text-slate-800 bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
