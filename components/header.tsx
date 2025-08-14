"use client"

import { useState } from "react"
import { Bell, ChevronDown } from "lucide-react"

interface HeaderProps {
  userRole: "Owner" | "SuperClient" | "Client" | "Tenant" | string
  userName: string
  onLogout: () => void
}

export default function Header({ userRole, userName, onLogout }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  return (
    <header className="bg-[#14224c] border-b border-[#14224c] px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <img src="/light-source-logo-white.png" alt="Light Source" className="h-8 w-auto" />
          </div>
        </div>
        <div className="flex items-center space-x-4 relative">
          <Bell className="w-5 h-5 text-white" />
          <div className="flex items-center space-x-2 cursor-pointer" onClick={toggleDropdown}>
            <div className="text-right">
              <div className="text-white font-medium">{userName}</div>
              <div className="text-xs text-gray-300">{userRole}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-white" />
          </div>
          {isDropdownOpen && (
            <button onClick={onLogout} className="absolute top-full right-0 bg-red-500 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded">
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
