
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 1. PROFILES (Users & Roles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- references auth.users(id) when Supabase Auth is active
    username TEXT UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'branch_manager', 'admin', 'super_admin')),
    branch_id UUID, -- NULL for customer and super_admin; assigned branch for staff/branch_manager
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 2. BRANCHES (Multi-Branch Outlets)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Surabaya',
    province TEXT NOT NULL DEFAULT 'Jawa Timur',
    postal_code TEXT,
    latitude NUMERIC(10,7) NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude NUMERIC(10,7) NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_branches_updated_at
BEFORE UPDATE ON public.branches
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Foreign key for profiles.branch_id -> branches.id
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS fk_profiles_branch,
    ADD CONSTRAINT fk_profiles_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 3. CATEGORIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. PRODUCTS (Central Product Master)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    base_price NUMERIC(14,2) NOT NULL CHECK (base_price >= 0),
    has_spiciness_level BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5. BRANCH_PRODUCTS (Product Availability & Custom Pricing per Branch)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branch_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    price NUMERIC(14,2) CHECK (price IS NULL OR price >= 0), -- Override price if set, else fallback to products.base_price
    available BOOLEAN NOT NULL DEFAULT TRUE,
    max_per_order INTEGER CHECK (max_per_order IS NULL OR max_per_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(branch_id, product_id)
);

CREATE TRIGGER set_branch_products_updated_at
BEFORE UPDATE ON public.branch_products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 6. INGREDIENTS (Raw Materials Catalog)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL CHECK (unit IN ('gram', 'kilogram', 'milliliter', 'liter', 'piece', 'pack', 'bottle', 'box')),
    minimum_stock NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    maximum_stock NUMERIC(14,3) CHECK (maximum_stock IS NULL OR maximum_stock >= minimum_stock),
    cost_per_unit NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (cost_per_unit >= 0),
    current_global_info TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_ingredients_updated_at
BEFORE UPDATE ON public.ingredients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 7. BRANCH_INVENTORY (Raw Materials Stock per Branch)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branch_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    minimum_stock NUMERIC(14,3) CHECK (minimum_stock IS NULL OR minimum_stock >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(branch_id, ingredient_id)
);

CREATE TRIGGER set_branch_inventory_updated_at
BEFORE UPDATE ON public.branch_inventory
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 8. PRODUCT_RECIPES (Bill of Materials / BOM Header)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. RECIPE_ITEMS (Bill of Materials / BOM Line Items)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES public.product_recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
    quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL,
    spiciness_multiplier NUMERIC(5,2) DEFAULT 0 CHECK (spiciness_multiplier >= 0), -- Added consumption per spice level if applicable
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(recipe_id, ingredient_id)
);

-- ----------------------------------------------------------------------------
-- 10. STOCK_MOVEMENTS (Immutable Inventory Mutation Log)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN (
        'opening_balance',
        'purchase',
        'sale',
        'adjustment_in',
        'adjustment_out',
        'spoilage',
        'damaged',
        'return',
        'correction'
    )),
    quantity NUMERIC(14,3) NOT NULL, -- Positive for in, negative for out
    quantity_before NUMERIC(14,3),
    quantity_after NUMERIC(14,3),
    reference_type TEXT, -- e.g. 'order', 'purchase_receipt', 'manual_adjustment'
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. SUPPLIERS & PURCHASES (Optional/Supporting)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    invoice_number TEXT,
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('draft', 'pending', 'received', 'cancelled')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES public.purchase_receipts(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
    quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(14,2) NOT NULL CHECK (unit_cost >= 0),
    subtotal NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0)
);

-- ----------------------------------------------------------------------------
-- 12. ORDERS (Master Transaction)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    discount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    tax NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    delivery_fee NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired', 'refunded')),
    order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
    order_type TEXT NOT NULL DEFAULT 'pickup' CHECK (order_type IN ('pickup', 'dine_in', 'delivery')),
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'stripe', 'qris', 'transfer')),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_note TEXT,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 13. ORDER_ITEMS (Transaction Line Items with Snapshots)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0),
    spiciness_level INTEGER DEFAULT NULL CHECK (spiciness_level IS NULL OR (spiciness_level >= 1 AND spiciness_level <= 10)),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 14. PAYMENTS (Gateway Payment Records)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- e.g. 'stripe', 'qris', 'cash'
    provider_payment_id TEXT, -- Stripe payment intent ID
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'IDR',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'refunded')),
    paid_at TIMESTAMPTZ,
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 15. AUDIT_LOGS (Managerial Activity Audit Trail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON public.branches(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON public.products(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_branch_products_branch ON public.branch_products(branch_id, available);
CREATE INDEX IF NOT EXISTS idx_branch_inventory_branch_ingredient ON public.branch_inventory(branch_id, ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe ON public.recipe_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_product_recipes_product_active ON public.product_recipes(product_id, is_active);
CREATE INDEX IF NOT EXISTS idx_stock_movements_branch_ingredient_created ON public.stock_movements(branch_id, ingredient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_branch_created ON public.orders(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
