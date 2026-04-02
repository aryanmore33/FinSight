const pool = require('./pool');

// Initialize connection pool

const query = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- ENUM TYPES
-- =========================

CREATE TYPE user_role AS ENUM ('viewer','analyst','admin');
CREATE TYPE record_type AS ENUM ('income','expense');
CREATE TYPE budget_period AS ENUM ('monthly','weekly');

-- =========================
-- USERS
-- =========================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- CATEGORIES
-- =========================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type record_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name,type)
);

-- =========================
-- FINANCIAL RECORDS
-- =========================

CREATE TABLE financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),

    type record_type NOT NULL,

    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

    transaction_date DATE NOT NULL,

    notes TEXT,

    is_deleted BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- BUDGETS
-- =========================

CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,

    limit_amount NUMERIC(12,2) NOT NULL CHECK (limit_amount > 0),

    period budget_period DEFAULT 'monthly',

    start_date DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, category_id, period)
);

-- =========================
-- INDEXES
-- =========================

CREATE INDEX idx_records_user ON financial_records(user_id);
CREATE INDEX idx_records_type ON financial_records(type);
CREATE INDEX idx_records_date ON financial_records(transaction_date);
CREATE INDEX idx_records_category ON financial_records(category_id);
CREATE INDEX idx_records_not_deleted ON financial_records(is_deleted);

CREATE INDEX idx_budgets_user ON budgets(user_id);
CREATE INDEX idx_budgets_category ON budgets(category_id);

-- =========================
-- UPDATE TRIGGER FUNCTION
-- =========================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- TRIGGERS
-- =========================

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_records_updated
BEFORE UPDATE ON financial_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_budgets_updated
BEFORE UPDATE ON budgets
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;

// Function to initialize the database schema
async function initializeDB() {
    try {
        const result = await pool.query(query);
        console.log(`Successfully Completed`);
    } catch (error) {
        console.log(error);
    }
}
initializeDB();
