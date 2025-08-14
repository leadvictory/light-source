"use client";

import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import Header from "@/components/header";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase, type Order } from "@/lib/supabase";
import Link from "next/link";
import Nav from "@/components/navbar";

export default function OrdersPage() {
  const [orders, setOrders] = useState<(Order & { company_name: string; user_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "client" | "oldest">("recent");
  const [userRole] = useState<"Owner" | "SuperClient" | "Client" | "Tenant">("Owner");
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, sortBy]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // base select with related names
      let query = supabase
        .from("orders")
        .select(
          `
          id, order_number, user_id, company_id, building_id, status, total_amount, notes, created_at, updated_at,
          user:users ( id, name, first_name, last_name ),
          company:companies ( id, name )
        `
        );

      // search on order_number (fast, server-side).
      // If you also want to search company/user names, do it client-side after fetch or add text search on a materialized view.
      if (searchTerm.trim()) {
        query = query.or(`order_number.ilike.%${searchTerm}%`);
      }

      // sorting
      if (sortBy === "client") {
        query = query.order("name", { foreignTable: "companies", ascending: true }).order("updated_at", { ascending: false });
      } else if (sortBy === "oldest") {
        query = query.order("updated_at", { ascending: true });
      } else {
        query = query.order("updated_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      const transformed =
        data?.map((o: any) => ({
          ...o,
          company_name: o.company?.name ?? "Unknown",
          user_name:
            o.user?.name ||
            [o.user?.first_name, o.user?.last_name].filter(Boolean).join(" ") ||
            "Unknown",
        })) ?? [];

      // optional extra filtering on user/company names (client-side) to match your old behavior
      const final = searchTerm.trim()
        ? transformed.filter(
            (o) =>
              o.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              o.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              o.order_number.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : transformed;

      setOrders(final);
    } catch (e) {
      console.error("Failed to fetch orders from Supabase:", e);
      setOrders([]); // no fallback
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: "In Arrears", className: "bg-orange-500 text-white" },
      PROCESSING: { label: "In Process", className: "bg-blue-900 text-white" },
      COMPLETED: { label: "Invoiced", className: "bg-purple-600 text-white" },
      CANCELLED: { label: "Cancelled", className: "bg-red-500 text-white" },
    } as const;

    const config = (statusConfig as any)[status] || { label: status, className: "bg-gray-500 text-white" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" });
  };

  const groupOrdersByCompany = (data: (Order & { company_name: string; user_name: string })[]) =>
    data.reduce((acc, o) => {
      (acc[o.company_name] ||= []).push(o);
      return acc;
    }, {} as Record<string, (Order & { company_name: string; user_name: string })[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading orders...</div>
      </div>
    );
  }

  const grouped = userRole === "Owner" ? groupOrdersByCompany(orders) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userRole={userRole} userName={userRole === "Owner" ? "RANDY" : "Paramount"} onLogout={handleLogout} />

      <Nav userRole={userRole} />

      <main className="p-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Orders ({orders.length})</h1>
              <div className="flex items-center space-x-4">
                <Button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Plus className="w-4 h-4 mr-2" />
                  New Order
                </Button>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-40 bg-blue-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">MOST RECENT</SelectItem>
                    <SelectItem value="client">CLIENT A-Z</SelectItem>
                    <SelectItem value="oldest">OLDEST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search orders by number, client, or user..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-4">
            {grouped
              ? Object.entries(grouped).map(([companyName, companyOrders]) => (
                  <div key={companyName}>
                    <div className="px-6 py-4 bg-gray-100">
                      <h2 className="text-lg font-bold text-gray-900">{companyName}</h2>
                    </div>
                    {companyOrders.map((order) => (
                      <Link
                        href={`/orders/${order.id}`}
                        key={order.id}
                        className="block px-6 py-4 hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg mb-2 mx-4 cursor-pointer hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            <div className="text-sm text-gray-600 w-16">{formatDate(order.created_at)}</div>
                            <div className="flex-1">
                              <div className="text-lg font-semibold text-gray-900 mb-1">{order.order_number}</div>
                              <div className="text-sm text-gray-600">
                                {order.building_id ? "50 Beale Street" : "7thFloor- One Market Plaza"}
                              </div>
                              <div className="text-sm text-gray-600">{companyName}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Ordered by {order.user_name}</div>
                              <div className="text-sm text-blue-600 underline">{order.user_name}@paramountgroup.com</div>
                            </div>
                            <div className="flex flex-col items-center space-y-2">{getStatusBadge(order.status)}</div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-600 bg-blue-50"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("Duplicate order:", order.order_number);
                              }}
                            >
                              Duplicate order
                            </Button>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ))
              : orders.map((order) => (
                  <Link
                    href={`/orders/${order.id}`}
                    key={order.id}
                    className="block px-6 py-4 hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg mb-2 mx-4 cursor-pointer hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="text-sm text-gray-600 w-16">{formatDate(order.created_at)}</div>
                        <div className="flex-1">
                          <div className="text-lg font-semibold text-gray-900 mb-1">{order.order_number}</div>
                          <div className="text-sm text-gray-600">
                            {order.building_id ? "50 Beale Street" : "7thFloor- One Market Plaza"}
                          </div>
                          <div className="text-sm text-gray-600">{order.company_name}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Ordered by {order.user_name}</div>
                          <div className="text-sm text-blue-600 underline">{order.user_name}@paramountgroup.com</div>
                        </div>
                        <div className="flex flex-col items-center space-y-2">{getStatusBadge(order.status)}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-600 bg-blue-50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("Duplicate order:", order.order_number);
                          }}
                        >
                          Duplicate order
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </main>
    </div>
  );
}
