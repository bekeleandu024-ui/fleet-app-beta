# Order Lifecycle Verification

This guide explains how to verify that an order's lifecycle activities are correctly stored across the different microservice containers (Orders, Dispatch, Tracking, Master Data).

## Verification Script

We have created a script `verify-order-lifecycle.js` that queries the database tables associated with each service to confirm data persistence.

### Usage

To verify the most recent order:
```bash
node verify-order-lifecycle.js
```

To verify a specific order ID:
```bash
node verify-order-lifecycle.js <ORDER_UUID>
```

### What it Checks

The script verifies data presence in the following logical containers:

1.  **Orders Service**
    *   Table: `orders`
    *   Verifies: Order creation, status, customer, timestamps.

2.  **Dispatch Service**
    *   Table: `dispatches`
    *   Verifies: Dispatch assignment, driver linkage.

3.  **Master Data Service**
    *   Table: `driver_profiles`
    *   Verifies: Driver information existence and linkage.

4.  **Trip Management (Shared/Dispatch)**
    *   Table: `trips`
    *   Verifies: Trip creation, status, planned miles.

5.  **Tracking Service**
    *   Table: `trip_locations`
    *   Verifies: GPS ping history and location data.

6.  **Event Log (Cross-cutting)**
    *   Table: `trip_events`
    *   Verifies: Audit trail of all events (e.g., `TRIP_START`, `ARRIVED_PICKUP`) with timestamps and sources.

## Example Output

```text
=== 1. ORDERS SERVICE (Container: orders) ===
Order ID: 233f89e3-2df5-432f-b338-b1f60c97e2c3
Status: Delivered
✅ Order record found in orders table.

=== 2. DISPATCH SERVICE (Container: dispatch) ===
Dispatch ID: ...
✅ Dispatch record found in dispatches table.

=== 3. MASTER DATA SERVICE (Container: master-data) ===
Driver Name: John Doe
✅ Driver profile found in driver_profiles table.

...
```

## Troubleshooting

*   **Missing Dispatch?** Ensure the order has been assigned to a driver.
*   **Missing Locations?** Ensure the simulation or driver app has started sending GPS pings.
*   **Missing Events?** Check Kafka consumer status if events are processed asynchronously.
