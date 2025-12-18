# Order ID Quick Reference

## 🎯 Quick Rules

1. **Database `id` column** → Always UUID
2. **URLs and Routes** → Always UUID  
3. **Display to Users** → Show Friendly ID (`order_number` or `reference`)
4. **API Responses** → Return UUID as `id`, Friendly ID as `reference`

---

## 📋 Common Scenarios

### Creating a New Order

```typescript
// ✅ CORRECT: Generate UUID upfront
const orderId = randomUUID();
const order = await createOrder({ id: orderId, ...data });

// ❌ WRONG: Let backend generate ID
const order = await createOrder({ ...data }); // May return friendly ID
```

---

### Navigating to Order Detail

```typescript
// ✅ CORRECT: Use order.id (UUID)
router.push(`/orders/${order.id}`);

// ❌ WRONG: Use friendly ID
router.push(`/orders/${order.reference}`); // Works but not preferred
```

---

### Displaying Order ID to User

```tsx
// ✅ CORRECT: Show friendly ID
<h1>Order {order.reference || order.orderNumber}</h1>
<p className="text-sm text-gray-500">ID: {order.id}</p>

// ❌ WRONG: Show UUID to user
<h1>Order {order.id}</h1> // Too long and not user-friendly
```

---

### Calling Backend Services

```typescript
// ✅ CORRECT: Always use UUID
const data = await fetch(`/api/orders/${order.id}`);

// ❌ WRONG: Use friendly ID (unless specifically supported)
const data = await fetch(`/api/orders/${order.reference}`);
```

---

## 🔍 Debugging

### Check if ID is UUID

```typescript
function isUUID(id: string): boolean {
  return id.length === 36 && id.includes('-');
}

// Alternative: Use regex
function isUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
```

### Resolve Friendly ID to UUID

```typescript
async function resolveOrderId(id: string): Promise<string> {
  if (isUUID(id)) return id;
  
  const result = await db.query(
    'SELECT id FROM orders WHERE order_number = $1 OR reference = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new Error(`Order not found: ${id}`);
  }
  
  return result.rows[0].id;
}
```

---

## 🚨 Common Issues

### Issue: "Order not found" Error

**Cause:** Passing friendly ID where UUID is required

**Solution:**
```typescript
// Add legacy ID resolution
let orderId = id;
if (!isUUID(id)) {
  orderId = await resolveOrderId(id);
}
```

---

### Issue: Orders Missing from List

**Cause:** Orders have friendly IDs as primary key

**Solution:**
```typescript
// Filter out non-UUID orders
const validOrders = orders.filter(o => isUUID(o.id));
```

---

### Issue: Backend Returns Friendly ID

**Cause:** Backend service not updated

**Solution:**
```typescript
// Force UUID in response
if (!isUUID(order.id)) {
  order.id = generatedUUID; // Use the UUID you sent
  order.order_number = order.id; // Save friendly ID separately
}
```

---

## 📊 Data Flow

```
User Input
    ↓
Frontend (Display: Friendly ID)
    ↓
Router (/orders/[UUID])
    ↓
API Handler (Resolves: Friendly ID → UUID if needed)
    ↓
Database Query (WHERE id = UUID)
    ↓
Backend Service (Uses: UUID)
    ↓
Response (id: UUID, reference: Friendly ID)
    ↓
Frontend Display (Show: Friendly ID)
```

---

## 🔗 Related Files

- **Order Creation:** `app/api/admin/orders/route.ts`
- **Order Detail:** `app/api/orders/[id]/route.ts`
- **Order List:** `app/api/orders/route.ts`
- **Frontend List:** `app/orders/page.tsx`
- **Frontend Detail:** `app/orders/[id]/page.tsx`
- **Booking:** `app/book/page.tsx`

---

## ✅ Verification Checklist

Before deploying changes:

- [ ] New orders created with UUID as `id`
- [ ] Order detail page accepts both UUID and friendly ID
- [ ] Order list only shows UUID-based orders
- [ ] All navigation links use `order.id` (UUID)
- [ ] User sees friendly ID in the UI
- [ ] Backend services receive UUID
- [ ] Logs show resolution events (if any)

---

## 📞 Need Help?

Check the logs for these prefixes:
- `[Admin Orders]` - Order creation issues
- `[Orders List]` - List filtering issues  
- `[Order Detail]` - ID resolution issues

See `UUID_TRANSITION_COMPLETE.md` for full documentation.
