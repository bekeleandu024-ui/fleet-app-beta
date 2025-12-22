-- Add weight and volume columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS weight_lbs numeric DEFAULT 1000,
ADD COLUMN IF NOT EXISTS volume_cuft numeric DEFAULT 100;

-- Add capacity columns to unit_profiles table
ALTER TABLE unit_profiles
ADD COLUMN IF NOT EXISTS max_weight_lbs numeric DEFAULT 45000,
ADD COLUMN IF NOT EXISTS max_volume_cuft numeric DEFAULT 3000;

-- Update existing orders with sample weights based on customer type
-- (In production, you'd get real weights from your order system)
UPDATE orders SET 
  weight_lbs = CASE 
    WHEN order_type = 'LTL' THEN 5000 + (random() * 5000)::int  -- 5-10k lbs for LTL
    WHEN order_type = 'FTL' THEN 35000 + (random() * 10000)::int -- 35-45k lbs for FTL
    ELSE 10000 + (random() * 15000)::int  -- 10-25k lbs for standard
  END,
  volume_cuft = CASE 
    WHEN order_type = 'LTL' THEN 500 + (random() * 500)::int  -- 500-1000 cuft for LTL
    WHEN order_type = 'FTL' THEN 2000 + (random() * 800)::int -- 2000-2800 cuft for FTL
    ELSE 800 + (random() * 700)::int  -- 800-1500 cuft for standard
  END
WHERE weight_lbs IS NULL OR volume_cuft IS NULL;

-- Update unit capacities based on typical truck sizes
UPDATE unit_profiles SET
  max_weight_lbs = 45000,  -- Standard 53' trailer max weight
  max_volume_cuft = 3000   -- Standard 53' trailer volume (approx)
WHERE max_weight_lbs IS NULL OR max_volume_cuft IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_orders_weight ON orders(weight_lbs);
CREATE INDEX IF NOT EXISTS idx_orders_volume ON orders(volume_cuft);

SELECT 'Migration complete!' as status;
