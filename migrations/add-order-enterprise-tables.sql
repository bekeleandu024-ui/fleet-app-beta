-- Migration: Add Enterprise Order Tables
-- Date: 2026-01-01
-- Description: Adds multi-stop, freight items, and reference management tables

-- ============================================================================
-- 1. ORDER STOPS TABLE (Multi-Stop Route Support)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    stop_sequence INT NOT NULL,
    stop_type VARCHAR(20) NOT NULL CHECK (stop_type IN ('pickup', 'delivery', 'intermediate')),
    
    -- Location Details
    location_name VARCHAR(255),
    street_address TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(3) DEFAULT 'USA',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Appointment Details
    appointment_type VARCHAR(20) NOT NULL DEFAULT 'fcfs' CHECK (appointment_type IN ('firm', 'fcfs', 'open')),
    appointment_start TIMESTAMP WITH TIME ZONE,
    appointment_end TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    actual_departure TIMESTAMP WITH TIME ZONE,
    
    -- Contact Information
    contact_name VARCHAR(100),
    contact_phone VARCHAR(30),
    contact_email VARCHAR(255),
    
    -- Instructions
    special_instructions TEXT,
    driver_instructions TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for order_stops
CREATE INDEX IF NOT EXISTS idx_order_stops_order_id ON order_stops(order_id);
CREATE INDEX IF NOT EXISTS idx_order_stops_sequence ON order_stops(order_id, stop_sequence);

-- ============================================================================
-- 2. ORDER FREIGHT ITEMS TABLE (Line Item Detail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_freight_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    
    -- Commodity Details
    commodity VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Dimensions & Weight
    quantity INT NOT NULL DEFAULT 1,
    pieces INT DEFAULT 1,
    packaging_type VARCHAR(50) DEFAULT 'pallet',
    weight_lbs DECIMAL(12, 2),
    length_in DECIMAL(8, 2),
    width_in DECIMAL(8, 2),
    height_in DECIMAL(8, 2),
    cubic_feet DECIMAL(10, 2),
    density DECIMAL(6, 2),
    
    -- Classification
    freight_class VARCHAR(10),
    nmfc_code VARCHAR(20),
    
    -- Hazmat
    is_hazmat BOOLEAN DEFAULT FALSE,
    hazmat_class VARCHAR(20),
    hazmat_un_number VARCHAR(10),
    hazmat_packing_group VARCHAR(5),
    hazmat_proper_name VARCHAR(255),
    
    -- Handling
    stackable BOOLEAN DEFAULT TRUE,
    temperature_controlled BOOLEAN DEFAULT FALSE,
    temp_min_f DECIMAL(5, 1),
    temp_max_f DECIMAL(5, 1),
    
    -- Value
    declared_value DECIMAL(12, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for order_freight_items
CREATE INDEX IF NOT EXISTS idx_order_freight_items_order_id ON order_freight_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_freight_items_hazmat ON order_freight_items(is_hazmat) WHERE is_hazmat = TRUE;

-- ============================================================================
-- 3. ORDER REFERENCES TABLE (Key-Value Reference Numbers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    reference_type VARCHAR(50) NOT NULL,  -- e.g., 'PO', 'BOL', 'SEAL', 'PRO', 'QUOTE'
    reference_value VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for order_references
CREATE INDEX IF NOT EXISTS idx_order_references_order_id ON order_references(order_id);
CREATE INDEX IF NOT EXISTS idx_order_references_type ON order_references(reference_type);
CREATE INDEX IF NOT EXISTS idx_order_references_value ON order_references(reference_value);

-- ============================================================================
-- 4. ORDER BILLING TABLE (Bill-To Logic)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Bill-To Party
    bill_to_type VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (bill_to_type IN ('customer', 'shipper', 'consignee', 'third_party')),
    bill_to_customer_id UUID,
    bill_to_name VARCHAR(255),
    bill_to_address TEXT,
    bill_to_email VARCHAR(255),
    
    -- Payment Terms
    payment_terms VARCHAR(50) DEFAULT 'NET30',  -- NET15, NET30, NET45, NET60, PREPAID, COD
    credit_status VARCHAR(20) DEFAULT 'approved', -- approved, pending, hold, cod_only
    credit_limit DECIMAL(12, 2),
    
    -- Invoice Details
    invoice_method VARCHAR(20) DEFAULT 'email', -- email, mail, edi, portal
    require_pod BOOLEAN DEFAULT TRUE,
    require_bol BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for order_billing
CREATE INDEX IF NOT EXISTS idx_order_billing_order_id ON order_billing(order_id);
CREATE INDEX IF NOT EXISTS idx_order_billing_bill_to_customer ON order_billing(bill_to_customer_id);

-- ============================================================================
-- 5. ORDER ACCESSORIALS TABLE (Extra Services)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_accessorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    accessorial_code VARCHAR(50) NOT NULL,
    accessorial_name VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(10, 2),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for order_accessorials
CREATE INDEX IF NOT EXISTS idx_order_accessorials_order_id ON order_accessorials(order_id);

-- ============================================================================
-- 6. ADD COLUMNS TO EXISTING ORDERS TABLE
-- ============================================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS equipment_type VARCHAR(50) DEFAULT 'Dry Van';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS equipment_length INT DEFAULT 53;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS temperature_setting VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_weight_lbs DECIMAL(12, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_pieces INT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_pallets INT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_cubic_feet DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_linear_feet DECIMAL(8, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_hazmat BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_high_value BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS declared_value DECIMAL(12, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source_channel VARCHAR(50) DEFAULT 'manual';

-- ============================================================================
-- 7. COMMON ACCESSORIALS SEED DATA
-- ============================================================================
CREATE TABLE IF NOT EXISTS accessorial_types (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    default_price DECIMAL(10, 2),
    unit VARCHAR(20) DEFAULT 'each',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO accessorial_types (code, name, category, default_price, unit, description) VALUES
    ('LIFTGATE_PU', 'Liftgate - Pickup', 'Equipment', 75.00, 'each', 'Liftgate service at pickup'),
    ('LIFTGATE_DEL', 'Liftgate - Delivery', 'Equipment', 75.00, 'each', 'Liftgate service at delivery'),
    ('INSIDE_PU', 'Inside Pickup', 'Service', 100.00, 'each', 'Inside pickup service'),
    ('INSIDE_DEL', 'Inside Delivery', 'Service', 100.00, 'each', 'Inside delivery service'),
    ('RESIDENTIAL', 'Residential Delivery', 'Service', 85.00, 'each', 'Residential area delivery'),
    ('LIMITED_ACCESS', 'Limited Access', 'Service', 95.00, 'each', 'Limited access location'),
    ('APPOINTMENT', 'Appointment Required', 'Service', 50.00, 'each', 'Appointment scheduling'),
    ('DETENTION_PU', 'Detention - Pickup', 'Time', 75.00, 'hour', 'Detention at pickup after free time'),
    ('DETENTION_DEL', 'Detention - Delivery', 'Time', 75.00, 'hour', 'Detention at delivery after free time'),
    ('LAYOVER', 'Layover', 'Time', 350.00, 'day', 'Driver layover'),
    ('TARP', 'Tarping', 'Equipment', 125.00, 'each', 'Tarp required for load'),
    ('TEAM', 'Team Service', 'Service', 0.00, 'mile', 'Team driver service'),
    ('HAZMAT', 'Hazmat Handling', 'Handling', 250.00, 'each', 'Hazardous materials handling'),
    ('REEFER_PROTECTION', 'Protect From Freeze', 'Temperature', 150.00, 'each', 'Reefer protection from freeze'),
    ('TEMP_CONTROLLED', 'Temperature Control', 'Temperature', 200.00, 'each', 'Active temperature control'),
    ('SORT_SEGREGATE', 'Sort and Segregate', 'Handling', 125.00, 'hour', 'Sort and segregate freight'),
    ('SCALE_TICKET', 'Scale Ticket', 'Documentation', 25.00, 'each', 'Certified scale ticket'),
    ('EXTRA_STOP', 'Additional Stop', 'Routing', 150.00, 'each', 'Additional pickup or delivery stop'),
    ('BORDER_CROSSING', 'Border Crossing', 'Routing', 175.00, 'each', 'Cross-border shipment'),
    ('BLIND_SHIPMENT', 'Blind Shipment', 'Documentation', 50.00, 'each', 'Blind shipment handling')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 8. REFERENCE TYPES LOOKUP TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS reference_types (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO reference_types (code, name, description) VALUES
    ('PO', 'Purchase Order', 'Customer purchase order number'),
    ('BOL', 'Bill of Lading', 'Bill of lading number'),
    ('SEAL', 'Seal Number', 'Container or trailer seal number'),
    ('PRO', 'PRO Number', 'Progressive or tracking number'),
    ('QUOTE', 'Quote Number', 'Original quote reference'),
    ('SO', 'Sales Order', 'Sales order number'),
    ('INV', 'Invoice', 'Invoice number'),
    ('REF', 'Reference', 'General reference number'),
    ('BOOKING', 'Booking Number', 'Carrier booking confirmation'),
    ('CONTAINER', 'Container Number', 'Shipping container ID'),
    ('TRAILER', 'Trailer Number', 'Trailer identification'),
    ('LOAD', 'Load Number', 'Internal load identifier'),
    ('ASN', 'ASN', 'Advance shipping notice'),
    ('CUSTOMS', 'Customs Entry', 'Customs entry number'),
    ('PARS', 'PARS', 'Pre-Arrival Review System number (Canada)')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 9. UPDATE TIMESTAMP TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_order_stops_updated_at ON order_stops;
CREATE TRIGGER update_order_stops_updated_at 
    BEFORE UPDATE ON order_stops 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_freight_items_updated_at ON order_freight_items;
CREATE TRIGGER update_order_freight_items_updated_at 
    BEFORE UPDATE ON order_freight_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_billing_updated_at ON order_billing;
CREATE TRIGGER update_order_billing_updated_at 
    BEFORE UPDATE ON order_billing 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
