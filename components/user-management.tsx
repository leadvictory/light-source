import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building, Users, MapPin, Crown } from "lucide-react"

export function UserHierarchy() {
  const userHierarchy = {
    owner: {
      name: "Randy",
      role: "Owner",
      permissions: ["Full Access", "User Management", "Product Assignment", "All Buildings"],
      icon: Crown,
    },
    superCustomers: [
      {
        name: "Paramount Group",
        role: "Super Customer",
        buildings: ["Empire State Building", "Chrysler Building", "One World Trade"],
        tenants: 45,
        permissions: ["Multiple Buildings", "Tenant Management", "Floor Assignment"],
        icon: Building,
      },
    ],
    customers: [
      {
        name: "ABC Corporation",
        role: "Customer",
        building: "ABC Tower",
        floors: ["15th Floor", "16th Floor", "17th Floor"],
        tenants: 8,
        permissions: ["Single Building", "Floor Management", "Tenant Assignment"],
        icon: Building,
      },
    ],
    tenants: [
      {
        name: "Tech Startup Inc",
        role: "Tenant",
        building: "ABC Tower",
        floor: "15th Floor",
        permissions: ["Own Floor Orders", "Assigned Products Only"],
        icon: MapPin,
      },
      {
        name: "Law Firm LLC",
        role: "Tenant",
        building: "Empire State Building",
        floor: "42nd Floor",
        permissions: ["Own Floor Orders", "Assigned Products Only"],
        icon: MapPin,
      },
    ],
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">User Hierarchy & Permissions</h2>

      {/* Owner */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            <span>Owner Level</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{userHierarchy.owner.name}</h3>
              <p className="text-gray-600">{userHierarchy.owner.role}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {userHierarchy.owner.permissions.map((permission) => (
                <Badge key={permission} className="bg-yellow-100 text-yellow-800">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Super Customers */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-blue-600" />
            <span>Super Customer Level</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {userHierarchy.superCustomers.map((customer, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{customer.name}</h3>
                  <p className="text-gray-600">
                    {customer.buildings.length} Buildings • {customer.tenants} Tenants
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Manage
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {customer.permissions.map((permission) => (
                  <Badge key={permission} variant="outline" className="text-blue-700 border-blue-300">
                    {permission}
                  </Badge>
                ))}
              </div>
              <div className="text-sm text-gray-600">Buildings: {customer.buildings.join(", ")}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Customers */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-green-600" />
            <span>Customer Level</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {userHierarchy.customers.map((customer, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{customer.name}</h3>
                  <p className="text-gray-600">
                    {customer.building} • {customer.floors.length} Floors • {customer.tenants} Tenants
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Manage
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {customer.permissions.map((permission) => (
                  <Badge key={permission} variant="outline" className="text-green-700 border-green-300">
                    {permission}
                  </Badge>
                ))}
              </div>
              <div className="text-sm text-gray-600">Floors: {customer.floors.join(", ")}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tenants */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span>Tenant Level</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {userHierarchy.tenants.map((tenant, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{tenant.name}</h3>
                  <p className="text-gray-600">
                    {tenant.building} • {tenant.floor}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  View Orders
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tenant.permissions.map((permission) => (
                  <Badge key={permission} variant="outline" className="text-purple-700 border-purple-300">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
