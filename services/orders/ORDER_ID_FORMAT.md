# Order ID Format

## Overview
Order IDs are now meaningful 9-character alphanumeric identifiers that encode information about the order.

## Format Structure
```
[TYPE][ORIGIN][DEST][SEQUENCE]
```

### Components:
1. **TYPE (1 char)** - Order type identifier
   - `P` = Pickup
   - `D` = Delivery  
   - `R` = Round Trip

2. **ORIGIN (2 chars)** - First 2 letters of pickup location (uppercase)
   - Extracts alphabetic characters only
   - Example: "Los Angeles" → "LA"

3. **DEST (2 chars)** - First 2 letters of dropoff location (uppercase)
   - Extracts alphabetic characters only
   - Example: "New York" → "NE"

4. **SEQUENCE (4 digits)** - Daily sequence number with zero padding
   - Resets daily
   - Range: 0001-9999

## Examples

| Order Type | Pickup | Dropoff | Sequence | Order ID |
|-----------|--------|---------|----------|----------|
| Pickup | Los Angeles | New York | 1 | `PLANY0001` |
| Delivery | Chicago | Miami | 542 | `DCHMI0542` |
| Round Trip | Dallas | Houston | 3 | `RDAHO0003` |
| Pickup | San Francisco | Seattle | 1250 | `PSASE1250` |

## Benefits
- **Human-readable**: Easy to reference and communicate
- **Compact**: Only 9 characters vs 36-character UUIDs
- **Meaningful**: Instantly know order type and route
- **Unique**: Daily sequence ensures uniqueness within order type and route
- **Sortable**: Chronological sorting by date + sequence

## Technical Implementation
- Database column: `VARCHAR(9)` with regex constraint `^[PDR][A-Z]{4}[0-9]{4}$`
- Generated server-side during order creation
- Sequence calculated from daily orders count
- Immutable once assigned
