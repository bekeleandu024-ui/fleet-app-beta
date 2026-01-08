-- Migration: Update appointment_type from 'fcfs' to 'window'
-- Date: 2026-01-07

-- Step 1: Update existing 'fcfs' values to 'window'
UPDATE order_stops SET appointment_type = 'window' WHERE appointment_type = 'fcfs';

-- Step 2: Drop the old CHECK constraint and add new one
-- Note: PostgreSQL requires dropping and recreating the constraint

-- First, find and drop the existing constraint
ALTER TABLE order_stops DROP CONSTRAINT IF EXISTS order_stops_appointment_type_check;

-- Add new constraint with 'window' instead of 'fcfs'
ALTER TABLE order_stops 
ADD CONSTRAINT order_stops_appointment_type_check 
CHECK (appointment_type IN ('firm', 'window', 'open'));

-- Step 3: Update the default value
ALTER TABLE order_stops ALTER COLUMN appointment_type SET DEFAULT 'open';
