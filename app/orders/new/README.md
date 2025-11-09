# Order Intake Page

The **Order Intake Workspace** is the entry point for creating new orders in the Fleet Management System. This page triggers the entire order lifecycle.

## Route

```
/orders/new
```

**Full URL:**
```
http://localhost:3000/orders/new
```

## Features

### ✅ Dark Professional Theme
- **Ultra-dark background**: `#0B1020` (even darker than orders list)
- **Input fields**: `#141C2F` with `#1E2638` borders
- **Professional control center aesthetic** matching the screenshots
- Clean, functional form layout

### ✅ Form Fields

1. **Customer** (required) - Customer name or company
2. **Origin** (required) - Pickup location (city, state, or full address)
3. **Destination** (required) - Delivery location
4. **Pickup Window Start** (required) - Date/time picker
5. **Pickup Window End** (required) - Date/time picker
6. **Delivery Window Start** (required) - Date/time picker
7. **Delivery Window End** (required) - Date/time picker
8. **Required Equipment** (optional) - Equipment type (dry van, reefer, flatbed, etc.)
9. **Notes / Instructions** (optional) - Special handling, shipper notes, appointments
10. **Source** (dropdown) - Manual, API, Email, Portal, EDI

### ✅ Validation
- Real-time field validation
- Red border + error message for invalid fields
- Prevents submission until all required fields are filled
- Error messages clear when user starts typing

### ✅ Actions

**Run rule check** 
- Button with sparkle icon (🤖)
- Validates form before running business rules
- Shows success alert when qualified

**Draft follow-up email**
- Placeholder for email generation feature

**Submit order**
- Primary action button (green `#24D67B`)
- Validates all required fields
- Shows loading spinner during submission
- Success toast notification
- Auto-redirects to orders list after 1.5s

### ✅ Navigation
- Back arrow button (top-left) → returns to `/orders`
- "Launch Booking Console" button (top-right) - placeholder for advanced features

## User Flow

1. User clicks **"Create New Order"** from `/orders` page
2. Lands on `/orders/new` intake form
3. Fills out required fields (customer, origin, destination, windows)
4. Optionally runs **"Run rule check"** to validate
5. Clicks **"Submit order"**
6. Success toast appears
7. Auto-redirected to `/orders` list to see the new order

## Integration Points

### Current (Mock)
- Form submission simulated with 1s timeout
- Success toast + redirect to orders list

### Future (Real Implementation)
```typescript
const handleSubmit = async () => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  
  if (response.ok) {
    const newOrder = await response.json();
    router.push(`/orders?highlight=${newOrder.id}`);
  }
};
```

## Styling Details

### Colors
- Page background: `#0B1020`
- Input background: `#141C2F`
- Borders: `#1E2638` (normal), `#60A5FA` (focus), `#FF4D4D` (error)
- Text: `#E6EAF2` (primary), `#9AA4B2` (labels), `#6C7484` (placeholders)
- Submit button: `#24D67B` (green success)
- Rule check button: `#1E2638` with `#FFC857` sparkle icon

### Input States
```css
Default:  bg-[#141C2F] border-[#1E2638]
Focus:    ring-2 ring-[#60A5FA]/40 border-[#60A5FA]
Error:    border-[#FF4D4D]
```

### Typography
- Headers: 2xl (24px), semibold
- Labels: xs (12px), uppercase, tracking-wider
- Inputs: base (16px)
- Placeholders: `#6C7484`

## Accessibility

✅ **Labels** - All inputs have proper label elements
✅ **Focus rings** - Visible keyboard navigation
✅ **Error messages** - Icon + text for screen readers
✅ **Required fields** - Validated before submission
✅ **Keyboard navigation** - Tab through all fields

## Screenshots Reference

The page design matches the provided screenshots:
- **Dark midnight blue** background (`#0B1020`)
- **Muted gray** labels and text
- **Clean input fields** with subtle borders
- **Green submit button** for primary action
- **Professional spacing** - not cramped, not excessive

## Next Steps

1. **API Integration** - Connect to backend order creation endpoint
2. **AI Location Suggestions** - Auto-complete for origin/destination
3. **Cost Calculator** - Show estimated cost while filling form
4. **Driver Recommendations** - Suggest available drivers based on route
5. **Template System** - Save frequent customer/route combinations
6. **Bulk Import** - CSV/Excel upload for multiple orders
7. **Validation Rules** - Custom business rules (HOS, capacity, zones)

## File Location

```
app/orders/new/page.tsx
```

---

**The Order Intake page is now the trigger for the entire dispatch workflow!** 🚀
