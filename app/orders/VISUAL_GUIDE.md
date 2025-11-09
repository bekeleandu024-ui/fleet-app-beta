# Orders Page - Visual Guide

## Page Components Overview

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER BAR (Sticky)                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Orders              [Actions: Import│Export│AI│+ New] │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  FILTERS BAR                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [🔍 Search...] [Status▾] [Type▾] [Profit▾] [🤖 AI]  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  ORDERS TABLE                                                │
│  ┏━━━━━━━┯━━━━━━━━━━┯━━━━━┯━━━━━━━━━━┯━━━━━━━━━━━━━┓ │
│  ┃ ID    │ Customer │Type │  Route   │   Windows   ┃ │
│  ┣━━━━━━━┿━━━━━━━━━━┿━━━━━┿━━━━━━━━━━┿━━━━━━━━━━━━━┫ │
│  ┃ CMIHK │ Walmart  │ 🚚  │ GUE→CHI  │ P: Nov 9... ┃ │
│  ┃ ORDT4 │ Target   │ 🔄  │ TOR→DET  │ D: Nov 10.. ┃ │
│  ┗━━━━━━━┷━━━━━━━━━━┷━━━━━┷━━━━━━━━━━┷━━━━━━━━━━━━━┛ │
└─────────────────────────────────────────────────────────────┘
                                          ┌──────────────────┐
                                          │  DETAIL SHEET   │
                                          │  (Right Drawer)  │
                                          │                  │
                                          │ [Tabs: Overview] │
                                          │        Costing   │
                                          │        Driver    │
                                          │        Tracking  │
                                          │        Documents │
                                          │                  │
                                          │  [Content...]    │
                                          └──────────────────┘
```

## Color System

### Background Layers
```
Level 0 (Page):     #0B1020  ███  Deepest midnight
Level 1 (Cards):    #121826  ███  Primary surface
Level 2 (Nested):   #141C2F  ███  Secondary surface
```

### Borders & Dividers
```
All borders:        #1E2638  ─── Subtle stroke
```

### Text Hierarchy
```
Primary:    #E6EAF2  ABC  Main content
Secondary:  #9AA4B2  ABC  Supporting text
Muted:      #6C7484  ABC  Hints, placeholders
```

### Semantic Colors
```
Success:    #24D67B  ███  Healthy, profitable, good
Warning:    #FFC857  ███  Caution, medium risk
Alert:      #FF8A00  ███  Needs attention
Danger:     #FF4D4D  ███  Critical, losing money
Accent:     #60A5FA  ███  Interactive, primary CTA
```

## Badge Examples

### Margin Badges
```
┌───────────┐  ≥15% margin (profitable)
│  24.4%   ││  Green: #24D67B
└───────────┘

┌───────────┐  5-15% margin (break-even)
│  10.8%   ││  Amber: #FFC857
└───────────┘

┌───────────┐  <5% margin (losing)
│  -2.4%   ││  Red: #FF4D4D
└───────────┘
```

### AI Risk Pills
```
┌─────┐  0-30 (low risk)
│ 18 ││  Green badge
└─────┘

┌─────┐  31-70 (medium risk)
│ 67 ││  Amber badge
└─────┘

┌─────┐  71-100 (high risk)
│ 92 ││  Red badge + tooltip with reason
└─────┘
```

### Status Badges
```
Pending      [Gray]   #9AA4B2
Assigned     [Blue]   #60A5FA
In Progress  [Cyan]   #22D3EE
Completed    [Green]  #24D67B
Canceled     [Red]    #FF4D4D
```

## Table Column Breakdown

| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| Order ID | 120px | ✅ | Monospace code, clickable |
| Customer | 160px | ✅ | Company name |
| Type | 60px | ❌ | Icon only (📦 🚚 🔄) |
| Route | 280px | ❌ | Origin → Destination |
| Windows | 140px | ❌ | Pickup & Delivery times (2 lines) |
| Status | 120px | ✅ | Color badge |
| Driver | 180px | ❌ | Avatar + name, or "—" |
| Cost | 100px | ❌ | USD formatted |
| Revenue | 100px | ❌ | USD formatted |
| Margin % | 90px | ✅ | Color-coded badge |
| AI Risk | 80px | ✅ | 0-100 pill with tooltip |
| Actions | 60px | ❌ | Kebab menu (⋮) |

## Detail Sheet Tabs

### 1. Overview
- Key order details (customer, route, distance)
- Timeline with status dots
- Special instructions alert card

### 2. Costing
- Cost breakdown (4 line items + total)
- Revenue & margin calculation
- 🤖 AI market rate insight card

### 3. Driver & Unit
- Current driver card (avatar, HOS)
- Assigned unit details
- 🤖 Alternative driver recommendations with cost deltas

### 4. Tracking
- Event history timeline
- Live location (map placeholder)
- Exception alerts

### 5. Documents
- List of uploaded files (BOL, Rate Confirmation, POD, Invoice)
- View/Download actions
- Upload button (dashed border)

## Interaction States

### Buttons
```
Default:   bg-[#121826] border-[#1E2638]
Hover:     border-[#60A5FA]/40 text-[#E6EAF2]
Focus:     ring-2 ring-[#60A5FA]/40
Primary:   bg-[#60A5FA] text-white
```

### Table Rows
```
Default:   border-b border-[#1E2638]
Hover:     bg-[#141C2F] (subtle highlight)
Click:     Opens detail sheet
```

### Inputs
```
Default:   bg-[#0B1020] border-[#1E2638]
Focus:     ring-2 ring-[#60A5FA]/40 border-[#60A5FA]
```

## Typography

- **Font Family**: System default (Arial, Helvetica, sans-serif)
- **Monospace**: Order IDs, currency values
- **Weights**: Regular (400), Medium (500), Semibold (600)
- **Sizes**: 
  - Headers: 2xl (24px), lg (18px)
  - Body: sm (14px), xs (12px)

## Spacing & Density

- **Table row height**: 44px (compact)
- **Control height**: 36-40px
- **Panel padding**: 16px (p-4)
- **Gap between sections**: 16px (space-y-4)
- **Border radius**: 6-8px (md, lg) — NO rounded-full!

## Accessibility Features

✅ **Keyboard Navigation**
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close sheet

✅ **Screen Readers**
- Proper semantic HTML (table, th, td)
- ARIA labels on icon-only buttons
- Tooltips for AI risk reasons

✅ **Color Contrast**
- All text meets WCAG AA standards
- Focus rings visible on all controls

---

**Design Principle**: Professional, dense, functional — like a mission control center, not a consumer app. 🎯
