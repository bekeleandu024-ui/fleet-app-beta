# Orders Management Page

Production-ready Orders Management page for the Fleet Management System, built with Next.js, React, TypeScript, and Tailwind CSS.

## Features Implemented

### ✅ Core Functionality
- **Comprehensive Filtering**: Search, status, type, profitability, and AI attention filters
- **Sortable Table**: Click column headers to sort by Order ID, Customer, Status, Margin %, or AI Risk
- **Real-time Results**: Shows filtered count dynamically
- **Order Detail Sheet**: Right-side drawer with 5 tabs (Overview, Costing, Driver & Unit, Tracking, Documents)
- **Professional Dark Theme**: Midnight blue control center aesthetic

### ✅ Visual Design
- **Color Palette**: 
  - Background: `#0B1020` (midnight)
  - Surface: `#121826`, `#141C2F`
  - Border: `#1E2638`
  - Text: `#E6EAF2` (primary), `#9AA4B2` (secondary), `#6C7484` (muted)
  - Success: `#24D67B`, Warning: `#FFC857`, Alert: `#FF8A00`, Danger: `#FF4D4D`
  - Accent: `#60A5FA`
- **Sharp Corners**: 6-8px border radius (no rounded-full)
- **Dense Layout**: Compact 44px table rows, 36-40px controls
- **Minimal Motion**: 100-150ms fade/scale transitions

### ✅ Data Features
- **9 Realistic Orders**: With varied lanes, margins, and AI risk scores
- **Color-Coded Badges**: 
  - Margin: Green (≥15%), Amber (5-15%), Red (<5%)
  - AI Risk: Green (0-30), Amber (31-70), Red (71-100)
  - Status: Pending, Assigned, In-Progress, Completed, Canceled
- **Cost Breakdown**: Fixed, Wage, Rolling, Accessorials
- **AI Insights**: Market rate suggestions, alternative drivers, risk reasons

## File Structure

```
app/orders/
├── page.tsx                          # Main page component
├── types.ts                          # TypeScript interfaces
├── mockData.ts                       # Sample order data
├── utils.ts                          # Color helpers, formatters
└── components/
    ├── FiltersBar.tsx                # Search and filter controls
    ├── OrdersTable.tsx               # Main data table
    └── OrderDetailSheet.tsx          # Right-side drawer with tabs
```

## Usage

1. **Navigate to the page**:
   ```
   http://localhost:3000/orders
   ```

2. **Filter Orders**:
   - Type in search box to find by ID, customer, or location
   - Select status, type, or profitability filters
   - Toggle "🤖 Needs Attention" to show high-risk orders (>60 risk score)

3. **Sort Data**:
   - Click any sortable column header (Order ID, Customer, Status, Margin %, AI Risk)
   - Click again to reverse sort direction

4. **View Details**:
   - Click any row to open the detail sheet
   - Navigate tabs: Overview, Costing, Driver & Unit, Tracking, Documents
   - Close with X button or click outside

5. **Actions** (UI ready, handlers to be implemented):
   - Create New Order
   - Bulk Import
   - Export CSV
   - AI Batch Optimizer

## Mock Data

The page includes 9 realistic orders:
- **CMIHK06U1**: Guelph → Chicago (475 mi, 24.4% margin, 18 risk) - In Progress
- **ORDT45K23**: Toronto → Detroit (236 mi, 20.5% margin, 32 risk) - Assigned
- **LDMN90P45**: Windsor → Columbus (312 mi, 4.2% margin, 67 risk) - Pending
- **GHTR12N67**: Mississauga → Buffalo (105 mi, 23.9% margin, 8 risk) - Completed
- **BKWP78Q91**: Hamilton → Pittsburgh (425 mi, -2.4% margin, 92 risk) - Pending (losing money!)
- Plus 4 more with varied characteristics

Only the first order (CMIHK06U1) has full detail data populated for the sheet tabs.

## Customization

### Add Real Data
Replace mock data in `mockData.ts` with API calls:
```typescript
// In page.tsx
const { data: orders } = await fetch('/api/orders');
```

### Add Actions
Implement handlers for header buttons:
```typescript
const handleCreateOrder = () => { /* open modal */ };
const handleBulkImport = () => { /* open file picker */ };
const handleExport = () => { /* generate CSV */ };
const handleAIOptimizer = () => { /* run batch optimization */ };
```

### Extend Filters
Add date range picker to `FiltersBar.tsx`:
```typescript
<DateRangePicker
  from={dateFrom}
  to={dateTo}
  onChange={(range) => setDateRange(range)}
/>
```

## Accessibility

- ✅ Keyboard navigation (all interactive elements focusable)
- ✅ ARIA labels on icon buttons
- ✅ Proper semantic HTML (table, button, input)
- ✅ High contrast text (WCAG AA compliant)
- ✅ Focus rings on keyboard navigation

## Performance

- Client-side filtering with `useMemo` for efficiency
- Only the selected order's details are loaded in the sheet
- Optimized re-renders with proper React keys

## Next Steps

1. **API Integration**: Replace mock data with real backend calls
2. **Action Handlers**: Implement create, import, export, optimize
3. **Status Multiselect**: Use a proper dropdown component (e.g., shadcn/ui Select)
4. **Date Range Picker**: Add date filtering capability
5. **Pagination**: Add for large datasets (100+ orders)
6. **WebSocket**: Real-time order status updates
7. **Permissions**: Role-based access control for actions

## Dependencies

All dependencies already in package.json:
- `next`: 16.0.1
- `react`: 19.2.0
- `lucide-react`: ^0.553.0 (icons)
- `tailwindcss`: ^4 (styling)
- `typescript`: ^5

No additional packages needed!

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

**Built with the dark, professional control center aesthetic — no bubbly UI, just crisp, functional logistics management.** 🚀
