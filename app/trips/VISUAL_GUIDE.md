# Dispatch Board Visual Design Guide

**Ultra-dark control center aesthetic with intelligent color coding for operational clarity.**

## Layout Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ CONTROL PANEL (Fixed Top)                                                   │
│ [Date] [Driver Types: COM RNR O/O] [Region ▾] │ ◉ 23/45 (51%) │ ⚡ AI On  │
└──────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────────┐
│ KANBAN BOARD (Horizontal Scroll)                                             │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                         │
│ │UNA │ │ASG │ │ENR │ │PKP │ │TRN │ │DEL │ │COM │                         │
│ │SIG │ │NED │ │OUT │ │    │ │SIT │ │    │ │PLE │                         │
│ │NED │ │    │ │    │ │    │ │    │ │    │ │TED │                         │
│ │ 3  │ │ 2  │ │ 1  │ │ 2  │ │ 3  │ │ 1  │ │ 2  │                         │
│ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                         │
└──────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────────┐
│ DRIVER AVAILABILITY BAR (Fixed Bottom, Horizontal Scroll)                    │
│ [Mike][Sarah][Tom][Lisa][...14 total drivers with status indicators...]     │
└──────────────────────────────────────────────────────────────────────────────┘
┌─────────┐
│   AI    │ (Right Sidebar, Toggleable)
│ COPILOT │ 
│ SIDEBAR │ 
│         │
│  Recs   │
│  Stats  │
└─────────┘
```

## Color Palette

### Base Colors (Ultra-Dark Theme)
```css
--bg-deepest:    #0A0F1E   /* Main background - darker than previous pages */
--bg-surface:    #0F1420   /* Column headers, control panel */
--bg-card:       #0B1020   /* Order cards */
--border:        #1E2638   /* Dividers, borders */
--border-subtle: #141C2F   /* Secondary borders */
```

### Text Hierarchy
```css
--text-primary:   #E6EAF2   /* Headers, labels - bright white */
--text-secondary: #9AA4B2   /* Body text - light gray */
--text-muted:     #6C7484   /* Tertiary info - muted */
--text-disabled:  #4A5264   /* Disabled states */
```

### Status Colors (Left border on columns)
```css
--status-unassigned: #FFC857   /* Amber - needs attention */
--status-assigned:   #60A5FA   /* Blue - driver confirmed */
--status-en-route:   #22D3EE   /* Cyan - moving to pickup */
--status-at-pickup:  #FF8A00   /* Orange - loading */
--status-in-transit: #A78BFA   /* Purple - cargo moving */
--status-at-deliver: #FCD34D   /* Yellow - unloading */
--status-completed:  #24D67B   /* Green - done */
```

### Semantic Colors
```css
--success: #24D67B   /* Positive margins, good HOS */
--warning: #FFC857   /* Medium margins, 3-6h HOS */
--danger:  #FF4D4D   /* Negative margins, <3h HOS */
--info:    #60A5FA   /* Neutral information */
--ai:      #A78BFA   /* AI-related features */
```

## Component Details

### Control Panel
**Height**: 80px  
**Background**: `#0F1420`  
**Border Bottom**: 1px solid `#1E2638`

**Elements:**
- Date Input: Dark input with calendar icon
- Driver Type Chips: Multi-select toggles (COM/RNR/O/O)
  - Active: Blue border + fill
  - Inactive: Gray border, transparent
- Region Dropdown: Chevron-down icon
- Capacity Indicator: Circle icon + text
  - Red <50% capacity
  - Amber 50-79%
  - Green 80%+
- AI Toggle: Sparkles icon + animated switch
  - On: Blue fill with white toggle
  - Off: Gray with transparent toggle

### Kanban Columns
**Width**: 320px per column  
**Min Height**: Full viewport minus header/footer  
**Background**: `#0A0F1E`  
**Border**: 1px solid `#1E2638`  
**Border Radius**: 8px

**Column Header:**
- Left Border: 4px solid (status color)
- Background: `#0F1420`
- Title: 14px semibold, `#E6EAF2`
- Count Badge: Gray pill with count

**Order Card:**
- Background: `#0B1020`
- Border: 1px solid `#1E2638`
- Border Radius: 6px
- Padding: 12px
- Margin Bottom: 8px
- Hover: Subtle border color shift to `#2A3548`

**Card Components:**
1. **Priority Badge** (top-right corner)
   - High: Red dot + "HIGH"
   - Medium: Amber dot + "MED"
   - Low: Gray dot + "LOW"

2. **Route Display**
   - Origin → Destination
   - Map pin icons
   - 12px text, truncate long names

3. **Status-Specific Sections**
   - **Unassigned**: AI Match Score badge (purple)
   - **En Route**: ETA + distance remaining
   - **At Pickup**: Dwell time with alert icon
   - **In Transit**: Progress bar + HOS remaining
   - **Completed**: Final margin with color

4. **Margin Display** (bottom)
   - Dollar amount with background color
   - Green ≥15%, Amber 10-14%, Red <10%

### Driver Availability Bar
**Height**: 140px  
**Background**: `#0F1420`  
**Border Top**: 1px solid `#1E2638`  
**Overflow**: Horizontal scroll

**Driver Card:**
- Width: 180px
- Background: `#0B1020`
- Border: 1px solid `#1E2638`
- Border Radius: 6px
- Padding: 12px
- Margin Right: 8px
- Hover: Border glow (blue)
- Selected: Blue border 2px

**Card Layout:**
```
┌─────────────────────┐
│  [Avatar] Name      │
│  ID: 12345          │
│  🟢 Available       │
│  📍 Location        │
│  ⏰ HOS: 8.5h       │
│  🚛 Unit: T-101     │
│  💡 AI: 94%         │
└─────────────────────┘
```

**Avatar:**
- Circular, 32px
- Initials if no photo
- Background: Status color

**Status Dot:**
- Available: Green `#24D67B`
- On Trip: Blue `#60A5FA`
- HOS Break: Amber `#FFC857`
- Off Duty: Gray `#6C7484`

**HOS Remaining:**
- Red <3h (critical)
- Amber 3-6h (warning)
- Green ≥6h (good)

**Type Badge:**
- COM: Blue pill
- RNR: Purple pill
- O/O: Green pill

### AI Copilot Sidebar
**Width**: 320px  
**Background**: `#0A0F1E`  
**Border Left**: 1px solid `#1E2638`

**Header:**
- Sparkles icon + title
- Subtitle explaining purpose
- 16px padding

**Recommendation Card:**
- Border: Status-specific color at 30% opacity
- Background: Status color at 5% opacity
- Border Radius: 8px
- Padding: 12px
- Margin Bottom: 12px

**Recommendation Layout:**
```
┌──────────────────────────────┐
│ [Icon] Assignment      [X]   │
│ Order: #1234                 │
│ Driver: Mike Johnson         │
│ "On-route match reduces      │
│  deadhead by 45 miles"       │
│ 💰 Save $85  📍 +0.5h ETA    │
│ ────────────────────────      │
│ Confidence: 92%    [Apply]   │
└──────────────────────────────┘
```

**Recommendation Types:**
- Assignment: Green icon
- Reassignment: Blue icon
- Conflict: Orange icon
- Balance: Amber icon

**Confidence Indicator:**
- ≥90%: Green
- 75-89%: Blue
- 60-74%: Amber
- <60%: Orange

**Apply Button:**
- Blue `#60A5FA` background
- White text
- 7px height
- 12px padding horizontal
- Hover: Slight opacity shift

**Footer Stats:**
- 2-column grid
- Today's AI Actions count
- Cost Saved total
- Light border top
- Slightly darker background

## Typography

### Font Families
```css
--font-sans: 'Inter', -apple-system, sans-serif
--font-mono: 'JetBrains Mono', 'Courier New', monospace
```

### Font Scales
- **H1** (Page Title): 24px semibold
- **H2** (Column Title): 14px semibold
- **H3** (Card Title): 13px medium
- **Body**: 12px regular
- **Small**: 11px regular
- **Tiny** (labels): 10px regular
- **Code** (order IDs): 11px monospace

### Line Heights
- Headers: 1.2
- Body: 1.5
- Labels: 1.3

## Spacing System

```css
--space-1:  4px   /* Tight spacing */
--space-2:  8px   /* Default gap */
--space-3:  12px  /* Card padding */
--space-4:  16px  /* Section padding */
--space-5:  20px  /* Component spacing */
--space-6:  24px  /* Large spacing */
--space-8:  32px  /* Extra large */
```

## Iconography

### Icon Library: `lucide-react`
- **Size**: 16px for inline, 20px for headers, 14px for labels
- **Stroke Width**: 2px
- **Color**: Matches text hierarchy

**Common Icons:**
- `Calendar` - Date selector
- `Filter` - Filtering controls
- `Users` - Driver-related
- `TrendingUp/Down` - Margin indicators
- `Sparkles` - AI features
- `MapPin` - Locations
- `Clock` - Time-related
- `Truck` - Vehicles/units
- `Package` - Cargo/orders
- `AlertTriangle` - Warnings
- `CheckCircle2` - Success states
- `X` - Dismiss actions

## Interaction States

### Hover
- Cards: Border color `#2A3548`
- Buttons: Background opacity 90%
- Driver cards: Border glow blue

### Active/Selected
- Driver card: Blue border 2px
- Filter chips: Blue fill + border
- Toggle switches: Blue background

### Focus (Keyboard Navigation)
- Blue outline 2px
- Offset 2px
- Rounded corners match element

### Disabled
- Opacity: 50%
- Cursor: not-allowed
- No hover states

## Responsive Behavior

**Desktop (≥1440px):** Full layout with all columns visible  
**Laptop (1024-1439px):** Horizontal scroll on Kanban, all features  
**Tablet (768-1023px):** AI sidebar toggles off, driver bar scrolls  
**Mobile (<768px):** Not optimized - desktop-first design

## Animation Guidelines

### Transitions
- Color changes: 150ms ease
- Border shifts: 200ms ease
- Opacity fades: 300ms ease-in-out
- Layout shifts: 400ms cubic-bezier(0.4, 0, 0.2, 1)

### Micro-interactions
- Toggle switch: Smooth slide with spring
- Card hover: Subtle lift (no transform used, just border)
- Button press: Scale 0.98 for 100ms
- Recommendation dismiss: Fade out + slide left

## Print Styles (Future)
- Hide AI sidebar
- Single column layout
- Black text on white
- Page breaks between orders

---

**Design Philosophy:** Ultra-dark, high-contrast interface optimized for long-duration monitoring. Color-coded statuses provide instant recognition. Generous spacing prevents visual fatigue. AI features clearly distinguished but non-intrusive.
