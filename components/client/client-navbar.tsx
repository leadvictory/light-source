"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Package, Building, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut, getCurrentUser } from "@/lib/auth"
import { useEffect, useState } from "react"

export function ClientNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    }
    loadUser()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push("/auth/login")
  }

  const navItems = [
    {
      href: "/client",
      label: "Dashboard",
      icon: Building,
      active: pathname === "/client",
    },
    {
      href: "/client/products",
      label: "Products",
      icon: Package,
      active: pathname === "/client/products",
    },
    {
      href: "/client/orders",
      label: "Orders",
      icon: ShoppingCart,
      active: pathname === "/client/orders",
    },
    {
      href: "/client/profile",
      label: "Profile",
      icon: LogOut,
      active: pathname === "/client/profile",
    },
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/client" className="flex items-center space-x-2">
              <img src="/images/light-source-logo-2025.png" alt="Light Source" className="h-8 w-auto" />
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={item.active ? "default" : "ghost"}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2",
                    item.active && "bg-slate-800 text-white hover:bg-slate-700",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <div className="font-medium text-gray-700">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-gray-500 text-xs">{user?.client?.name}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
