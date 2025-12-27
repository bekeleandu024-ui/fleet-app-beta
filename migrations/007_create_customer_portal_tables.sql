-- Customer Portal System
-- Complete database schema for self-service customer portal

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Customer users table: Manage customer portal logins
CREATE TABLE IF NOT EXISTS customer_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL, -- References existing customer
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'viewer', 'billing', 'dispatcher')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_users_customer_id ON customer_users(customer_id);
CREATE INDEX idx_customer_users_email ON customer_users(email) WHERE is_active = TRUE;
CREATE INDEX idx_customer_users_role ON customer_users(role);

-- Customer notifications table: Track notifications sent to customers
CREATE TABLE IF NOT EXISTS customer_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    customer_user_id UUID REFERENCES customer_users(id) ON DELETE SET NULL,
    order_id UUID,
    trip_id UUID,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'order_created', 'order_dispatched', 'pickup_arrived', 'pickup_completed',
        'in_transit', 'delivery_arrived', 'delivered', 'exception', 'invoice_ready',
        'payment_received', 'delay_alert', 'eta_update'
    )),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'portal')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    read_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivery_status VARCHAR(20) DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'failed', 'bounced')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_notifications_customer ON customer_notifications(customer_id);
CREATE INDEX idx_customer_notifications_user ON customer_notifications(customer_user_id) WHERE read_at IS NULL;
CREATE INDEX idx_customer_notifications_order ON customer_notifications(order_id);
CREATE INDEX idx_customer_notifications_type ON customer_notifications(notification_type);
CREATE INDEX idx_customer_notifications_sent_at ON customer_notifications(sent_at DESC);

-- Tracking shares table: Generate shareable tracking links
CREATE TABLE IF NOT EXISTS tracking_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    trip_id UUID,
    share_token VARCHAR(64) NOT NULL UNIQUE,
    share_type VARCHAR(20) DEFAULT 'public' CHECK (share_type IN ('public', 'password_protected', 'single_use')),
    password_hash TEXT,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES customer_users(id) ON DELETE SET NULL,
    created_by_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,
    allowed_ips JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tracking_shares_token ON tracking_shares(share_token) WHERE is_active = TRUE;
CREATE INDEX idx_tracking_shares_order ON tracking_shares(order_id);
CREATE INDEX idx_tracking_shares_expires ON tracking_shares(expires_at);

-- Customer preferences table: Store notification and display preferences
CREATE TABLE IF NOT EXISTS customer_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Notification settings
    notification_settings JSONB NOT NULL DEFAULT '{
        "email": {
            "order_updates": true,
            "delivery_confirmation": true,
            "exceptions": true,
            "invoices": true,
            "eta_changes": true
        },
        "sms": {
            "delivery_confirmation": true,
            "exceptions": true,
            "eta_changes": false
        },
        "push": {
            "all_updates": true
        }
    }'::jsonb,
    
    -- Display preferences
    default_pickup_instructions TEXT,
    default_delivery_instructions TEXT,
    default_commodity VARCHAR(255),
    preferred_service_level VARCHAR(50),
    
    -- Contact preferences
    primary_contact_name VARCHAR(255),
    primary_contact_phone VARCHAR(50),
    primary_contact_email VARCHAR(255),
    billing_contact_name VARCHAR(255),
    billing_contact_email VARCHAR(255),
    
    -- Portal customization
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    timezone VARCHAR(50) DEFAULT 'America/Toronto',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_preferences_customer ON customer_preferences(customer_id);

-- Customer API keys table: For programmatic access
CREATE TABLE IF NOT EXISTS customer_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    api_secret_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '["read"]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    rate_limit INTEGER DEFAULT 1000, -- requests per hour
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES customer_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_api_keys_key ON customer_api_keys(api_key) WHERE is_active = TRUE;
CREATE INDEX idx_customer_api_keys_customer ON customer_api_keys(customer_id);

-- Customer audit log: Track all customer portal activities
CREATE TABLE IF NOT EXISTS customer_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    customer_user_id UUID REFERENCES customer_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_audit_customer ON customer_audit_log(customer_id);
CREATE INDEX idx_customer_audit_user ON customer_audit_log(customer_user_id);
CREATE INDEX idx_customer_audit_timestamp ON customer_audit_log(timestamp DESC);
CREATE INDEX idx_customer_audit_action ON customer_audit_log(action);

-- Customer sessions table: Track active sessions
CREATE TABLE IF NOT EXISTS customer_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_user_id UUID NOT NULL REFERENCES customer_users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT UNIQUE,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    refresh_expires_at TIMESTAMPTZ,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_sessions_user ON customer_sessions(customer_user_id);
CREATE INDEX idx_customer_sessions_token ON customer_sessions(session_token);
CREATE INDEX idx_customer_sessions_expires ON customer_sessions(expires_at);

-- Customer saved filters: Save custom filters for order lists
CREATE TABLE IF NOT EXISTS customer_saved_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_user_id UUID NOT NULL REFERENCES customer_users(id) ON DELETE CASCADE,
    filter_name VARCHAR(255) NOT NULL,
    filter_config JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_saved_filters_user ON customer_saved_filters(customer_user_id);

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_customer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_users_updated_at
    BEFORE UPDATE ON customer_users
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_updated_at();

CREATE TRIGGER update_customer_preferences_updated_at
    BEFORE UPDATE ON customer_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_updated_at();

CREATE TRIGGER update_customer_api_keys_updated_at
    BEFORE UPDATE ON customer_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_updated_at();

-- Helper views
CREATE OR REPLACE VIEW customer_dashboard_stats AS
SELECT 
    o.customer_id,
    COUNT(DISTINCT o.id) AS total_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'In Transit' THEN o.id END) AS in_transit_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'Delivered' THEN o.id END) AS delivered_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'Exception' THEN o.id END) AS exception_orders,
    COUNT(DISTINCT t.id) AS total_trips,
    COALESCE(AVG(EXTRACT(EPOCH FROM (t.delivery_arrival - t.pickup_departure))/3600), 0) AS avg_transit_hours
FROM orders o
LEFT JOIN trips t ON t.order_id = o.id
GROUP BY o.customer_id;

COMMENT ON TABLE customer_users IS 'Customer portal user accounts with role-based access';
COMMENT ON TABLE customer_notifications IS 'Notification history for customer communications';
COMMENT ON TABLE tracking_shares IS 'Shareable tracking links for public access';
COMMENT ON TABLE customer_preferences IS 'Customer-specific preferences and settings';
COMMENT ON TABLE customer_api_keys IS 'API keys for programmatic customer access';
COMMENT ON TABLE customer_audit_log IS 'Audit trail for customer portal activities';
COMMENT ON TABLE customer_sessions IS 'Active customer user sessions with JWT tokens';
