-- Electronic Proof of Delivery (ePOD) System
-- Complete database schema for document management, signatures, photos, and verification

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Documents table: Store all trip-related documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('BOL', 'POD', 'lumper_receipt', 'weight_ticket', 'inspection', 'customs', 'other')),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID NOT NULL, -- driver_id or user_id
    uploaded_by_type VARCHAR(20) NOT NULL CHECK (uploaded_by_type IN ('driver', 'dispatcher', 'customer', 'system')),
    metadata JSONB DEFAULT '{}'::jsonb,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_documents_trip_id ON documents(trip_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_type ON documents(document_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

-- Signatures table: Capture digital signatures
CREATE TABLE IF NOT EXISTS signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL,
    signature_type VARCHAR(50) NOT NULL CHECK (signature_type IN ('pickup', 'delivery', 'witness', 'inspector')),
    signer_name VARCHAR(255) NOT NULL,
    signer_role VARCHAR(50) NOT NULL CHECK (signer_role IN ('driver', 'receiver', 'shipper', 'warehouse', 'inspector', 'customs')),
    signer_title VARCHAR(100),
    signer_company VARCHAR(255),
    signature_data TEXT NOT NULL, -- base64 encoded image
    signature_format VARCHAR(20) DEFAULT 'png',
    ip_address INET,
    user_agent TEXT,
    geolocation JSONB, -- {lat, lng, accuracy}
    device_info JSONB, -- {device_type, os, browser}
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signatures_document_id ON signatures(document_id);
CREATE INDEX idx_signatures_trip_id ON signatures(trip_id);
CREATE INDEX idx_signatures_type ON signatures(signature_type);
CREATE INDEX idx_signatures_timestamp ON signatures(timestamp DESC);

-- Delivery photos table: Photo documentation
CREATE TABLE IF NOT EXISTS delivery_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type VARCHAR(50) NOT NULL CHECK (photo_type IN ('cargo_loaded', 'cargo_unloaded', 'damage', 'seal', 'condition', 'location', 'odometer', 'other')),
    caption TEXT,
    sequence INTEGER DEFAULT 0,
    geolocation JSONB, -- {lat, lng, accuracy, address}
    exif_data JSONB, -- Camera metadata
    uploaded_by UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_photos_trip_id ON delivery_photos(trip_id);
CREATE INDEX idx_delivery_photos_type ON delivery_photos(photo_type);
CREATE INDEX idx_delivery_photos_timestamp ON delivery_photos(timestamp DESC);

-- POD verification table: Verification workflow
CREATE TABLE IF NOT EXISTS pod_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL UNIQUE,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'needs_review', 'incomplete')),
    verified_by UUID,
    verified_by_name VARCHAR(255),
    verified_at TIMESTAMPTZ,
    
    -- Checklist items
    has_pod BOOLEAN DEFAULT FALSE,
    has_bol BOOLEAN DEFAULT FALSE,
    has_signature BOOLEAN DEFAULT FALSE,
    has_photos BOOLEAN DEFAULT FALSE,
    has_weight_ticket BOOLEAN DEFAULT FALSE,
    
    -- Discrepancy tracking
    has_discrepancies BOOLEAN DEFAULT FALSE,
    discrepancies JSONB DEFAULT '[]'::jsonb, -- Array of {type, description, severity}
    
    notes TEXT,
    internal_notes TEXT,
    
    -- Customer notification
    customer_notified BOOLEAN DEFAULT FALSE,
    customer_notified_at TIMESTAMPTZ,
    
    -- Timestamps
    submitted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pod_verification_trip_id ON pod_verification(trip_id);
CREATE INDEX idx_pod_verification_status ON pod_verification(verification_status);
CREATE INDEX idx_pod_verification_verified_by ON pod_verification(verified_by);
CREATE INDEX idx_pod_verification_submitted_at ON pod_verification(submitted_at DESC);

-- Document templates table: Pre-configured BOL templates
CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('BOL', 'rate_confirmation', 'invoice', 'customs')),
    template_data JSONB NOT NULL, -- Template structure
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_templates_type ON document_templates(template_type) WHERE is_active = TRUE;

-- POD offline queue: For mobile app offline support
CREATE TABLE IF NOT EXISTS pod_offline_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL,
    trip_id UUID NOT NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('document_upload', 'signature_capture', 'photo_upload', 'status_update')),
    payload JSONB NOT NULL,
    device_id VARCHAR(255),
    queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pod_queue_driver ON pod_offline_queue(driver_id);
CREATE INDEX idx_pod_queue_trip ON pod_offline_queue(trip_id);
CREATE INDEX idx_pod_queue_status ON pod_offline_queue(sync_status);
CREATE INDEX idx_pod_queue_queued_at ON pod_offline_queue(queued_at DESC);

-- Audit log for POD activities
CREATE TABLE IF NOT EXISTS pod_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    actor_id UUID,
    actor_name VARCHAR(255),
    actor_type VARCHAR(20),
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pod_audit_trip_id ON pod_audit_log(trip_id);
CREATE INDEX idx_pod_audit_timestamp ON pod_audit_log(timestamp DESC);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pod_verification_updated_at
    BEFORE UPDATE ON pod_verification
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at
    BEFORE UPDATE ON document_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Automatic POD verification record creation when trip is created
CREATE OR REPLACE FUNCTION create_pod_verification_record()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO pod_verification (trip_id)
    VALUES (NEW.id)
    ON CONFLICT (trip_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger should be added to the trips table
-- CREATE TRIGGER trigger_create_pod_verification
--     AFTER INSERT ON trips
--     FOR EACH ROW
--     EXECUTE FUNCTION create_pod_verification_record();

-- Views for easier querying
CREATE OR REPLACE VIEW pod_completion_status AS
SELECT 
    t.id AS trip_id,
    t.order_id,
    t.status AS trip_status,
    pv.verification_status,
    pv.has_pod,
    pv.has_bol,
    pv.has_signature,
    pv.has_photos,
    pv.has_discrepancies,
    COUNT(DISTINCT d.id) AS document_count,
    COUNT(DISTINCT s.id) AS signature_count,
    COUNT(DISTINCT dp.id) AS photo_count,
    pv.verified_at,
    pv.verified_by_name,
    pv.submitted_at
FROM trips t
LEFT JOIN pod_verification pv ON pv.trip_id = t.id
LEFT JOIN documents d ON d.trip_id = t.id AND d.deleted_at IS NULL
LEFT JOIN signatures s ON s.trip_id = t.id
LEFT JOIN delivery_photos dp ON dp.trip_id = t.id
GROUP BY t.id, t.order_id, t.status, pv.verification_status, pv.has_pod, 
         pv.has_bol, pv.has_signature, pv.has_photos, pv.has_discrepancies,
         pv.verified_at, pv.verified_by_name, pv.submitted_at;

COMMENT ON TABLE documents IS 'Stores all trip-related documents (BOL, POD, receipts, etc.)';
COMMENT ON TABLE signatures IS 'Digital signature captures for POD';
COMMENT ON TABLE delivery_photos IS 'Photo documentation for deliveries';
COMMENT ON TABLE pod_verification IS 'POD verification workflow and checklist';
COMMENT ON TABLE document_templates IS 'Reusable templates for BOL and other documents';
COMMENT ON TABLE pod_offline_queue IS 'Offline action queue for mobile app sync';
COMMENT ON TABLE pod_audit_log IS 'Audit trail for all POD-related activities';
