# Trip Book Page - Quick Visual Reference

## 🎨 Color & Style Guide

### Skeleton Colors
```css
Background:     bg-zinc-800/50 to bg-zinc-700/50 (shimmer gradient)
Border:         border-zinc-800
Card BG:        bg-zinc-900/40
```

### Animation Timing
```css
Fade-in:        400ms ease-out
Shimmer:        2s infinite
Delay Step:     50-100ms between elements
```

### Fixed Heights Reference
```
Component                    Min Height
─────────────────────────────────────────
Order Snapshot               72px
AI Insights Panel            600px
Booking Form                 700px
Resource List (each)         240px
Empty State                  72px
```

---

## 🎬 Animation Sequence

```
TIME    COMPONENT               ANIMATION
────────────────────────────────────────────────
0ms     Header                  Fade in (no delay)
100ms   Order Snapshot          Fade in + translateY
100ms   AI Header               Fade in (internal)
200ms   AI Resource Card        Fade in (internal)
200ms   Booking Form            Fade in + translateY
300ms   AI Revenue Card         Fade in (internal)
300ms   Orders List             Fade in + translateY
350ms   Drivers List            Fade in + translateY
400ms   Units List              Fade in + translateY
────────────────────────────────────────────────
900ms   Fully Interactive       All animations complete
```

---

## 📐 Layout Grid Breakdown

### Desktop (>1024px)
```
┌────────────────────────────────────────────────┐
│ Header (full width)                            │
├────────────────────────────────────────────────┤
│ Order Snapshot (full width, 72px)              │
├───────────┬────────────────────┬───────────────┤
│ AI Panel  │   Booking Form     │  Resources    │
│ 25%       │   50%              │  25%          │
│ (col-3)   │   (col-6)          │  (col-3)      │
│ 600px     │   700px+           │  3x240px      │
└───────────┴────────────────────┴───────────────┘
```

### Grid Classes
```tsx
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-3">   {/* 25% - AI Panel */}
  <div className="col-span-6">   {/* 50% - Form */}
  <div className="col-span-3">   {/* 25% - Resources */}
</div>
```

---

## 🎯 Component Props Quick Reference

### AIInsightsPanelSkeleton
```tsx
<AIInsightsPanelSkeleton />
// No props - fixed dimensions
// Height: 600px
// Sections: Header + Resource Card + Revenue Card
```

### OrderSnapshotSkeleton
```tsx
<OrderSnapshotSkeleton />
// No props - fixed dimensions
// Height: 72px
// Layout: Horizontal card with data points
```

### BookingFormSkeleton
```tsx
<BookingFormSkeleton />
// No props - fixed dimensions
// Min Height: 700px
// Sections: Header + Driver Cards + Inputs + Button
```

### ResourceListSkeleton
```tsx
<ResourceListSkeleton 
  title="Available Drivers" 
  icon={TrendingUp} 
  itemCount={5} 
/>
// Props:
//   - title: string (list heading)
//   - icon: LucideIcon (component icon)
//   - itemCount?: number (default: 5)
// Height: 240px fixed
```

### EmptyStatePlaceholder
```tsx
<EmptyStatePlaceholder />
// No props - fixed dimensions
// Height: 72px
// Shows: "Select a qualified order..."
```

---

## 🔧 Usage Examples

### Basic Loading State
```tsx
const [isLoading, setIsLoading] = useState(true);

return (
  <>
    {isLoading ? (
      <AIInsightsPanelSkeleton />
    ) : (
      <AIInsightsPanel {...props} />
    )}
  </>
);
```

### With Fade-In Animation
```tsx
<div 
  className="opacity-0 animate-fade-in" 
  style={{ 
    animationDelay: '200ms', 
    animationFillMode: 'forwards' 
  }}
>
  <YourComponent />
</div>
```

### Conditional Rendering Pattern
```tsx
{isInitialLoading ? (
  <ResourceListSkeleton 
    title="Drivers" 
    icon={User} 
    itemCount={5} 
  />
) : (
  <Card className="min-h-[240px]">
    {/* Actual content */}
  </Card>
)}
```

---

## 🎨 Skeleton Structure Examples

### AI Insights Panel Skeleton
```
┌─────────────────────────────┐
│ ✨ [████████████]           │ ← Header
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [█]  Suggested Resources│ │ ← Resource Card
│ │                         │ │   (180px)
│ │ Driver:                 │ │
│ │ [████████████]          │ │
│ │ [████████████████]      │ │
│ │                         │ │
│ │ Unit:                   │ │
│ │ [██████]                │ │
│ │ [████████████████]      │ │
│ │                         │ │
│ │ [██████ Button ██████]  │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Revenue & Timing        │ │ ← Revenue Card
│ │                         │ │   (160px)
│ │ [████] [██]             │ │
│ │ [████] [████]           │ │
│ │ ───────────────         │ │
│ │ [████] [██████]         │ │
│ │                         │ │
│ │ [██████████████████]    │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [████████████████]          │ ← Additional
└─────────────────────────────┘   (80px)
   Total: 600px
```

### Resource List Skeleton
```
┌─────────────────────────┐
│ 📦 [████████]           │ ← Header
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ [████████████]      │ │ ← Items
│ └─────────────────────┘ │   (5x ~45px each)
│ ┌─────────────────────┐ │
│ │ [████████████]      │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ [████████████]      │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ [████████████]      │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ [████████████]      │ │
│ └─────────────────────┘ │
└─────────────────────────┘
   Total: 240px
```

---

## 🚦 State Management Pattern

### Loading State Flow
```typescript
// 1. Initialize
const [isInitialLoading, setIsInitialLoading] = useState(true);

// 2. Fetch data
useEffect(() => {
  setIsInitialLoading(true);
  
  Promise.all([
    fetch('/api/orders'),
    fetch('/api/drivers'),
    fetch('/api/units'),
    fetch('/api/rates')
  ])
  .then(/* handle data */)
  .finally(() => {
    setIsInitialLoading(false); // Trigger content reveal
  });
}, []);

// 3. Render
{isInitialLoading ? <Skeleton /> : <Content />}
```

---

## 🎭 Animation CSS Classes

### Available Utilities
```css
/* Fade in with slide up */
.animate-fade-in {
  animation: fade-in 0.4s ease-out;
}

/* Shimmer loading effect */
.animate-shimmer {
  animation: shimmer 2s infinite;
  background-size: 200% 100%;
}

/* Pulse (built-in Tailwind) */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Using with Delays
```tsx
<div 
  className="opacity-0 animate-fade-in"
  style={{ 
    animationDelay: '200ms',
    animationFillMode: 'forwards' 
  }}
>
  {/* Content fades in after 200ms */}
</div>
```

---

## 📏 Dimension Reference

### Spacing
```
Gap between grid columns:     gap-4 (1rem / 16px)
Card padding:                 p-3 to p-5 (0.75-1.25rem)
Section spacing:              space-y-3 or space-y-4
```

### Border & Radius
```
Border:                       border-zinc-800
Border opacity variants:      border-zinc-800/50, /70
Radius:                       rounded-lg (0.5rem)
```

### Text Sizes
```
Page title:                   text-2xl
Section headers:              text-sm to text-lg
Labels:                       text-xs
Body text:                    text-sm
```

---

## 🎯 Testing Checklist

### Visual Testing
```
☐ Skeletons match content dimensions exactly
☐ No layout shift when content loads
☐ Animations are smooth (60fps)
☐ Colors match dark theme
☐ Spacing is consistent
```

### Functional Testing
```
☐ Skeletons show immediately (0ms)
☐ Data loads correctly
☐ Animations trigger on time
☐ Error states work
☐ Empty states work
☐ No console errors
```

### Performance Testing
```
☐ CLS score < 0.01
☐ FCP < 1s (skeleton)
☐ TTI < 2s (interactive)
☐ No memory leaks
☐ Lighthouse score > 90
```

---

## 🔍 Debugging Tips

### Layout Shifts
```tsx
// Add border to debug container sizes
className="border-2 border-red-500"

// Check computed height
console.log(element.getBoundingClientRect().height);

// Measure CLS in Chrome DevTools
// Performance > Experience > Cumulative Layout Shift
```

### Animation Issues
```tsx
// Force animation replay
key={Date.now()} 

// Check animation state
element.getAnimations().forEach(a => console.log(a));

// Disable for debugging
className="!animate-none"
```

### Skeleton Mismatch
```tsx
// Overlay skeleton on content to check alignment
<div className="relative">
  <div className="absolute inset-0 opacity-50">
    <Skeleton />
  </div>
  <Content />
</div>
```

---

## 📚 Related Files

```
components/booking/skeletons.tsx        ← Skeleton components
components/ai-insights-panel.tsx        ← AI panel with skeletons
app/book/page.tsx                       ← Main page with loading states
styles/globals.css                      ← Animation keyframes

docs/TRIP_BOOK_REDESIGN.md             ← Technical documentation
docs/TRIP_BOOK_LAYOUT_OPTIONS.md       ← Layout alternatives
docs/TRIP_BOOK_SUMMARY.md              ← Executive summary
```

---

## 🎉 Quick Start

1. **Import skeleton:**
   ```tsx
   import { AIInsightsPanelSkeleton } from '@/components/booking/skeletons';
   ```

2. **Add loading state:**
   ```tsx
   const [loading, setLoading] = useState(true);
   ```

3. **Conditional render:**
   ```tsx
   {loading ? <AIInsightsPanelSkeleton /> : <ActualContent />}
   ```

4. **Add animation (optional):**
   ```tsx
   <div className="opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
     <ActualContent />
   </div>
   ```

Done! ✨

---

## 💡 Pro Tips

1. **Always match dimensions** - Measure real content, use those values
2. **Stagger animations** - 50-100ms delays feel natural
3. **Use CSS animations** - Better performance than JS
4. **Test on slow networks** - Simulate 3G to see skeletons
5. **Keep it simple** - Don't over-animate

---

**Quick Reference Complete** 📋
