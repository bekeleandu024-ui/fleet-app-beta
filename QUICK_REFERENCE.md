# 🎯 Enterprise Dashboard - Quick Reference

## 🚀 Running the Application
```bash
npm run dev
```
**URL:** http://localhost:3000

---

## 📐 Layout Structure
```
┌─────────────────────────────────────────┐
│    [Left Nav] [Top Bar: Global Controls]│
├──────┬──────────────────────────┬───────┤
│      │ Breadcrumb + Page Header │Action │
│ NAV  ├──────────────────────────┤Center │
│      │ Global Filters (chips)   │(Right │
│ 7    ├──────────────────────────┤Rail)  │
│      │ KPI Tiles (6 across)     │       │
│ Mods ├──────────────────────────┤Optim. │
│      │ Exceptions Table         │       │
│      │ (Sortable, bulk actions) │Insights│
│      ├──────────────────────────┤       │
│      │ Trend Charts (2 cols)    │Grouped│
│      │ - Revenue vs Target      │by     │
│      │ - On-time Trend          │Severity│
└──────┴──────────────────────────┴───────┘
```

---

## 🎨 Design Tokens

### Colors (Status-Driven)
```typescript
Breach:  #DC2626 (Red)   - True incidents
Risk:    #EA580C (Orange) - At risk
Watch:   #EAB308 (Yellow) - Monitoring
Info:    #3B82F6 (Blue)   - Informational
Good:    #16A34A (Green)  - On track
```

### Typography
```
Body:     16px (text-base)
H1:       24px (text-2xl)
H2:       14px (text-sm)
Caption:  12px (text-xs)
```

### Spacing
```
Grid:    12 columns
Gap:     24px (gap-6)
Padding: 16px (p-4)
```

---

## 🧩 Key Components

### Layout
- `LeftNavigationRail` - Collapsible sidebar
- `TopBar` - Global search, date, theme, notifications
- `PageHeader` - Breadcrumb + title + last updated
- `GlobalFilters` - Active filter chips
- `SlideOver` - Detail panel (Escape to close)

### Dashboard
- `EnterpriseKPITiles` - 6 tiles with sparklines
- `ExceptionsTable` - Sortable with bulk actions
- `ActionCenter` - Right rail insights

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+K` | Global search |
| `Tab` | Navigate focusable elements |
| `Enter` | Activate selected item |
| `Escape` | Close slide-over/modals |
| `↑↓` | Navigate lists |
| `Space` | Select checkboxes |

---

## 📊 KPI Tiles (6 Total)

1. **Active Trips** - Current trips with WoW delta
2. **On-time %** - Delivery performance vs target
3. **Available Drivers** - Resource availability
4. **Utilization** - Fleet efficiency percentage
5. **Today's Revenue** - vs Target with variance
6. **Exceptions** - Active issues count

Each tile:
- ✅ Sparkline (trend)
- ✅ Target chip
- ✅ Delta (WoW/DoD)
- ✅ Click to drill down

---

## 📋 Exceptions Table Columns

| Column | Description | Sortable |
|--------|-------------|----------|
| Order/Trip | ID (clickable) | ✓ |
| Issue | Clear description | ✓ |
| Severity | Breach/Risk/Watch badge | ✓ |
| ETA Impact | +25m, --, etc. | ✓ |
| Owner | Responsible person | ✓ |
| SLA | Time remaining | ✓ |
| Action | Kebab menu | - |

Features:
- Bulk selection (checkboxes)
- Bulk actions (Assign, Snooze, Export)
- Zebra striping
- Row click → Slide-over

---

## 🎯 Action Center (Right Rail)

**Optimization Insights** grouped by severity:

### Breach (Red)
High urgency, immediate action required

### Risk (Orange)
Needs attention soon

### Watch (Yellow)
Monitor closely

### Info (Blue)
Informational, nice to know

**Each insight shows:**
- Title + Confidence badge (High/Med/Low)
- Description (outcome-focused)
- Impact (cost/time with exact value)
- Primary CTA button (single verb)
- Chevron → Slide-over details

**Footer:**
- Total insights count
- Estimated savings

---

## 🖱️ Interactions

### Click KPI Tile
→ Drill down to detailed report

### Click Exception Row
→ Slide-over with full context

### Click Insight CTA
→ Execute action (Reassign, Apply fix)

### Click Chevron (›)
→ Slide-over with:
  - Context
  - Impact analysis
  - Recommendation
  - "Why this?" explanation
  - Audit log link

### Select Multiple Rows
→ Bulk action buttons appear

---

## 🔄 Global Filters

**Available Filters:**
- Date Range (Today, This Week, etc.)
- Region (Ontario, Quebec, BC, Alberta)
- Customer (Acme Corp, etc.)
- Lane (Toronto-Chicago, etc.)
- Equipment (Dry Van, Reefer, Flatbed)

**Active Filters Display:**
```
[Region: Ontario ✕] [Customer: Acme Corp ✕]
[Clear all]
```

---

## 🌓 Theme Switcher

Click sun/moon icon in top bar:
1. **Light** ☀️ (Default)
2. **Dark** 🌙
3. **High Contrast** 🖥️
4. **Print** (auto-applied when printing)

---

## 🖨️ Print View

**Ctrl+P or Cmd+P** for executive reports

**Auto-Hides:**
- Navigation
- Sidebars
- Buttons
- Interactive elements

**Auto-Shows:**
- Page headers/footers
- Page numbers
- Black & white with high contrast
- Proper page breaks

---

## 📱 Responsive Breakpoints

| Screen | Layout |
|--------|--------|
| Desktop (1920px+) | Full 3-column |
| Laptop (1280px) | 3-column, tighter |
| Tablet (768px) | 2-column, rail → sheet |
| Mobile (320px) | Single column |

---

## 🎭 Microcopy Style Guide

### ❌ Don't
- "Driver John may exceed HOS"
- "Click here"
- "AI suggests..."
- "More info"

### ✅ Do
- "HOS risk in 2h (Trip #1234). Impact: ETA +25m."
- "Reassign"
- "Optimization available..."
- "Review variance"

**Rule:** Clear, specific, actionable outcomes

---

## 🔐 Enterprise Features

| Feature | Location |
|---------|----------|
| Environment Badge | Top bar (left) |
| Tenant Name | Top bar (left) |
| Role Display | Top bar (right, user menu) |
| Data Freshness | Bottom of main content |
| Audit Log | Slide-over footer |
| RBAC Structure | Ready for implementation |

---

## 📦 File Structure

```
app/
├── components/
│   ├── layout/
│   │   ├── LeftNavigationRail.tsx
│   │   ├── TopBar.tsx
│   │   ├── PageHeader.tsx
│   │   ├── GlobalFilters.tsx
│   │   └── SlideOver.tsx
│   └── dashboard/
│       ├── EnterpriseKPITiles.tsx
│       ├── ExceptionsTable.tsx
│       └── ActionCenter.tsx
├── lib/
│   └── theme-config.ts
├── styles/
│   └── print.css
└── page.tsx (main dashboard)
```

---

## 🎯 Production Checklist

- ✅ Enterprise design system
- ✅ WCAG AA accessibility
- ✅ Keyboard navigation
- ✅ Print stylesheets
- ✅ Theme support
- ✅ Responsive design
- ✅ Clear microcopy
- ✅ RBAC structure
- ✅ Audit trail hooks
- ✅ No TypeScript errors
- ✅ Optimized performance

**Status: Production Ready** 🚀

---

## 📖 Full Documentation

- `README.ENTERPRISE.md` - Complete feature guide
- `TRANSFORMATION_COMPLETE.md` - Implementation checklist
- `BEFORE_AFTER.md` - Visual transformation guide

---

**Need Help?**
All components are documented with TypeScript types and inline comments.
Check component files for prop interfaces and usage examples.
