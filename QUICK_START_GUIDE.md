# TMS Quick Start Guide
## Get Up and Running in 15 Minutes

This guide will help you quickly set up and test the ePOD System and Customer Portal.

---

## 🚀 QUICK SETUP (5 minutes)

### 1. Install Dependencies

```bash
cd c:\dev\fleet-app-beta

# Install required packages
npm install bcrypt jsonwebtoken react-dropzone

# Install TypeScript types
npm install --save-dev @types/bcrypt @types/jsonwebtoken
```

### 2. Configure Environment Variables

Create or update `.env.local`:

```env
# Database (already configured)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fleet

# JWT Secret (CHANGE THIS!)
JWT_SECRET=my-super-secret-jwt-key-for-customer-portal-2025

# File Storage (temporary - for testing)
UPLOAD_DIR=./public/uploads
```

### 3. Run Database Migrations

```bash
# Open PowerShell in project directory
cd c:\dev\fleet-app-beta

# Connect to PostgreSQL and run migrations
psql -U postgres -d fleet -f migrations/006_create_epod_tables.sql
psql -U postgres -d fleet -f migrations/007_create_customer_portal_tables.sql

# Add trigger to trips table
psql -U postgres -d fleet -c "CREATE TRIGGER trigger_create_pod_verification AFTER INSERT ON trips FOR EACH ROW EXECUTE FUNCTION create_pod_verification_record();"
```

### 4. Start the Development Server

```bash
npm run dev
```

Server running at: http://localhost:3000

---

## 🧪 TEST SCENARIOS

### Scenario 1: Create a Customer Portal User

```typescript
// File: test-customer-registration.ts
const registerCustomer = async () => {
  const response = await fetch('http://localhost:3000/api/portal/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'register',
      customerId: 'TEST-CUSTOMER-001',
      email: 'test@customer.com',
      password: 'TestPass123!',
      name: 'Test Customer User',
      role: 'admin',
    }),
  });

  const data = await response.json();
  console.log('Registration:', data);
};

registerCustomer();
```

**Run it:**
```bash
node -e "$(cat test-customer-registration.ts)"
```

Or use PowerShell:
```powershell
$body = @{
    action = "register"
    customerId = "TEST-CUSTOMER-001"
    email = "test@customer.com"
    password = "TestPass123!"
    name = "Test Customer User"
    role = "admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/portal/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Scenario 2: Login and Get Access Token

```powershell
$body = @{
    email = "test@customer.com"
    password = "TestPass123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/portal/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$token = $response.accessToken
Write-Host "Access Token: $token"

# Save token for later use
$token | Out-File -FilePath "customer-token.txt"
```

### Scenario 3: Upload a Document to a Trip

First, get a trip ID from your database:

```sql
SELECT id FROM trips LIMIT 1;
```

Then upload a document:

```powershell
$tripId = "your-trip-id-here"
$token = Get-Content "dispatcher-token.txt"  # Or driver token

$body = @{
    documentType = "POD"
    fileUrl = "https://example.com/documents/pod_sample.pdf"
    fileName = "POD_Sample.pdf"
    fileSize = 102400
    mimeType = "application/pdf"
    uploadedBy = "driver-uuid-here"
    uploadedByType = "driver"
    metadata = @{
        notes = "Delivered successfully"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/trips/$tripId/documents" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $token" } `
    -ContentType "application/json" `
    -Body $body
```

### Scenario 4: Capture a Signature

```powershell
$tripId = "your-trip-id-here"

# Simple base64 signature (in reality this would be from canvas)
$signatureData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

$body = @{
    signatureType = "delivery"
    signerName = "John Receiver"
    signerRole = "receiver"
    signerCompany = "Receiving Warehouse Inc"
    signatureData = $signatureData
    geolocation = @{
        lat = 43.6532
        lng = -79.3832
        accuracy = 10
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/trips/$tripId/signature" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Scenario 5: Get Complete POD Package

```powershell
$tripId = "your-trip-id-here"

$podPackage = Invoke-RestMethod -Uri "http://localhost:3000/api/trips/$tripId/pod" `
    -Method GET

$podPackage | ConvertTo-Json -Depth 5 | Write-Host
```

### Scenario 6: Verify and Approve POD

```powershell
$tripId = "your-trip-id-here"

$body = @{
    verificationStatus = "approved"
    verifiedBy = "dispatcher-uuid"
    verifiedByName = "Jane Dispatcher"
    notes = "All documents verified and approved"
    notifyCustomer = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/trips/$tripId/pod/verify" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Scenario 7: View Customer Orders

```powershell
$token = Get-Content "customer-token.txt"

$orders = Invoke-RestMethod -Uri "http://localhost:3000/api/portal/orders?status=In Transit&limit=10" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }

$orders | ConvertTo-Json -Depth 3 | Write-Host
```

### Scenario 8: Track an Order with Share Token

First, create a share token in the database:

```sql
INSERT INTO tracking_shares (order_id, share_token, expires_at, is_active)
VALUES ('your-order-id', 'demo-share-token-12345', NOW() + INTERVAL '7 days', true);
```

Then track the order:

```powershell
$orderId = "your-order-id"
$shareToken = "demo-share-token-12345"

$tracking = Invoke-RestMethod -Uri "http://localhost:3000/api/portal/orders/$orderId/tracking?token=$shareToken" `
    -Method GET

$tracking | ConvertTo-Json -Depth 4 | Write-Host
```

---

## 🎯 INTEGRATION EXAMPLES

### Example 1: React Component - Customer Login Form

```typescript
// File: app/portal/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function CustomerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/portal/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store tokens
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect to dashboard
        router.push("/portal/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6">Customer Portal Login</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

### Example 2: React Component - Customer Order List

```typescript
// File: app/portal/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/portal/login");
        return;
      }

      const response = await fetch("/api/portal/orders?limit=20", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      } else if (response.status === 401) {
        router.push("/portal/login");
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "New": "bg-blue-100 text-blue-800",
      "In Transit": "bg-yellow-100 text-yellow-800",
      "Delivered": "bg-green-100 text-green-800",
      "Exception": "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return <div className="p-8">Loading orders...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Order #</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Pickup</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Delivery</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Driver</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{order.order_number || order.id.slice(0, 8)}</td>
                <td className="px-6 py-4 text-sm">{order.pickup_location}</td>
                <td className="px-6 py-4 text-sm">{order.dropoff_location}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{order.driver_name || "-"}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => router.push(`/portal/orders/${order.id}/tracking`)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Track
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Example 3: React Component - Live Tracking Map

```typescript
// File: app/portal/orders/[orderId]/tracking/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function OrderTrackingPage() {
  const params = useParams();
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTracking();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadTracking, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTracking = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/portal/orders/${params.orderId}/tracking`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();
      if (data.success) {
        setTracking(data.tracking);
      }
    } catch (error) {
      console.error("Error loading tracking:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading tracking information...</div>;
  if (!tracking) return <div className="p-8">Order not found</div>;

  const { order, trip } = tracking;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Order Tracking</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Live Location</h2>
          <div className="bg-gray-100 rounded h-96 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 mb-2">Map Integration Needed</p>
              <p className="text-sm text-gray-500">
                Current Location: {trip?.currentLocation.lat}, {trip?.currentLocation.lng}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Last Update: {new Date(trip?.currentLocation.lastUpdate).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Order #</dt>
                <dd className="font-medium">{order.orderNumber || order.id.slice(0, 8)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium">{order.status}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Pickup</dt>
                <dd>{order.pickupLocation}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Delivery</dt>
                <dd>{order.dropoffLocation}</dd>
              </div>
            </dl>
          </div>

          {trip && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Trip Info</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Driver</dt>
                  <dd className="font-medium">{trip.driver}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Unit</dt>
                  <dd className="font-medium">{trip.unit}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">ETA</dt>
                  <dd className="font-medium">
                    {trip.timeline.estimatedDelivery 
                      ? new Date(trip.timeline.estimatedDelivery).toLocaleString()
                      : "TBD"}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 📋 VERIFICATION CHECKLIST

After setup, verify everything works:

- [ ] ✅ Database migrations ran successfully
- [ ] ✅ Can create a customer user
- [ ] ✅ Can login with customer credentials
- [ ] ✅ JWT token is returned
- [ ] ✅ Can upload document to a trip
- [ ] ✅ Can capture signature
- [ ] ✅ Can upload photos
- [ ] ✅ Can view complete POD package
- [ ] ✅ Can verify/approve POD
- [ ] ✅ Can view customer orders with token
- [ ] ✅ Can track order with share token

---

## 🐛 TROUBLESHOOTING

### Issue: "Table does not exist"
**Solution:** Run the migrations again:
```bash
psql -U postgres -d fleet -f migrations/006_create_epod_tables.sql
psql -U postgres -d fleet -f migrations/007_create_customer_portal_tables.sql
```

### Issue: "JWT_SECRET is not defined"
**Solution:** Add to `.env.local`:
```env
JWT_SECRET=your-secret-key-here
```

### Issue: "bcrypt not found"
**Solution:** Install dependencies:
```bash
npm install bcrypt jsonwebtoken
```

### Issue: "Unauthorized" error
**Solution:** Check token is being sent correctly:
```powershell
$token = Get-Content "customer-token.txt"
$headers = @{ Authorization = "Bearer $token" }
# Use $headers in your request
```

---

## 🎉 SUCCESS!

You now have a working ePOD System and Customer Portal!

**Next Steps:**
1. Customize the UI components
2. Add file upload to S3/R2
3. Integrate email/SMS notifications
4. Build the Driver Mobile App
5. Implement Invoicing System

**Need Help?** Check the main implementation guide: `TMS_IMPLEMENTATION_GUIDE.md`
