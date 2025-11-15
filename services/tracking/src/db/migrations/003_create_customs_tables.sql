CREATE TABLE IF NOT EXISTS customs_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(255) NOT NULL,
    company VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    specialization VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    current_workload INTEGER NOT NULL DEFAULT 0,
    max_concurrent_reviews INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customs_clearances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id),
    driver_id UUID NOT NULL REFERENCES driver_profiles(driver_id),
    unit_id UUID REFERENCES unit_profiles(unit_id),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_DOCS',
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    border_crossing_point VARCHAR(255) NOT NULL,
    crossing_direction VARCHAR(50) NOT NULL,
    estimated_crossing_time TIMESTAMPTZ,
    actual_crossing_time TIMESTAMPTZ,
    required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    submitted_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    assigned_agent_id UUID REFERENCES customs_agents(id),
    agent_name VARCHAR(255),
    review_started_at TIMESTAMPTZ,
    review_completed_at TIMESTAMPTZ,
    review_notes TEXT,
    rejection_reason TEXT,
    flagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    docs_submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    cleared_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customs_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clearance_id UUID NOT NULL REFERENCES customs_clearances(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(1000),
    file_size_kb INTEGER,
    file_type VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'UPLOADED',
    verification_notes TEXT,
    uploaded_by VARCHAR(100),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_by VARCHAR(255),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customs_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clearance_id UUID NOT NULL REFERENCES customs_clearances(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    actor VARCHAR(255),
    actor_type VARCHAR(50),
    details JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customs_status ON customs_clearances(status);
CREATE INDEX IF NOT EXISTS idx_customs_trip ON customs_clearances(trip_id);
CREATE INDEX IF NOT EXISTS idx_customs_agent ON customs_clearances(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_customs_crossing_time ON customs_clearances(estimated_crossing_time);

CREATE INDEX IF NOT EXISTS idx_customs_docs_clearance ON customs_documents(clearance_id);
CREATE INDEX IF NOT EXISTS idx_customs_docs_type ON customs_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_customs_agents_active ON customs_agents(is_active, current_workload);

CREATE INDEX IF NOT EXISTS idx_customs_log_clearance ON customs_activity_log(clearance_id);
CREATE INDEX IF NOT EXISTS idx_customs_log_created ON customs_activity_log(created_at DESC);

CREATE TRIGGER trg_customs_clearances_updated
BEFORE UPDATE ON customs_clearances
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_customs_agents_updated
BEFORE UPDATE ON customs_agents
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
