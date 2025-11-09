# Dispatch Board

**Interactive Kanban-style dispatch board for real-time load assignment and tracking.**

## Overview

The Dispatch Board is the operations command center where dispatchers assign loads to drivers, monitor active trips, and leverage AI recommendations to optimize fleet utilization. It features a 7-column Kanban layout representing the complete dispatch lifecycle, from unassigned orders through delivery completion.

## Features

### 🎯 Core Functionality

- **7-Stage Kanban Workflow**
  - Unassigned → Assigned → En Route to Pickup → At Pickup → In Transit → At Delivery → Completed
  - Each column shows order count and status-specific information
  - Orders progress through stages as trip milestones are reached

- **Smart Filtering**
  - Date selector for dispatch day planning
  - Multi-select driver type filter (Company, Rental, Owner-Operator)
  - Region filter for geographic focus
  - Filters update board and driver pool in real-time

- **Capacity Dashboard**
  - Live count of available drivers vs pending orders
  - Color-coded capacity percentage (red <50%, amber 50-79%, green 80%+)
  - Quick visual indicator for workload balance

- **Driver Pool Management**
  - Horizontal scrollable bar showing all drivers
  - Real-time status indicators (Available, On Trip, HOS Break, Off Duty)
  - HOS remaining with color-coded warnings (red <3h, amber <6h, green ≥6h)
  - Current location and assigned unit display
  - Click driver card to select for assignment

- **AI Dispatch Assistant** 🤖
  - Right sidebar with smart recommendations
  - Assignment suggestions with cost savings and ETA improvements
  - Conflict detection (HOS violations, double bookings)
  - Load balancing recommendations
  - Confidence scores for each suggestion
  - One-click apply or dismiss actions
  - Daily stats tracking (actions taken, cost saved)

### 📊 Order Cards

Each order card displays contextual information based on its status:

**Unassigned Orders:**
- Priority badge (High/Medium/Low)
- Customer and route
- Pickup time
- AI match score (if auto-dispatch enabled)
- Margin with color coding

**Assigned Orders:**
- Driver name and initials
- Route and pickup time
- Margin calculation

**En Route Orders:**
- ETA to pickup
- Distance remaining
- Current driver location

**At Pickup Orders:**
- Dwell time at location
- Alert if dwelling >30 minutes
- Progress indicator

**In Transit Orders:**
- Progress bar (% complete)
- HOS remaining for driver
- ETA to delivery

**At Delivery Orders:**
- Dwell time at destination
- Alert if dwelling >30 minutes
- Completion pending status

**Completed Orders:**
- Final margin
- Driver who completed
- Completion timestamp

## Page Structure

```
/dispatch/page.tsx          # Main Kanban board page
/dispatch/types.ts          # TypeScript interfaces
/dispatch/mockData.ts       # Sample data (14 orders, 14 drivers, AI recs)
/dispatch/components/
  ├── ControlPanel.tsx      # Filters and capacity display
  ├── KanbanColumn.tsx      # Individual status column with cards
  ├── DriverAvailabilityBar.tsx  # Driver pool display
  └── AICopilotSidebar.tsx  # AI recommendations panel
```

## State Management

The page manages state for:
- **Filters**: Date, driver types, region selection
- **Orders**: Array of dispatch orders with status updates
- **Drivers**: Array of available drivers with real-time status
- **AI Recommendations**: Dynamic suggestion list
- **Selected Driver**: For manual assignment workflow
- **AI Toggle**: Enable/disable AI copilot

## Interactions

### Driver Assignment
1. Click unassigned order card to view details
2. Click driver card in availability bar to select
3. AI recommends optimal match automatically
4. Apply recommendation or make manual selection
5. Order moves to "Assigned" column

### Status Progression
Orders automatically update status as trips progress:
- Driver accepts → Assigned
- Driver begins trip → En Route to Pickup
- Driver arrives → At Pickup
- Driver loads cargo → In Transit
- Driver arrives at destination → At Delivery
- Driver confirms delivery → Completed

### AI Recommendations
- AI analyzes unassigned orders and available drivers
- Generates suggestions based on:
  - Route proximity
  - HOS availability
  - Cost optimization
  - Load balancing
- Click "Apply" to accept recommendation
- Click "X" to dismiss suggestion
- Toggle AI on/off with switch in control panel

## Design System

### Ultra-Dark Theme
- Background: `#0A0F1E` (deepest midnight)
- Surface: `#0F1420` (column headers)
- Cards: `#0B1020` (order cards)
- Borders: `#1E2638` (subtle dividers)

### Status Colors
- Unassigned: Amber `#FFC857`
- Assigned: Blue `#60A5FA`
- En Route: Cyan `#22D3EE`
- At Pickup: Orange `#FF8A00`
- In Transit: Purple `#A78BFA`
- At Delivery: Yellow `#FCD34D`
- Completed: Green `#24D67B`

### Typography
- Headers: Semibold, `#E6EAF2` (bright white)
- Body: Regular, `#9AA4B2` (light gray)
- Labels: `#6C7484` (muted gray)
- Metrics: Monospace for numbers

### Icons
- Priority badges, map pins, clocks for contextual information
- Status indicators with dot + text labels
- Driver type badges (COM/RNR/O/O)

## Technical Details

### Mock Data
- 14 orders distributed across all 7 statuses
- 14 drivers with varied types (Company, Rental, Owner-Operator)
- Realistic HOS calculations (8h, 10h, 11h remaining)
- 3 AI recommendations with 85-95% confidence scores

### Performance Considerations
- `useMemo` for filtered orders and drivers
- Efficient re-renders with proper key props
- Horizontal scroll for driver bar (no virtualization needed for ~15 drivers)
- Vertical scroll per column for longer order lists

### Accessibility
- Semantic HTML structure
- Color contrast meets WCAG AA standards
- Keyboard navigation support
- Focus indicators on interactive elements

## Future Enhancements

- **Drag-and-drop**: Currently logged to console, ready for dataTransfer implementation
- **Order Detail Modal**: Full order view with customer info, documents, notes
- **Real-time Updates**: WebSocket integration for live status changes
- **Driver Chat**: Quick communication with drivers from board
- **Bulk Actions**: Assign multiple orders at once
- **Historical View**: Filter by date range to review past dispatches
- **Export**: CSV/PDF reports of daily dispatch activity

## Usage

Navigate to `/dispatch` to access the Dispatch Board. The page loads with today's date selected and all driver types visible. Use filters to narrow focus, toggle AI assistant on/off, and manage load assignments throughout the day.

**Pro Tip**: Keep AI enabled to receive proactive recommendations. The system learns from your preferences and improves suggestions over time.
