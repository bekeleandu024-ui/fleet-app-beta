-- Change order ID from UUID to VARCHAR for meaningful alphanumeric IDs
-- Format: [TYPE][ORIGIN][DEST][SEQ] - 9 characters
-- Example: PLANY3421 (Pickup from LA to NY, sequence 3421)

-- Drop foreign key constraints that reference orders.id
DO $$ 
BEGIN
  -- Drop foreign key constraint from customs_clearances if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'customs_clearances_order_id_fkey'
  ) THEN
    ALTER TABLE customs_clearances DROP CONSTRAINT customs_clearances_order_id_fkey;
  END IF;
  
  -- Drop foreign key constraint from trip_costs if it exists (in master-data service)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'trip_costs_order_id_fkey'
  ) THEN
    ALTER TABLE trip_costs DROP CONSTRAINT trip_costs_order_id_fkey;
  END IF;
END $$;

-- Change the column type from UUID to VARCHAR
ALTER TABLE orders 
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE VARCHAR(36);

-- Also update the customs_clearances.order_id column type to match
ALTER TABLE customs_clearances 
  ALTER COLUMN order_id TYPE VARCHAR(36);

-- Update index for the new ID format
DROP INDEX IF EXISTS idx_orders_id;
CREATE INDEX IF NOT EXISTS idx_orders_id ON orders(id);

-- Note: New orders will use 9-char format, existing UUIDs remain for backward compatibility
-- Foreign keys are not re-added to allow flexibility with the new ID format
