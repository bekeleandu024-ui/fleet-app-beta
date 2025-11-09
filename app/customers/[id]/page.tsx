"use client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { customers } from "../mockData";
import { ProfileTab } from "./components/ProfileTab";
import { OrdersTab } from "./components/OrdersTab";
import { AnalyticsTab } from "./components/AnalyticsTab";
import { PricingTab } from "./components/PricingTab";
import { DocumentsTab } from "./components/DocumentsTab";
import { ChevronLeft, Mail, Phone } from "lucide-react";

interface PageProps {
  params: {
    id: string;
  };
}

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

export default function CustomerDetailPage({ params }: PageProps) {
  const customer = customers.find(c => c.id === params.id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Link href="/customers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Back to Customers
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
              <Badge className={statusColors[customer.status]}>
                {statusLabels[customer.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {customer.contactEmail}
              </div>
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {customer.contactPhone}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">Edit Customer</Button>
            <Button>Create Order</Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Orders</div>
            <div className="text-2xl font-semibold mt-1">{customer.totalOrdersLifetime.toLocaleString()}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Active Orders</div>
            <div className="text-2xl font-semibold mt-1">{customer.activeOrders}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Revenue (YTD)</div>
            <div className="text-2xl font-semibold mt-1">${(customer.totalRevenueYTD / 1000).toFixed(0)}k</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Avg Margin</div>
            <div className={`text-2xl font-semibold mt-1 ${
              customer.averageMarginPct >= 15 ? 'text-emerald-600' :
              customer.averageMarginPct >= 5 ? 'text-amber-600' :
              'text-red-600'
            }`}>
              {customer.averageMarginPct.toFixed(1)}%
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">AI Score</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-2xl font-semibold">{customer.aiScore}</div>
              <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
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
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab customerId={params.id} />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <OrdersTab customerId={params.id} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsTab customerId={params.id} />
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <PricingTab customerId={params.id} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab customerId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
