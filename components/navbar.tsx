"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavProps {
  userRole: "Owner" | "SuperClient" | "Client" | "Tenant";
}

export default function Nav({ userRole }: NavProps) {
  const pathname = usePathname();

  const links = [
    { href: "/orders", label: "📦 Orders", roles: ["Owner", "SuperClient", "Client", "Tenant"] },
    { href: "/products", label: "📋 Products", roles: ["Owner", "SuperClient", "Client"] },
    { href: "/clients", label: "👥 Clients", roles: ["Owner"] },
    { href: "/offices", label: "🏢 Offices", roles: ["SuperClient"] },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6">
      <div className="flex space-x-8">
        {links
          .filter((link) => link.roles.includes(userRole))
          .map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`py-4 px-4 rounded-t-lg flex items-center space-x-2 ${
                pathname === link.href
                  ? "text-white bg-blue-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>{link.label}</span>
            </Link>
          ))}
      </div>
    </nav>
  );
}
