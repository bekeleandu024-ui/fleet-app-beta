# FleetOps Enterprise Dashboard

## 🎯 Enterprise-Grade ERP-Style Interface

A modern, professional fleet management dashboard built with Next.js, TypeScript, and Tailwind CSS. Designed with enterprise best practices for density, accessibility, and executive-friendly reporting.

---

## ✨ Key Enterprise Features

### **Visual Design & Theming**
- **Neutral enterprise palette** with single brand accent (blue)
- **Color-coded severity** system: Red (breach), Orange (risk), Yellow (watch), Blue (info), Green (good)
- **Minimal shadows** with subtle 1px borders for flat, crisp ERP aesthetic
- **Consistent typography**: 16px body, 24px section titles, 14px card titles, 12px captions
- **12-column grid layout** with 24px (gap-6) spacing
- **Theme support**: Light, Dark, High-Contrast, and Print modes

### **Information Architecture**

#### Left Navigation Rail
- Collapsible sidebar with module groups:
  - **Operations**: Dashboard, Orders
  - **Dispatch**: Dispatch Board, Driver Assignment
  - **Tracking**: Live Tracking, Fleet Status
  - **Finance**: Costing, Pricing, Invoicing
  - **Safety**: HOS Compliance, Incidents
  - **Analytics**: Reports, Insights
  - **Admin**: Settings, Users
- Badge indicators for pending items
- Keyboard-accessible navigation

#### Top Bar (Global Controls)
- **Environment badge** (PROD/UAT) with tenant name
- **Global search** with keyboard shortcut (Ctrl+K)
- **Date range picker** with presets and custom range
- **Theme switcher** (light/dark/high-contrast)
- **Notifications** with unread indicator
- **User menu** with role display

#### Breadcrumb & Page Header
- Clear navigation path (e.g., "Operations › Dashboard")
- Page title with descriptive subtitle
- **Last updated** timestamp for data freshness

#### Right Rail - Action Center
- **Persistent panel** for Optimization Insights
- Insights grouped by severity (Breach, Risk, Watch, Info)
- Each insight shows:
  - Impact (cost/time with exact values)
  - Confidence level (High/Med/Low) with tooltip percentage
  - Single primary CTA (Reassign, Apply fix, Review variance)
  - Chevron for slide-over details
- Footer with total insights and estimated savings

---

## 📊 Dashboard Layout

### **Top: KPI Band (Executive-Friendly)**
6 compact tiles with:
- **Active Trips** - Total trips with WoW/DoD delta
- **On-time %** - Delivery performance with target chip
- **Available Drivers** - Resource availability
- **Utilization** - Fleet efficiency percentage
- **Today's Revenue** - vs Target with variance
- **Exceptions** - Active issues count

Each tile includes:
- Tiny sparkline showing trend
- Target as chip ("Target: $30k")
- Colored delta indicator (green/red)
- Proper numeric formatting with separators

### **Main Area (Left 8-9 cols)**

#### 1. Exceptions at a Glance Table
Sortable, zebra-striped table with:
- Order/Trip ID (clickable)
- Issue description (clear, actionable)
- Severity badge (Breach/Risk/Watch)
- ETA Impact (+25m, --, etc.)
- Owner (responsible person)
- SLA with color-coding (breach/warning/good)
- Action menu (kebab)

Features:
- Bulk selection with checkboxes
- Bulk actions (Assign, Snooze, Export)
- Frozen left columns for scrolling
- Row click opens slide-over

#### 2. Trend Charts
- Revenue vs Target (MTD)
- On-time Delivery Trend
- Minimal gridlines, unit-aware axes
- Tooltips with exact values + delta vs prior period

### **Right Rail (3-4 cols)**
- Action Center (see above)
- Persistent scroll
- Sticky positioning

---

## 🎨 Design System

### **Color Palette**

**Neutral (Greys):**
- 50-900 scale for backgrounds, borders, text

**Brand (Blue):**
- Primary accent for interactive elements
- Used sparingly for focus and emphasis

**Status Colors:**
- Red (#DC2626): Breach - true incidents
- Orange (#EA580C): Risk - at risk situations
- Yellow (#EAB308): Watch - monitoring required
- Blue (#3B82F6): Info - informational
- Green (#16A34A): Good - on track

### **Typography**
- Body: 16px (text-base)
- Section titles: 24px (text-2xl)
- Card titles: 14px (text-sm)
- Captions: 12px (text-xs)
- Font: Geist Sans (primary), Geist Mono (code)

### **Spacing & Density**
- Grid: 12-column layout
- Gap: 24px (gap-6)
- Card padding: 16px (p-4)
- Tight vertical rhythm for data density

### **Borders & Shadows**
- Borders: 1px solid, neutral-200
- Dividers: 1px, neutral-200
- Minimal shadows (only on hover for cards)
- Flat, crisp aesthetic

---

## 🔧 Components Reference

### **Layout Components**
- `LeftNavigationRail` - Collapsible sidebar with module groups
- `TopBar` - Global search, date picker, theme switcher, notifications
- `PageHeader` - Breadcrumb + title + description + last updated
- `GlobalFilters` - Filter chips (Date, Region, Customer, Lane, Equipment)
- `SlideOver` - Reusable panel for details, audit trail, actions

### **Dashboard Components**
- `EnterpriseKPITiles` - 6 KPI tiles with sparklines and deltas
- `ExceptionsTable` - Sortable table with bulk actions
- `ActionCenter` - Right rail with optimization insights

### **Theme & Config**
- `theme-config.ts` - Color palette, typography, spacing constants

---

## 🎯 Enterprise Features

### **Microcopy & Naming (Trust Signals)**
- ❌ Vague: "Driver John may exceed HOS in 2h"
- ✅ Clear: "HOS risk in 2h (Trip #1234). Predicted 14m over. Impact: ETA +25m. Next best action: reassign to Driver Sarah."

### **Button Labels (Single Verbs)**
- "Reassign" (not "Reassign Driver")
- "Apply fix" (not "Apply This Optimization")
- "Review variance" (not "Review Cost Variance")
- Secondary actions in kebab menu

### **Data Presentation**
- Currency: `$24,580` (with separators)
- Percentages: `94.2%` (one decimal)
- Time zones: Explicitly shown when relevant
- Targets: Shown as chips below values
- Variance: Colored delta (↑ +8.4% WoW)

### **Renamed Terminology**
- ❌ "AI Health Score" → ✅ "Ops Reliability Index"
- ❌ "AI Insights" → ✅ "Optimization Insights"
- Confidence: Low/Med/High with % in tooltip (not in row title)

---

## ♿ Accessibility & Responsiveness

### **Accessibility**
- Keyboard-first navigation (Tab, Enter, Escape)
- Focus states on all interactive elements
- ARIA labels for screen readers
- Semantic HTML headings (h1, h2, h3)
- High-contrast mode support
- Proper form labels and error messages

### **Responsive Behavior**
- **Desktop**: Full layout with left nav, top bar, main content, right rail
- **Tablet**: KPI tiles collapse to 2-3 columns, right rail becomes bottom sheet
- **Mobile**: Single column, hamburger nav, bottom sheet for Action Center

### **Print View**
- Hides nav, sidebars, buttons, footer
- Black and white with high contrast
- Page breaks for sections
- Headers/footers with page numbers
- Tables optimized for print
- Executive-friendly formatting

---

## 🔐 Governance & Enterprise Polish

### **RBAC-Aware Views**
- Role-based rendering (Dispatcher, Ops Manager, Finance, Exec)
- Different KPIs and actions based on permissions
- Audit log access in slide-over

### **Environment & Tenant**
- Environment badge (PROD/UAT/DEV) in top bar
- Tenant name displayed prominently
- White-label options (logo, accent color)

### **Data Freshness**
- "Telemetry updated 1m ago" shown at bottom
- "Last updated 2m ago" in page header
- Live update indicators (green pulse dot)

### **Audit Trail**
- Every action links to audit log
- "View audit log" button in slide-over footer
- Timestamp and user for all changes

---

## 🚀 Quick Wins Implemented

✅ Converted to left nav + right action rail  
✅ Added breadcrumb + global date filter  
✅ Replaced map with Exceptions table on dashboard  
✅ Restyled KPI tiles with sparklines, targets, deltas  
✅ Unified typography and borders (flat, crisp)  
✅ Grouped Insights by severity with single primary CTA  
✅ Added slide-over details with context and recommendations  
✅ Renamed "AI Health Score"/"AI Insights" to clearer terms  
✅ Tightened copy for clarity and outcomes  
✅ Added print stylesheet for executive reports  

---

## 📦 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Charts**: Recharts
- **Utilities**: clsx for conditional classes

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

## 📝 Next Steps

### **Integration**
- [ ] Connect to backend APIs (orders, dispatch, tracking services)
- [ ] Implement real WebSocket for live updates
- [ ] Add authentication and RBAC middleware
- [ ] Connect to optimization engine for AI insights

### **Charts & Visualizations**
- [ ] Implement Revenue vs Target chart with Recharts
- [ ] Add On-time Delivery trend visualization
- [ ] Create utilization heatmap by region
- [ ] Add mini spark map for fleet locations

### **Workflows**
- [ ] Drill-down flows when clicking KPIs
- [ ] Exception detail slide-over with full context
- [ ] Bulk action confirmations with modals
- [ ] Export functionality for tables and reports

### **Advanced Features**
- [ ] Natural language search
- [ ] Advanced filtering with saved views
- [ ] Customizable dashboard layouts
- [ ] Real-time notifications system
- [ ] Mobile native apps (React Native)

---

## 📄 License

Proprietary - FleetOps Enterprise

---

## 🤝 Support

For enterprise support, contact: support@fleetops.com

---

**Built with ❤️ for enterprise fleet operations**
