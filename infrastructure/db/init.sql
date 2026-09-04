-- ====================================================
-- DeepAudit AI - Database Schema (PostgreSQL)
-- ====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations
CREATE TABLE organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(8) DEFAULT 'INR',
    risk_tolerance VARCHAR(32) DEFAULT 'MODERATE',
    max_single_tx_amount NUMERIC(15, 2) DEFAULT 500000.00,
    dual_control_threshold NUMERIC(15, 2) DEFAULT 100000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('MAKER', 'CHECKER', 'ADMIN', 'AUDITOR')),
    phone VARCHAR(32),
    is_passkey_enrolled BOOLEAN DEFAULT FALSE,
    passkey_credential_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Beneficiaries (Payees)
CREATE TABLE beneficiaries (
    id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    account_number VARCHAR(64) NOT NULL,
    ifsc_code VARCHAR(32) NOT NULL,
    bank_name VARCHAR(128) NOT NULL,
    upi_id VARCHAR(128),
    category VARCHAR(32) DEFAULT 'VENDOR' CHECK (category IN ('VENDOR', 'PAYROLL', 'UTILITY', 'TAX', 'INDIVIDUAL')),
    status VARCHAR(32) DEFAULT 'NEW_COOLING_PERIOD' CHECK (status IN ('VERIFIED', 'UNDER_REVIEW', 'FLAGGED', 'NEW_COOLING_PERIOD')),
    cooling_period_expires_at TIMESTAMP WITH TIME ZONE,
    total_payments_volume NUMERIC(15, 2) DEFAULT 0.00,
    payment_count INTEGER DEFAULT 0,
    last_payment_date TIMESTAMP WITH TIME ZONE,
    risk_rating VARCHAR(16) DEFAULT 'LOW' CHECK (risk_rating IN ('LOW', 'MEDIUM', 'HIGH')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Payments
CREATE TABLE payments (
    id VARCHAR(64) PRIMARY KEY,
    reference_number VARCHAR(64) UNIQUE NOT NULL,
    org_id VARCHAR(64) REFERENCES organizations(id) ON DELETE CASCADE,
    creator_id VARCHAR(64) REFERENCES users(id),
    beneficiary_id VARCHAR(64) REFERENCES beneficiaries(id),
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(8) DEFAULT 'INR',
    method VARCHAR(32) NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(32) NOT NULL,
    gateway VARCHAR(64) NOT NULL,
    region VARCHAR(64) NOT NULL,
    failure_reason TEXT,
    device_fingerprint VARCHAR(128),
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Risk Assessments
CREATE TABLE risk_assessments (
    id VARCHAR(64) PRIMARY KEY,
    payment_id VARCHAR(64) REFERENCES payments(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    risk_level VARCHAR(16) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    action_required VARCHAR(32) NOT NULL,
    ai_explanation TEXT,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Risk Signals
CREATE TABLE risk_signals (
    id VARCHAR(64) PRIMARY KEY,
    risk_assessment_id VARCHAR(64) REFERENCES risk_assessments(id) ON DELETE CASCADE,
    signal_type VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    weight INTEGER NOT NULL,
    score_contribution INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- 7. Authorizations
CREATE TABLE authorizations (
    id VARCHAR(64) PRIMARY KEY,
    payment_id VARCHAR(64) REFERENCES payments(id) ON DELETE CASCADE,
    requires_step_up BOOLEAN DEFAULT FALSE,
    step_up_method VARCHAR(32),
    step_up_status VARCHAR(32) DEFAULT 'NOT_REQUIRED',
    step_up_verified_at TIMESTAMP WITH TIME ZONE,
    is_fully_authorized BOOLEAN DEFAULT FALSE,
    final_decision VARCHAR(32) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Approvals (Dual-Control Steps)
CREATE TABLE approvals (
    id VARCHAR(64) PRIMARY KEY,
    authorization_id VARCHAR(64) REFERENCES authorizations(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    required_role VARCHAR(32) NOT NULL,
    approved_by_user_id VARCHAR(64) REFERENCES users(id),
    status VARCHAR(32) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    comments TEXT,
    action_timestamp TIMESTAMP WITH TIME ZONE
);

-- 9. Audit Events (Append-Only Cryptographic Chain)
CREATE TABLE audit_events (
    id VARCHAR(64) PRIMARY KEY,
    sequence_number BIGSERIAL UNIQUE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    target_entity VARCHAR(32) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    org_id VARCHAR(64) NOT NULL,
    summary TEXT NOT NULL,
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    immutable_hash VARCHAR(64) NOT NULL,
    previous_hash VARCHAR(64) NOT NULL
);

-- 10. Voice & Agent Sessions
CREATE TABLE voice_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id),
    language_code VARCHAR(16) DEFAULT 'en-IN',
    status VARCHAR(32) DEFAULT 'IDLE',
    last_transcript TEXT,
    last_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_payments_org_id ON payments(org_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_beneficiary ON payments(beneficiary_id);
CREATE INDEX idx_risk_assessments_payment ON risk_assessments(payment_id);
CREATE INDEX idx_audit_events_target ON audit_events(target_id);
CREATE INDEX idx_audit_events_seq ON audit_events(sequence_number);
