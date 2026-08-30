-- ============================================================================
-- MIGRATION 2: Stored Procedures & Transactional RPC Functions
-- Multi-Branch Food Ordering System with BOM Inventory & Sales Monitoring
-- Reference: ANTIGRAVITY_FOOD_ORDER_MASTER_SPEC.md (Chapters 8, 13, 15, 35, 50)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. GET NEAREST BRANCHES (Haversine Formula)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_nearest_branches(
    user_lat NUMERIC,
    user_lon NUMERIC,
    max_distance_km NUMERIC DEFAULT 100.0,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    code TEXT,
    name TEXT,
    address TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    phone TEXT,
    is_active BOOLEAN,
    distance_km NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.code,
        b.name,
        b.address,
        b.city,
        b.province,
        b.postal_code,
        b.latitude,
        b.longitude,
        b.phone,
        b.is_active,
        ROUND(
            (
                6371.0 * 2.0 * ASIN(
                    SQRT(
                        POWER(SIN(RADIANS(b.latitude - user_lat) / 2.0), 2) +
                        COS(RADIANS(user_lat)) * COS(RADIANS(b.latitude)) *
                        POWER(SIN(RADIANS(b.longitude - user_lon) / 2.0), 2)
                    )
                )
            )::NUMERIC,
            2
        ) AS distance_km
    FROM public.branches b
    WHERE b.is_active = TRUE
      AND (
          6371.0 * 2.0 * ASIN(
              SQRT(
                  POWER(SIN(RADIANS(b.latitude - user_lat) / 2.0), 2) +
                  COS(RADIANS(user_lat)) * COS(RADIANS(b.latitude)) *
                  POWER(SIN(RADIANS(b.longitude - user_lon) / 2.0), 2)
              )
          )
      ) <= max_distance_km
    ORDER BY distance_km ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 2. CREATE ORDER TRANSACTION (Atomic BOM Stock Deduction & Idempotency)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order_transaction(
    p_order JSONB,
    p_items JSONB,
    p_created_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_branch_id UUID;
    v_branch_active BOOLEAN;
    v_order_id UUID;
    v_order_number TEXT;
    v_item JSONB;
    v_product_id UUID;
    v_product_name TEXT;
    v_unit_price NUMERIC(14,2);
    v_quantity INTEGER;
    v_spiciness INTEGER;
    v_item_subtotal NUMERIC(14,2);
    v_notes TEXT;
    v_recipe_id UUID;
    v_rec_item RECORD;
    v_ingredient_needed NUMERIC(14,3);
    v_available_stock NUMERIC(14,3);
    v_ing_name TEXT;
    v_before_qty NUMERIC(14,3);
    v_after_qty NUMERIC(14,3);
    v_idempotency_key TEXT;
    v_existing_order JSONB;
    v_total_calculated NUMERIC(14,2) := 0;
    
    -- Temporary table to accumulate total required ingredients across all items
    -- in case multiple products use the same raw material (e.g. sugar in 2 drinks)
BEGIN
    v_branch_id := (p_order->>'branch_id')::UUID;
    v_idempotency_key := p_order->>'idempotency_key';

    -- 1. Idempotency check: if order with this key already exists, return it immediately
    IF v_idempotency_key IS NOT NULL AND v_idempotency_key <> '' THEN
        SELECT row_to_json(o)::JSONB INTO v_existing_order
        FROM public.orders o
        WHERE o.idempotency_key = v_idempotency_key;
        
        IF v_existing_order IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', true,
                'order', v_existing_order,
                'message', 'Order already processed (idempotent response)'
            );
        END IF;
    END IF;

    -- 2. Validate Branch
    SELECT is_active INTO v_branch_active FROM public.branches WHERE id = v_branch_id;
    IF v_branch_active IS NULL OR v_branch_active = FALSE THEN
        RAISE EXCEPTION 'Cabang tujuan tidak ditemukan atau sedang tidak aktif.';
    END IF;

    -- 3. Prepare temporary aggregation table for ingredients
    CREATE TEMP TABLE tmp_required_ingredients (
        ingredient_id UUID PRIMARY KEY,
        ingredient_name TEXT,
        required_qty NUMERIC(14,3)
    ) ON COMMIT DROP;

    -- 4. Calculate total required raw materials across all ordered items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;
        v_spiciness := COALESCE((v_item->>'spiciness_level')::INTEGER, 0);

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Kuantitas produk harus lebih besar dari 0.';
        END IF;

        -- Find active recipe for the product
        SELECT id INTO v_recipe_id
        FROM public.product_recipes
        WHERE product_id = v_product_id AND is_active = TRUE
        ORDER BY version DESC
        LIMIT 1;

        IF v_recipe_id IS NOT NULL THEN
            FOR v_rec_item IN 
                SELECT ri.ingredient_id, ri.quantity, ri.spiciness_multiplier, ing.name AS ingredient_name
                FROM public.recipe_items ri
                JOIN public.ingredients ing ON ing.id = ri.ingredient_id
                WHERE ri.recipe_id = v_recipe_id
            LOOP
                -- Base quantity per item + extra spiciness multiplier
                v_ingredient_needed := (v_rec_item.quantity * v_quantity) + 
                    (COALESCE(v_rec_item.spiciness_multiplier, 0) * v_spiciness * v_quantity);

                INSERT INTO tmp_required_ingredients (ingredient_id, ingredient_name, required_qty)
                VALUES (v_rec_item.ingredient_id, v_rec_item.ingredient_name, v_ingredient_needed)
                ON CONFLICT (ingredient_id) 
                DO UPDATE SET required_qty = tmp_required_ingredients.required_qty + EXCLUDED.required_qty;
            END LOOP;
        END IF;
    END LOOP;

    -- 5. Strict Overselling Check: verify branch inventory for all accumulated ingredients
    FOR v_rec_item IN SELECT * FROM tmp_required_ingredients
    LOOP
        SELECT (quantity - reserved_quantity) INTO v_available_stock
        FROM public.branch_inventory
        WHERE branch_id = v_branch_id AND ingredient_id = v_rec_item.ingredient_id;

        IF v_available_stock IS NULL OR v_available_stock < v_rec_item.required_qty THEN
            RAISE EXCEPTION 'Stok bahan baku "%" tidak mencukupi di cabang ini. Tersedia: %, Dibutuhkan: %',
                v_rec_item.ingredient_name,
                COALESCE(v_available_stock, 0),
                v_rec_item.required_qty;
        END IF;
    END LOOP;

    -- 6. Generate order number if not given
    v_order_number := COALESCE(
        p_order->>'order_number',
        'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
    );

    -- 7. Insert into orders table
    INSERT INTO public.orders (
        order_number,
        user_id,
        branch_id,
        subtotal,
        discount,
        tax,
        delivery_fee,
        total,
        payment_status,
        order_status,
        order_type,
        payment_method,
        customer_name,
        customer_phone,
        customer_note,
        latitude,
        longitude,
        idempotency_key
    ) VALUES (
        v_order_number,
        (p_order->>'user_id')::UUID,
        v_branch_id,
        COALESCE((p_order->>'subtotal')::NUMERIC, 0),
        COALESCE((p_order->>'discount')::NUMERIC, 0),
        COALESCE((p_order->>'tax')::NUMERIC, 0),
        COALESCE((p_order->>'delivery_fee')::NUMERIC, 0),
        COALESCE((p_order->>'total')::NUMERIC, 0),
        COALESCE(p_order->>'payment_status', 'pending'),
        COALESCE(p_order->>'order_status', 'pending'),
        COALESCE(p_order->>'order_type', 'pickup'),
        COALESCE(p_order->>'payment_method', 'cash'),
        COALESCE(p_order->>'customer_name', 'Customer'),
        p_order->>'customer_phone',
        p_order->>'customer_note',
        (p_order->>'latitude')::NUMERIC,
        (p_order->>'longitude')::NUMERIC,
        v_idempotency_key
    ) RETURNING id INTO v_order_id;

    -- 8. Insert order items with immutable snapshots
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;
        v_unit_price := (v_item->>'unit_price')::NUMERIC;
        v_item_subtotal := COALESCE((v_item->>'subtotal')::NUMERIC, v_unit_price * v_quantity);
        v_product_name := COALESCE(v_item->>'product_name_snapshot', v_item->>'name', 'Produk');
        v_spiciness := (v_item->>'spiciness_level')::INTEGER;
        v_notes := v_item->>'notes';

        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name_snapshot,
            unit_price,
            quantity,
            subtotal,
            spiciness_level,
            notes
        ) VALUES (
            v_order_id,
            v_product_id,
            v_product_name,
            v_unit_price,
            v_quantity,
            v_item_subtotal,
            v_spiciness,
            v_notes
        );
    END LOOP;

    -- 9. Automatically Deduct Inventory & Create Stock Movement Log
    FOR v_rec_item IN SELECT * FROM tmp_required_ingredients
    LOOP
        -- Atomic stock decrement returning before/after states
        UPDATE public.branch_inventory
        SET quantity = quantity - v_rec_item.required_qty,
            updated_at = NOW()
        WHERE branch_id = v_branch_id AND ingredient_id = v_rec_item.ingredient_id
        RETURNING (quantity + v_rec_item.required_qty), quantity INTO v_before_qty, v_after_qty;

        -- Record movement log
        INSERT INTO public.stock_movements (
            branch_id,
            ingredient_id,
            type,
            quantity,
            quantity_before,
            quantity_after,
            reference_type,
            reference_id,
            notes,
            created_by
        ) VALUES (
            v_branch_id,
            v_rec_item.ingredient_id,
            'sale',
            -v_rec_item.required_qty,
            v_before_qty,
            v_after_qty,
            'order',
            v_order_id,
            'Pengurangan otomatis order #' || v_order_number,
            p_created_by
        );
    END LOOP;

    -- 10. Record payment if provided
    IF p_order->>'payment_intent_id' IS NOT NULL THEN
        INSERT INTO public.payments (
            order_id,
            provider,
            provider_payment_id,
            amount,
            currency,
            status,
            paid_at
        ) VALUES (
            v_order_id,
            COALESCE(p_order->>'payment_method', 'stripe'),
            p_order->>'payment_intent_id',
            COALESCE((p_order->>'total')::NUMERIC, 0),
            'IDR',
            CASE WHEN p_order->>'payment_status' = 'paid' THEN 'paid' ELSE 'pending' END,
            CASE WHEN p_order->>'payment_status' = 'paid' THEN NOW() ELSE NULL END
        );
    END IF;

    -- 11. Return full created order
    SELECT row_to_json(o)::JSONB INTO v_existing_order
    FROM public.orders o
    WHERE o.id = v_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'order', v_existing_order
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3. GET SALES SUMMARY (Reporting & KPIs)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_sales_summary(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_revenue NUMERIC,
    total_orders BIGINT,
    total_items_sold BIGINT,
    average_order_value NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(o.total), 0)::NUMERIC AS total_revenue,
        COUNT(DISTINCT o.id)::BIGINT AS total_orders,
        COALESCE(SUM(oi.quantity), 0)::BIGINT AS total_items_sold,
        CASE 
            WHEN COUNT(DISTINCT o.id) > 0 THEN ROUND(COALESCE(SUM(o.total), 0) / COUNT(DISTINCT o.id), 2)
            ELSE 0
        END AS average_order_value
    FROM public.orders o
    LEFT JOIN public.order_items oi ON oi.order_id = o.id
    WHERE (p_branch_id IS NULL OR o.branch_id = p_branch_id)
      AND o.created_at >= p_start_date
      AND o.created_at <= p_end_date
      AND o.payment_status = 'paid'
      AND o.order_status <> 'cancelled';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 4. GET TOP PRODUCTS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_top_products(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_branch_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    quantity_sold BIGINT,
    total_sales NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        oi.product_id,
        oi.product_name_snapshot AS product_name,
        SUM(oi.quantity)::BIGINT AS quantity_sold,
        SUM(oi.subtotal)::NUMERIC AS total_sales
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE (p_branch_id IS NULL OR o.branch_id = p_branch_id)
      AND o.created_at >= p_start_date
      AND o.created_at <= p_end_date
      AND o.payment_status = 'paid'
      AND o.order_status <> 'cancelled'
    GROUP BY oi.product_id, oi.product_name_snapshot
    ORDER BY quantity_sold DESC, total_sales DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 5. GET LOW STOCK ALERTS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_low_stock(
    p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
    branch_id UUID,
    branch_name TEXT,
    ingredient_id UUID,
    ingredient_sku TEXT,
    ingredient_name TEXT,
    unit TEXT,
    quantity NUMERIC,
    reserved_quantity NUMERIC,
    available_quantity NUMERIC,
    minimum_stock NUMERIC,
    stock_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id AS branch_id,
        b.name AS branch_name,
        ing.id AS ingredient_id,
        ing.sku AS ingredient_sku,
        ing.name AS ingredient_name,
        ing.unit,
        bi.quantity,
        bi.reserved_quantity,
        (bi.quantity - bi.reserved_quantity) AS available_quantity,
        COALESCE(bi.minimum_stock, ing.minimum_stock) AS minimum_stock,
        CASE
            WHEN bi.quantity <= 0 THEN 'out_of_stock'
            WHEN bi.quantity <= (COALESCE(bi.minimum_stock, ing.minimum_stock) * 0.5) THEN 'critical'
            WHEN bi.quantity <= COALESCE(bi.minimum_stock, ing.minimum_stock) THEN 'warning'
            ELSE 'normal'
        END AS stock_status
    FROM public.branch_inventory bi
    JOIN public.branches b ON b.id = bi.branch_id
    JOIN public.ingredients ing ON ing.id = bi.ingredient_id
    WHERE (p_branch_id IS NULL OR bi.branch_id = p_branch_id)
      AND (
          bi.quantity <= COALESCE(bi.minimum_stock, ing.minimum_stock)
          OR bi.quantity <= 0
      )
    ORDER BY 
        CASE 
            WHEN bi.quantity <= 0 THEN 1
            WHEN bi.quantity <= (COALESCE(bi.minimum_stock, ing.minimum_stock) * 0.5) THEN 2
            ELSE 3
        END,
        bi.quantity ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 6. STOCK ADJUSTMENT RPC (Restock / Loss / Reconciliation with Audit Trail)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.adjust_stock(
    p_branch_id UUID,
    p_ingredient_id UUID,
    p_adjustment_qty NUMERIC, -- Positive for in, negative for out
    p_type TEXT,
    p_notes TEXT,
    p_created_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_before NUMERIC(14,3);
    v_after NUMERIC(14,3);
BEGIN
    IF p_adjustment_qty = 0 THEN
        RAISE EXCEPTION 'Jumlah penyesuaian stok tidak boleh nol.';
    END IF;

    -- Ensure record exists in branch_inventory
    INSERT INTO public.branch_inventory (branch_id, ingredient_id, quantity)
    VALUES (p_branch_id, p_ingredient_id, 0)
    ON CONFLICT (branch_id, ingredient_id) DO NOTHING;

    -- Check underflow
    SELECT quantity INTO v_before
    FROM public.branch_inventory
    WHERE branch_id = p_branch_id AND ingredient_id = p_ingredient_id;

    IF (v_before + p_adjustment_qty) < 0 THEN
        RAISE EXCEPTION 'Pengurangan stok melebihi stok yang tersedia (Stok saat ini: %).', v_before;
    END IF;

    UPDATE public.branch_inventory
    SET quantity = quantity + p_adjustment_qty,
        updated_at = NOW()
    WHERE branch_id = p_branch_id AND ingredient_id = p_ingredient_id
    RETURNING (quantity - p_adjustment_qty), quantity INTO v_before, v_after;

    -- Log movement
    INSERT INTO public.stock_movements (
        branch_id,
        ingredient_id,
        type,
        quantity,
        quantity_before,
        quantity_after,
        reference_type,
        notes,
        created_by
    ) VALUES (
        p_branch_id,
        p_ingredient_id,
        p_type,
        p_adjustment_qty,
        v_before,
        v_after,
        'manual_adjustment',
        p_notes,
        p_created_by
    );

    -- Log audit
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data
    ) VALUES (
        p_created_by,
        'stock_adjustment',
        'branch_inventory',
        p_ingredient_id,
        jsonb_build_object('quantity', v_before, 'branch_id', p_branch_id),
        jsonb_build_object('quantity', v_after, 'type', p_type, 'adjustment', p_adjustment_qty, 'notes', p_notes)
    );

    RETURN jsonb_build_object(
        'success', true,
        'quantity_before', v_before,
        'quantity_after', v_after
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
