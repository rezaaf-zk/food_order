-- ============================================================================
-- MIGRATION 3: Row Level Security (RLS) Policies
-- Multi-Branch Food Ordering System with BOM Inventory & Sales Monitoring
-- Reference: ANTIGRAVITY_FOOD_ORDER_MASTER_SPEC.md (Chapters 22, 23)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENABLE RLS ON ALL PUBLIC TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. SECURITY HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Helper: Get current authenticated user's role from public.profiles
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.profiles
    WHERE auth_user_id = auth.uid() OR id = auth.uid()
    LIMIT 1;

    RETURN COALESCE(v_role, 'customer');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper: Get current authenticated user's assigned branch_id
CREATE OR REPLACE FUNCTION public.get_auth_branch_id()
RETURNS UUID AS $$
DECLARE
    v_branch_id UUID;
BEGIN
    SELECT branch_id INTO v_branch_id
    FROM public.profiles
    WHERE auth_user_id = auth.uid() OR id = auth.uid()
    LIMIT 1;

    RETURN v_branch_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper: Check if user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_auth_role() IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper: Check if user is staff, branch_manager, admin, or super_admin
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_auth_role() IN ('staff', 'branch_manager', 'admin', 'super_admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3. PROFILES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Public profiles are readable by self and admins"
ON public.profiles FOR SELECT
USING (
    auth.uid() = auth_user_id 
    OR auth.uid() = id 
    OR public.is_admin()
    OR (public.is_staff_or_admin() AND branch_id = public.get_auth_branch_id())
);

CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
WITH CHECK (
    auth.uid() = auth_user_id 
    OR auth.uid() = id 
    OR auth.uid() IS NULL -- allows onboarding/guest profile creation
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = auth_user_id OR auth.uid() = id OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. BRANCHES POLICIES
-- ----------------------------------------------------------------------------
-- Customers & public can view active branches
CREATE POLICY "Active branches are viewable by everyone"
ON public.branches FOR SELECT
USING (is_active = TRUE OR public.is_staff_or_admin());

-- Admins can create/edit branches
CREATE POLICY "Admins can manage branches"
ON public.branches FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. CATEGORIES & PRODUCTS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Active categories viewable by everyone"
ON public.categories FOR SELECT
USING (is_active = TRUE OR public.is_staff_or_admin());

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Active products viewable by everyone"
ON public.products FOR SELECT
USING (is_active = TRUE OR public.is_staff_or_admin());

CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. BRANCH_PRODUCTS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Available branch products viewable by everyone"
ON public.branch_products FOR SELECT
USING (available = TRUE OR public.is_staff_or_admin());

CREATE POLICY "Branch managers and admins can manage branch products"
ON public.branch_products FOR ALL
USING (
    public.is_admin() 
    OR (public.get_auth_role() = 'branch_manager' AND branch_id = public.get_auth_branch_id())
);

-- ----------------------------------------------------------------------------
-- 7. INGREDIENTS & RECIPES POLICIES
-- ----------------------------------------------------------------------------
-- Staff and Admins can view and manage ingredients
CREATE POLICY "Staff and Admins can view ingredients"
ON public.ingredients FOR SELECT
USING (public.is_staff_or_admin());

CREATE POLICY "Admins can manage ingredients"
ON public.ingredients FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Staff and Admins can view recipes"
ON public.product_recipes FOR SELECT
USING (public.is_staff_or_admin());

CREATE POLICY "Admins can manage recipes"
ON public.product_recipes FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Staff and Admins can view recipe items"
ON public.recipe_items FOR SELECT
USING (public.is_staff_or_admin());

CREATE POLICY "Admins can manage recipe items"
ON public.recipe_items FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8. BRANCH INVENTORY & STOCK MOVEMENTS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Branch inventory viewable by branch staff and admins"
ON public.branch_inventory FOR SELECT
USING (
    public.is_admin()
    OR (public.is_staff_or_admin() AND branch_id = public.get_auth_branch_id())
);

CREATE POLICY "Branch inventory updatable by branch staff and admins"
ON public.branch_inventory FOR ALL
USING (
    public.is_admin()
    OR (public.is_staff_or_admin() AND branch_id = public.get_auth_branch_id())
);

CREATE POLICY "Stock movements viewable by branch staff and admins"
ON public.stock_movements FOR SELECT
USING (
    public.is_admin()
    OR (public.is_staff_or_admin() AND branch_id = public.get_auth_branch_id())
);

CREATE POLICY "Stock movements insertable by branch staff and admins"
ON public.stock_movements FOR INSERT
WITH CHECK (
    public.is_admin()
    OR (public.is_staff_or_admin() AND branch_id = public.get_auth_branch_id())
);

-- ----------------------------------------------------------------------------
-- 9. SUPPLIERS & PURCHASES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Purchases viewable by staff and admins"
ON public.purchase_receipts FOR SELECT
USING (
    public.is_admin()
    OR (public.is_staff_or_admin() AND branch_id = public.get_auth_branch_id())
);

CREATE POLICY "Purchases manageable by staff and admins"
ON public.purchase_receipts FOR ALL
USING (
    public.is_admin()
    OR (public.is_staff_or_admin() AND branch_id = public.get_auth_branch_id())
);

CREATE POLICY "Purchase items viewable by staff and admins"
ON public.purchase_items FOR SELECT
USING (public.is_staff_or_admin());

CREATE POLICY "Purchase items manageable by staff and admins"
ON public.purchase_items FOR ALL
USING (public.is_staff_or_admin());

CREATE POLICY "Suppliers viewable by staff and admins"
ON public.suppliers FOR SELECT
USING (public.is_staff_or_admin());

CREATE POLICY "Suppliers manageable by admins"
ON public.suppliers FOR ALL
USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 10. ORDERS & ORDER ITEMS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Orders viewable by creator, branch staff, and admins"
ON public.orders FOR SELECT
USING (
    user_id = auth.uid()
    OR (auth.uid() IS NULL AND idempotency_key IS NOT NULL) -- for guest checkout tracking
    OR public.is_admin()
    OR (public.is_staff_or_admin() AND branch_id = public.get_auth_branch_id())
);

CREATE POLICY "Orders insertable by customer and staff"
ON public.orders FOR INSERT
WITH CHECK (TRUE); -- validated atomically via stored procedures/checks

CREATE POLICY "Orders updatable by branch staff and admins"
ON public.orders FOR UPDATE
USING (
    public.is_admin()
    OR (public.is_staff_or_admin() AND branch_id = public.get_auth_branch_id())
);

CREATE POLICY "Order items viewable with order"
ON public.order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
          AND (
              o.user_id = auth.uid()
              OR public.is_admin()
              OR (public.is_staff_or_admin() AND o.branch_id = public.get_auth_branch_id())
          )
    )
);

CREATE POLICY "Order items insertable by everyone"
ON public.order_items FOR INSERT
WITH CHECK (TRUE);

-- ----------------------------------------------------------------------------
-- 11. PAYMENTS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Payments viewable by order owner and admins"
ON public.payments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = payments.order_id
          AND (
              o.user_id = auth.uid()
              OR public.is_admin()
              OR (public.is_staff_or_admin() AND o.branch_id = public.get_auth_branch_id())
          )
    )
);

CREATE POLICY "Payments manageable by system and admins"
ON public.payments FOR ALL
USING (public.is_admin() OR auth.uid() IS NOT NULL);

-- ----------------------------------------------------------------------------
-- 12. AUDIT LOGS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Audit logs only viewable by admins"
ON public.audit_logs FOR SELECT
USING (public.is_admin());

CREATE POLICY "Audit logs insertable by system"
ON public.audit_logs FOR INSERT
WITH CHECK (TRUE);
