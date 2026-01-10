-- Migration: Fix order_accessorials quantity column to support decimal values
-- Issue: Quantity was INT but detention/waiting time can be fractional (e.g., 1.5 hours)
-- Date: 2026-01-08

-- Change quantity column from INT to DECIMAL to support fractional values
ALTER TABLE order_accessorials 
ALTER COLUMN quantity TYPE DECIMAL(10, 2) USING quantity::DECIMAL(10, 2);

-- Update default value
ALTER TABLE order_accessorials 
ALTER COLUMN quantity SET DEFAULT 1.0;

-- Add comment for documentation
COMMENT ON COLUMN order_accessorials.quantity IS 'Quantity of accessorial units (supports decimals for time-based charges like detention hours)';
