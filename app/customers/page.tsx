"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { customers } from "./mockData";
import { Plus, Search } from "lucide-react";

const statusColors = {
  active: 'bg-blue-500',
  inactive: 'bg-gray-500',
  'high-value': 'bg-emerald-500',
};

const statusLabels = {
  active: 'Active',
  inactive: 'Inactive',
  'high-value': 'High Value',
};

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage customer relationships, orders, and analytics</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </header>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by customer or contact name..."
                className="w-full h-10 pl-9 pr-4 rounded-md border bg-background text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm">Filters</Button>
            <Button variant="outline" size="sm">Export</Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium py-3 px-2">Customer Name</th>
                  <th className="text-left font-medium py-3 px-2">Contact Info</th>
                  <th className="text-right font-medium py-3 px-2">Total Orders</th>
                  <th className="text-right font-medium py-3 px-2">Active Orders</th>
                  <th className="text-right font-medium py-3 px-2">Revenue (YTD)</th>
                  <th className="text-right font-medium py-3 px-2">Avg Margin %</th>
                  <th className="text-left font-medium py-3 px-2">Payment Terms</th>
                  <th className="text-left font-medium py-3 px-2">Status</th>
                  <th className="text-right font-medium py-3 px-2">AI Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2">
                      <Link href={`/customers/${customer.id}`} className="font-medium text-blue-600 hover:underline">
                        {customer.name}
                      </Link>
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-sm">
                        <div className="font-medium">{customer.contactName}</div>
                        <div className="text-muted-foreground text-xs">{customer.contactEmail}</div>
                        <div className="text-muted-foreground text-xs">{customer.contactPhone}</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">{customer.totalOrdersLifetime.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right">
                      {customer.activeOrders > 0 ? (
                        <Badge variant="outline" className="font-semibold">{customer.activeOrders}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-medium">
                      ${(customer.totalRevenueYTD / 1000).toFixed(0)}k
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={`font-semibold ${
                        customer.averageMarginPct >= 15 ? 'text-emerald-600' :
                        customer.averageMarginPct >= 5 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {customer.averageMarginPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">{customer.paymentTerms}</td>
                    <td className="py-3 px-2">
                      <Badge className={statusColors[customer.status]}>
                        {statusLabels[customer.status]}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-semibold">{customer.aiScore}</span>
                        <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              customer.aiScore >= 80 ? 'bg-emerald-500' :
                              customer.aiScore >= 60 ? 'bg-blue-500' :
                              'bg-amber-500'
                            }`}
                            style={{ width: `${customer.aiScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
