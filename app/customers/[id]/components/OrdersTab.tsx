"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCustomerOrders, getFavoriteLanes } from "../../mockData";
import { Plus } from "lucide-react";

interface OrdersTabProps {
  customerId: string;
}

const statusColors = {
  completed: 'bg-emerald-500',
  'in-progress': 'bg-blue-500',
  pending: 'bg-amber-500',
  cancelled: 'bg-gray-500',
};

export function OrdersTab({ customerId }: OrdersTabProps) {
  const orders = getCustomerOrders(customerId);
  const favoriteLanes = getFavoriteLanes(customerId);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Order
        </Button>
        <Button variant="outline">View All Orders</Button>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium py-3 px-2">Order #</th>
                  <th className="text-left font-medium py-3 px-2">Date</th>
                  <th className="text-left font-medium py-3 px-2">Route</th>
                  <th className="text-left font-medium py-3 px-2">Status</th>
                  <th className="text-right font-medium py-3 px-2">Revenue</th>
                  <th className="text-right font-medium py-3 px-2">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 font-medium">{order.orderNumber}</td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-sm">
                        {order.origin} → {order.destination}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Badge className={statusColors[order.status]}>
                        {order.status.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right font-medium">
                      ${order.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={`font-semibold ${
                        order.margin >= 15 ? 'text-emerald-600' :
                        order.margin >= 5 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {order.margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Favorite Lanes */}
      <Card>
        <CardHeader>
          <CardTitle>Favorite Lanes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {favoriteLanes.map((lane, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <div className="font-medium">{lane.origin} → {lane.destination}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {lane.orderCount} orders · Avg ${lane.avgRevenue.toLocaleString()} revenue
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Avg Margin</div>
                  <div className={`text-lg font-semibold ${
                    lane.avgMargin >= 15 ? 'text-emerald-600' :
                    lane.avgMargin >= 5 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {lane.avgMargin.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
