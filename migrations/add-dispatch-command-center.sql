-- Migration: Add Dispatch Command Center Tables
-- Date: 2026-01-01
-- Description: Adds dispatch workflow, carrier bids, and fleet assignment tracking

-- ============================================================================
-- 1. UPDATE ORDERS TABLE FOR DISPATCH WORKFLOW
-- ============================================================================

-- Add dispatch-specific columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispatch_status VARCHAR(50) DEFAULT 'NEW';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES driver_profiles(driver_id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_unit_id UUID REFERENCES unit_profiles(unit_id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS awarded_carrier_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS awarded_bid_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS posted_to_carriers BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kicked_to_brokerage_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kicked_to_brokerage_by VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kick_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS covered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS covered_by VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS target_rate DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS margin_target_pct DECIMAL(5, 2);

-- Update dispatch_status constraint (allow existing statuses + new workflow statuses)
-- Note: We don't use a CHECK constraint since status values can vary

-- Create index for dispatch status
CREATE INDEX IF NOT EXISTS idx_orders_dispatch_status ON orders(dispatch_status);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_driver ON orders(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_unit ON orders(assigned_unit_id);
CREATE INDEX IF NOT EXISTS idx_orders_posted ON orders(posted_to_carriers) WHERE posted_to_carriers = TRUE;

-- ============================================================================
-- 2. CARRIER PROFILES TABLE (External Carriers for Brokerage)
-- ============================================================================
CREATE TABLE IF NOT EXISTS carrier_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_name VARCHAR(255) NOT NULL,
    mc_number VARCHAR(50),
    dot_number VARCHAR(50),
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    equipment_types TEXT[], -- Array of equipment types they can haul
    preferred_lanes TEXT[], -- Array of lanes they prefer
    rating DECIMAL(3, 2), -- 0.00 to 5.00
    insurance_expiry DATE,
    safety_score DECIMAL(5, 2),
    on_time_pct DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT TRUE,
    is_preferred BOOLEAN DEFAULT FALSE,
    payment_terms VARCHAR(50) DEFAULT 'NET30',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carrier_profiles_active ON carrier_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_carrier_profiles_mc ON carrier_profiles(mc_number);
CREATE INDEX IF NOT EXISTS idx_carrier_profiles_preferred ON carrier_profiles(is_preferred) WHERE is_preferred = TRUE;

-- ============================================================================
-- 3. CARRIER BIDS TABLE (Tracking External Carrier Quotes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS carrier_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    carrier_id UUID REFERENCES carrier_profiles(id),
    
    -- Carrier Info (can be entered without carrier profile)
    carrier_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    mc_number VARCHAR(50),
    
    -- Bid Details
    bid_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    transit_time_hours INT, -- Estimated transit time in hours
    pickup_available_at TIMESTAMP WITH TIME ZONE,
    delivery_eta TIMESTAMP WITH TIME ZONE,
    
    -- Bid Status
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, EXPIRED, WITHDRAWN
    is_lowest_cost BOOLEAN DEFAULT FALSE,
    is_fastest BOOLEAN DEFAULT FALSE,
    
    -- Tracking
    received_via VARCHAR(50), -- phone, email, portal, loadboard
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    response_by VARCHAR(255),
    
    -- Notes
    notes TEXT,
    rejection_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carrier_bids_order_id ON carrier_bids(order_id);
CREATE INDEX IF NOT EXISTS idx_carrier_bids_carrier_id ON carrier_bids(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_bids_status ON carrier_bids(status);
CREATE INDEX IF NOT EXISTS idx_carrier_bids_received_at ON carrier_bids(received_at DESC);

-- ============================================================================
-- 4. DISPATCH ACTIONS LOG (Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dispatch_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL, -- e.g., 'ASSIGN_FLEET', 'KICK_TO_BROKERAGE', 'POST_TO_CARRIERS', 'AWARD_BID', 'UNASSIGN'
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    
    -- Actor
    performed_by VARCHAR(255),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Context
    driver_id UUID,
    unit_id UUID,
    carrier_id UUID,
    bid_id UUID,
    
    -- Details
    notes TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_actions_order_id ON dispatch_actions(order_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_actions_type ON dispatch_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_dispatch_actions_performed_at ON dispatch_actions(performed_at DESC);

-- ============================================================================
-- 5. FUNCTION TO UPDATE BID FLAGS (Lowest Cost / Fastest)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_bid_flags()
RETURNS TRIGGER AS $$
BEGIN
    -- Reset all flags for this order
    UPDATE carrier_bids 
    SET is_lowest_cost = FALSE, is_fastest = FALSE 
    WHERE order_id = NEW.order_id AND status = 'PENDING';
    
    -- Set lowest cost flag
    UPDATE carrier_bids 
    SET is_lowest_cost = TRUE 
    WHERE id = (
        SELECT id FROM carrier_bids 
        WHERE order_id = NEW.order_id AND status = 'PENDING' 
        ORDER BY bid_amount ASC 
        LIMIT 1
    );
    
    -- Set fastest flag (by transit time or delivery ETA)
    UPDATE carrier_bids 
    SET is_fastest = TRUE 
    WHERE id = (
        SELECT id FROM carrier_bids 
        WHERE order_id = NEW.order_id AND status = 'PENDING' 
        ORDER BY COALESCE(transit_time_hours, 9999) ASC, delivery_eta ASC NULLS LAST
        LIMIT 1
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bid_flags_trigger ON carrier_bids;
CREATE TRIGGER update_bid_flags_trigger
    AFTER INSERT OR UPDATE ON carrier_bids
    FOR EACH ROW
    EXECUTE FUNCTION update_bid_flags();

-- ============================================================================
-- 6. FUNCTION TO LOG DISPATCH ACTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION log_dispatch_action(
    p_order_id UUID,
    p_action_type VARCHAR(100),
    p_from_status VARCHAR(50),
    p_to_status VARCHAR(50),
    p_performed_by VARCHAR(255),
    p_driver_id UUID DEFAULT NULL,
    p_unit_id UUID DEFAULT NULL,
    p_carrier_id UUID DEFAULT NULL,
    p_bid_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    action_id UUID;
BEGIN
    INSERT INTO dispatch_actions (
        order_id, action_type, from_status, to_status, performed_by,
        driver_id, unit_id, carrier_id, bid_id, notes, metadata
    ) VALUES (
        p_order_id, p_action_type, p_from_status, p_to_status, p_performed_by,
        p_driver_id, p_unit_id, p_carrier_id, p_bid_id, p_notes, p_metadata
    ) RETURNING id INTO action_id;
    
    RETURN action_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. SEED SAMPLE CARRIERS (Optional)
-- ============================================================================
INSERT INTO carrier_profiles (carrier_name, mc_number, dot_number, contact_name, contact_phone, contact_email, equipment_types, rating, is_active, is_preferred) VALUES
    ('TFI Transport', 'MC-123456', 'DOT-789012', 'John Smith', '416-555-0101', 'dispatch@tfi.com', ARRAY['Dry Van', 'Reefer'], 4.5, TRUE, TRUE),
    ('Swift Logistics', 'MC-234567', 'DOT-890123', 'Jane Doe', '905-555-0102', 'loads@swift.com', ARRAY['Dry Van', 'Flatbed'], 4.2, TRUE, FALSE),
    ('Northern Star Trucking', 'MC-345678', 'DOT-901234', 'Mike Wilson', '519-555-0103', 'mike@nstar.com', ARRAY['Dry Van'], 4.0, TRUE, FALSE),
    ('CrossBorder Express', 'MC-456789', 'DOT-012345', 'Sarah Lee', '647-555-0104', 'sarah@cbx.com', ARRAY['Dry Van', 'Reefer', 'Flatbed'], 4.8, TRUE, TRUE),
    ('Maple Leaf Carriers', 'MC-567890', 'DOT-123456', 'Bob Brown', '289-555-0105', 'bob@mlc.ca', ARRAY['Dry Van'], 3.8, TRUE, FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. UPDATE TIMESTAMP TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS update_carrier_profiles_updated_at ON carrier_profiles;
CREATE TRIGGER update_carrier_profiles_updated_at 
    BEFORE UPDATE ON carrier_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_carrier_bids_updated_at ON carrier_bids;
CREATE TRIGGER update_carrier_bids_updated_at 
    BEFORE UPDATE ON carrier_bids 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. MIGRATE EXISTING ORDERS TO NEW DISPATCH STATUS
-- ============================================================================
-- Set dispatch_status based on existing status
UPDATE orders SET dispatch_status = 
    CASE 
        WHEN status IN ('New', 'NEW', 'pending') THEN 'NEW'
        WHEN status IN ('Qualifying', 'Planning') THEN 'FLEET_DISPATCH'
        WHEN status IN ('Qualified', 'Ready to Book') THEN 'FLEET_DISPATCH'
        WHEN status IN ('In Transit', 'Delivered') THEN 'COVERED_INTERNAL'
        ELSE 'NEW'
    END
WHERE dispatch_status IS NULL OR dispatch_status = 'NEW';

