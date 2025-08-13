"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#14224c] border-b border-[#14224c] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img src="/light-source-logo-white.png" alt="Light Source" className="h-8 w-auto" />
          </div>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button className="bg-white text-[#14224c] hover:bg-gray-100 font-semibold px-6 py-2">
                Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-white text-[#14224c] hover:bg-gray-100 font-semibold px-6 py-2">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex items-center justify-center h-[calc(100vh-64px)]">
        {/* Optionally, you can keep the login button here as well, but since it's in the header, it's not needed below */}
      </main>
    </div>
  )
}
