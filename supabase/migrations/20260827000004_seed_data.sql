-- ============================================================================
-- MIGRATION 4: Comprehensive Realistic Multi-Branch Seed Dataset
-- Multi-Branch Food Ordering System with BOM Inventory & Sales Monitoring
-- Reference: ANTIGRAVITY_FOOD_ORDER_MASTER_SPEC.md (Chapters 40, 41)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SEED BRANCHES (Surabaya & Surrounding)
-- ----------------------------------------------------------------------------
INSERT INTO public.branches (id, code, name, address, city, province, postal_code, latitude, longitude, phone, is_active)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'BR-TUNJUNGAN', 'Cabang Tunjungan', 'Jl. Tunjungan No. 45, Genteng', 'Surabaya', 'Jawa Timur', '60275', -7.2606550, 112.7383790, '081234567801', TRUE),
    ('a0000000-0000-0000-0000-000000000002', 'BR-RUNGKUT', 'Cabang Rungkut', 'Jl. Rungkut Madya No. 12, Gunung Anyar', 'Surabaya', 'Jawa Timur', '60293', -7.3184400, 112.7758300, '081234567802', TRUE),
    ('a0000000-0000-0000-0000-000000000003', 'BR-MERR', 'Cabang MERR', 'Jl. Dr. Ir. H. Soekarno No. 88, Rungkut', 'Surabaya', 'Jawa Timur', '60298', -7.2911200, 112.7823500, '081234567803', TRUE)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude;

-- ----------------------------------------------------------------------------
-- 2. SEED PROFILES (Users & Roles)
-- ----------------------------------------------------------------------------
INSERT INTO public.profiles (id, username, full_name, phone, role, branch_id)
VALUES
    ('u0000000-0000-0000-0000-000000000001', 'superadmin', 'Super Admin Pusat', '08111111111', 'super_admin', NULL),
    ('u0000000-0000-0000-0000-000000000002', 'admin_tunjungan', 'Manager Tunjungan', '08122222222', 'branch_manager', 'a0000000-0000-0000-0000-000000000001'),
    ('u0000000-0000-0000-0000-000000000003', 'staff_rungkut', 'Staff Rungkut', '08133333333', 'staff', 'a0000000-0000-0000-0000-000000000002'),
    ('u0000000-0000-0000-0000-000000000004', 'customer_budi', 'Budi Santoso', '08144444444', 'customer', NULL),
    ('u0000000-0000-0000-0000-000000000005', 'customer_siti', 'Siti Rahma', '08155555555', 'customer', NULL)
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

-- ----------------------------------------------------------------------------
-- 3. SEED CATEGORIES
-- ----------------------------------------------------------------------------
INSERT INTO public.categories (id, name, slug, description, image_url, sort_order, is_active)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Makanan', 'makanan', 'Aneka olahan mie dan nasi lezat', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500', 1, TRUE),
    ('c0000000-0000-0000-0000-000000000002', 'Minuman', 'minuman', 'Minuman segar, kopi, dan jus dingin', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500', 2, TRUE),
    ('c0000000-0000-0000-0000-000000000003', 'Snack', 'snack', 'Gorengan renyah dan dimsum gurih', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500', 3, TRUE),
    ('c0000000-0000-0000-0000-000000000004', 'Paket Hemat', 'paket-hemat', 'Paket komplit makanan dan minuman hemat', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500', 4, TRUE),
    ('c0000000-0000-0000-0000-000000000005', 'Dessert', 'dessert', 'Penutup manis segar pelepas dahaga', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500', 5, TRUE)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order;

-- ----------------------------------------------------------------------------
-- 4. SEED PRODUCTS
-- ----------------------------------------------------------------------------
INSERT INTO public.products (id, category_id, sku, name, description, image_url, base_price, has_spiciness_level, is_active)
VALUES
    -- Makanan
    ('p0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'PRD-MIE-01', 'Mie Setan Iblis', 'Mie pedas gurih dengan bumbu rahasia dan taburan ayam tabur', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500', 15000, TRUE, TRUE),
    ('p0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'PRD-MIE-02', 'Mie Goreng Special', 'Mie goreng spesial dengan telur dadar suwir dan sayuran segar', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500', 17000, TRUE, TRUE),
    ('p0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'PRD-NASI-01', 'Nasi Goreng Kampung', 'Nasi goreng tradisional dengan rempah wangi dan telur', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500', 13000, TRUE, TRUE),
    ('p0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'PRD-NASI-02', 'Nasi Goreng Khas Jawa', 'Nasi goreng manis gurih khas Jawa dengan suwiran ayam', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500', 18000, TRUE, TRUE),
    -- Snack & Dimsum
    ('p0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'PRD-SNK-01', 'Dimsum Ayam Kukus', 'Dimsum ayam kukus empuk isi 3 pcs dengan saus cocol pedas manis', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500', 12000, FALSE, TRUE),
    ('p0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 'PRD-SNK-02', 'Gorengan Tahu Crispy', 'Tahu goreng isi krispi dengan cocolan petis khas Jawa Timur', 'https://images.unsplash.com/photo-1562689033-039adc142d2f?w=500', 6000, FALSE, TRUE),
    ('p0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 'PRD-SNK-03', 'Lumpia Goreng Renyah', 'Lumpia isi rebung dan ayam renyah isi 2 pcs', 'https://images.unsplash.com/photo-1562249885-8aa1fb98c835?w=500', 8000, FALSE, TRUE),
    ('p0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003', 'PRD-SNK-04', 'Bakso Goreng Mekar', 'Bakso goreng ayam sapi gurih dan kenyal isi 3 pcs', 'https://images.unsplash.com/photo-1605521209206-a5c21d33cf9c?w=500', 10000, FALSE, TRUE),
    -- Minuman
    ('p0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000002', 'PRD-DRK-01', 'Kopi Susu Gula Aren', 'Espresso arabica susu murni dengan gula aren legit dingin', 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500', 16000, FALSE, TRUE),
    ('p0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000002', 'PRD-DRK-02', 'Es Genderuwo', 'Es campur istimewa dengan cincau, nata de coco, dan sirup merah', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500', 8000, FALSE, TRUE),
    ('p0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000002', 'PRD-DRK-03', 'Es Teh Manis Jumbo', 'Teh melati wangi dingin segar ukuran jumbo', 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=500', 5000, FALSE, TRUE),
    ('p0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000002', 'PRD-DRK-04', 'Jus Jeruk Segar', 'Jus perasan jeruk manis alami tanpa pemanis buatan', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500', 7000, FALSE, TRUE),
    -- Paket Hemat & Dessert
    ('p0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000004', 'PRD-PKT-01', 'Paket Kenyang Mie + Es Teh', '1 Porsi Mie Setan Iblis + 1 Es Teh Manis Jumbo hemat', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500', 18000, TRUE, TRUE),
    ('p0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000005', 'PRD-DST-01', 'Pudding Cokelat Lava', 'Pudding cokelat lembut dengan saus fla vanila creamy', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500', 9000, FALSE, TRUE),
    ('p0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000005', 'PRD-DST-02', 'Es Krim Matcha Cup', 'Es krim green tea lembut menyegarkan', 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500', 10000, FALSE, TRUE)
ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    has_spiciness_level = EXCLUDED.has_spiciness_level;

-- ----------------------------------------------------------------------------
-- 5. SEED BRANCH_PRODUCTS (Assign all products to branches with availability)
-- ----------------------------------------------------------------------------
INSERT INTO public.branch_products (branch_id, product_id, price, available)
SELECT 
    b.id AS branch_id,
    p.id AS product_id,
    p.base_price AS price,
    -- Make 1 dessert out of stock at Rungkut for testing multi-branch availability
    CASE 
        WHEN b.code = 'BR-RUNGKUT' AND p.sku = 'PRD-DST-02' THEN FALSE
        ELSE TRUE 
    END AS available
FROM public.branches b
CROSS JOIN public.products p
ON CONFLICT (branch_id, product_id) DO UPDATE SET
    price = EXCLUDED.price,
    available = EXCLUDED.available;

-- ----------------------------------------------------------------------------
-- 6. SEED INGREDIENTS (Raw Materials Catalog)
-- ----------------------------------------------------------------------------
INSERT INTO public.ingredients (id, sku, name, unit, minimum_stock, maximum_stock, cost_per_unit)
VALUES
    ('i0000000-0000-0000-0000-000000000001', 'ING-MIE', 'Mie Basah Mentah', 'gram', 2000, 20000, 25),
    ('i0000000-0000-0000-0000-000000000002', 'ING-NASI', 'Beras Putih Pulen', 'gram', 5000, 50000, 15),
    ('i0000000-0000-0000-0000-000000000003', 'ING-AYAM', 'Daging Ayam Cincang', 'gram', 2000, 20000, 45),
    ('i0000000-0000-0000-0000-000000000004', 'ING-DIMKULIT', 'Kulit Dimsum Halus', 'piece', 150, 1500, 200),
    ('i0000000-0000-0000-0000-000000000005', 'ING-TELUR', 'Telur Ayam Segar', 'piece', 50, 500, 1800),
    ('i0000000-0000-0000-0000-000000000006', 'ING-CABE', 'Cabai Rawit Merah', 'gram', 500, 10000, 40),
    ('i0000000-0000-0000-0000-000000000007', 'ING-BUMBU', 'Bumbu Racik Rahasia', 'gram', 1000, 15000, 30),
    ('i0000000-0000-0000-0000-000000000008', 'ING-MINYAK', 'Minyak Goreng Sawit', 'milliliter', 2000, 30000, 18),
    ('i0000000-0000-0000-0000-000000000009', 'ING-KECAP', 'Kecap Manis Gurih', 'milliliter', 1000, 15000, 25),
    ('i0000000-0000-0000-0000-000000000010', 'ING-TAHU', 'Tahu Putih Segar', 'piece', 80, 800, 1000),
    ('i0000000-0000-0000-0000-000000000011', 'ING-LUMPIA', 'Kulit Lumpia Krispi', 'piece', 80, 800, 800),
    ('i0000000-0000-0000-0000-000000000012', 'ING-BAKSO', 'Bakso Olahan Siap Goreng', 'piece', 100, 1000, 1200),
    ('i0000000-0000-0000-0000-000000000013', 'ING-KOPI', 'Biji Kopi Arabica Blend', 'gram', 1000, 10000, 150),
    ('i0000000-0000-0000-0000-000000000014', 'ING-SUSU', 'Susu UHT Segar Full Cream', 'milliliter', 3000, 30000, 20),
    ('i0000000-0000-0000-0000-000000000015', 'ING-AREN', 'Gula Aren Cair Organik', 'milliliter', 1000, 10000, 35),
    ('i0000000-0000-0000-0000-000000000016', 'ING-TEH', 'Teh Melati Wangi', 'gram', 500, 5000, 20),
    ('i0000000-0000-0000-0000-000000000017', 'ING-GULA', 'Gula Pasir Kristal', 'gram', 2000, 25000, 16),
    ('i0000000-0000-0000-0000-000000000018', 'ING-JERUK', 'Jeruk Peras Segar', 'gram', 2000, 20000, 20),
    ('i0000000-0000-0000-0000-000000000019', 'ING-SIRUP', 'Sirup Campur Merah & Jelly', 'gram', 1000, 10000, 30),
    ('i0000000-0000-0000-0000-000000000020', 'ING-CUP', 'Cup Plastik 16oz + Tutup', 'piece', 200, 2000, 500),
    ('i0000000-0000-0000-0000-000000000021', 'ING-BOWL', 'Paper Bowl Box Makanan', 'piece', 200, 2000, 800)
ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    cost_per_unit = EXCLUDED.cost_per_unit;

-- ----------------------------------------------------------------------------
-- 7. SEED PRODUCT_RECIPES & RECIPE_ITEMS (Bill of Materials / BOM)
-- ----------------------------------------------------------------------------
-- Recipe 1: Mie Setan Iblis
INSERT INTO public.product_recipes (id, product_id, version, description)
VALUES ('r0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 1, 'Standar BOM Mie Setan Iblis')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity, unit, spiciness_multiplier) VALUES
    ('r0000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000001', 120, 'gram', 0),       -- Mie 120g
    ('r0000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000003', 30, 'gram', 0),        -- Ayam 30g
    ('r0000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000006', 5, 'gram', 2.5),       -- Cabe base 5g + 2.5g per level
    ('r0000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000007', 15, 'gram', 0),       -- Bumbu 15g
    ('r0000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000008', 15, 'milliliter', 0), -- Minyak 15ml
    ('r0000000-0000-0000-0000-000000000001', 'i0000000-0000-0000-0000-000000000021', 1, 'piece', 0)         -- Bowl 1pcs
ON CONFLICT (recipe_id, ingredient_id) DO NOTHING;

-- Recipe 2: Mie Goreng Special
INSERT INTO public.product_recipes (id, product_id, version, description)
VALUES ('r0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 1, 'Standar BOM Mie Goreng Special')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity, unit, spiciness_multiplier) VALUES
    ('r0000000-0000-0000-0000-000000000002', 'i0000000-0000-0000-0000-000000000001', 120, 'gram', 0),
    ('r0000000-0000-0000-0000-000000000002', 'i0000000-0000-0000-0000-000000000005', 1, 'piece', 0),        -- Telur 1 butir
    ('r0000000-0000-0000-0000-000000000002', 'i0000000-0000-0000-0000-000000000009', 20, 'milliliter', 0), -- Kecap 20ml
    ('r0000000-0000-0000-0000-000000000002', 'i0000000-0000-0000-0000-000000000006', 3, 'gram', 2.0),
    ('r0000000-0000-0000-0000-000000000002', 'i0000000-0000-0000-0000-000000000021', 1, 'piece', 0)
ON CONFLICT (recipe_id, ingredient_id) DO NOTHING;

-- Recipe 3: Kopi Susu Gula Aren
INSERT INTO public.product_recipes (id, product_id, version, description)
VALUES ('r0000000-0000-0000-0000-000000000009', 'p0000000-0000-0000-0000-000000000009', 1, 'Standar BOM Kopi Susu Gula Aren')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity, unit) VALUES
    ('r0000000-0000-0000-0000-000000000009', 'i0000000-0000-0000-0000-000000000013', 20, 'gram'),        -- Kopi Arabica 20g
    ('r0000000-0000-0000-0000-000000000009', 'i0000000-0000-0000-0000-000000000014', 150, 'milliliter'), -- Susu 150ml
    ('r0000000-0000-0000-0000-000000000009', 'i0000000-0000-0000-0000-000000000015', 25, 'milliliter'),  -- Aren 25ml
    ('r0000000-0000-0000-0000-000000000009', 'i0000000-0000-0000-0000-000000000020', 1, 'piece')          -- Cup 1pcs
ON CONFLICT (recipe_id, ingredient_id) DO NOTHING;

-- Recipe 4: Dimsum Ayam Kukus
INSERT INTO public.product_recipes (id, product_id, version, description)
VALUES ('r0000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000005', 1, 'Standar BOM Dimsum Ayam')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity, unit) VALUES
    ('r0000000-0000-0000-0000-000000000005', 'i0000000-0000-0000-0000-000000000003', 60, 'gram'),
    ('r0000000-0000-0000-0000-000000000005', 'i0000000-0000-0000-0000-000000000004', 3, 'piece'),
    ('r0000000-0000-0000-0000-000000000005', 'i0000000-0000-0000-0000-000000000021', 1, 'piece')
ON CONFLICT (recipe_id, ingredient_id) DO NOTHING;

-- Recipe 5: Es Teh Manis Jumbo
INSERT INTO public.product_recipes (id, product_id, version, description)
VALUES ('r0000000-0000-0000-0000-000000000011', 'p0000000-0000-0000-0000-000000000011', 1, 'Standar BOM Es Teh Manis')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.recipe_items (recipe_id, ingredient_id, quantity, unit) VALUES
    ('r0000000-0000-0000-0000-000000000011', 'i0000000-0000-0000-0000-000000000016', 5, 'gram'),
    ('r0000000-0000-0000-0000-000000000011', 'i0000000-0000-0000-0000-000000000017', 25, 'gram'),
    ('r0000000-0000-0000-0000-000000000011', 'i0000000-0000-0000-0000-000000000020', 1, 'piece')
ON CONFLICT (recipe_id, ingredient_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. SEED BRANCH_INVENTORY (Raw Materials Stock per Outlet with variations)
-- ----------------------------------------------------------------------------
INSERT INTO public.branch_inventory (branch_id, ingredient_id, quantity, reserved_quantity, minimum_stock)
SELECT 
    b.id AS branch_id,
    ing.id AS ingredient_id,
    -- Varied stock per branch to simulate realistic stock conditions
    CASE 
        -- Simulasikan stok kopi kritis di Rungkut untuk demo alert
        WHEN b.code = 'BR-RUNGKUT' AND ing.sku = 'ING-KOPI' THEN 450.000 
        -- Simulasikan stok cabe tipis di MERR
        WHEN b.code = 'BR-MERR' AND ing.sku = 'ING-CABE' THEN 300.000
        -- Normal high stock for other outlets
        ELSE (ing.minimum_stock * 3.5)
    END AS quantity,
    0 AS reserved_quantity,
    ing.minimum_stock
FROM public.branches b
CROSS JOIN public.ingredients ing
ON CONFLICT (branch_id, ingredient_id) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    minimum_stock = EXCLUDED.minimum_stock;

-- ----------------------------------------------------------------------------
-- 9. SEED OPENING BALANCE STOCK MOVEMENTS
-- ----------------------------------------------------------------------------
INSERT INTO public.stock_movements (branch_id, ingredient_id, type, quantity, quantity_before, quantity_after, notes)
SELECT 
    bi.branch_id,
    bi.ingredient_id,
    'opening_balance',
    bi.quantity,
    0,
    bi.quantity,
    'Saldo awal stok pembukaan cabang'
FROM public.branch_inventory bi
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 10. SEED HISTORICAL TRANSACTIONS (2–3 Months Realistic Distribution)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_b1 UUID := 'a0000000-0000-0000-0000-000000000001'; -- Tunjungan
    v_b2 UUID := 'a0000000-0000-0000-0000-000000000002'; -- Rungkut
    v_b3 UUID := 'a0000000-0000-0000-0000-000000000003'; -- MERR
    v_order_id UUID;
    v_days_back INT;
    v_order_date TIMESTAMPTZ;
    v_ord_num TEXT;
    v_cust_name TEXT;
    v_target_branch UUID;
    v_daily_orders INT;
BEGIN
    -- Loop past 60 days to create realistic monthly and daily trend charts
    FOR v_days_back IN REVERSE 60..0 LOOP
        v_order_date := NOW() - (v_days_back || ' days')::INTERVAL + (INTERVAL '10 hours');
        
        -- Daily order volume varies between 4 to 12 orders across branches
        FOR v_daily_orders IN 1..(4 + FLOOR(RANDOM() * 8)::INT) LOOP
            v_order_id := gen_random_uuid();
            v_ord_num := 'ORD-' || TO_CHAR(v_order_date, 'YYYYMMDD') || '-' || LPAD((v_daily_orders * 100 + v_days_back)::TEXT, 4, '0');
            
            -- Pick branch with realistic weight: Tunjungan 50%, Rungkut 30%, MERR 20%
            IF RANDOM() < 0.5 THEN
                v_target_branch := v_b1;
            ELSIF RANDOM() < 0.8 THEN
                v_target_branch := v_b2;
            ELSE
                v_target_branch := v_b3;
            END IF;

            v_cust_name := (ARRAY['Ahmad Dani', 'Rina Marlina', 'Fajar Pratama', 'Dewi Lestari', 'Kevin Sanjaya', 'Anisa Tri', 'Bambang Sudirman'])[1 + FLOOR(RANDOM() * 7)::INT];

            -- Create Order (Mix of paid and ready/completed)
            INSERT INTO public.orders (
                id,
                order_number,
                branch_id,
                subtotal,
                discount,
                tax,
                total,
                payment_status,
                order_status,
                order_type,
                payment_method,
                customer_name,
                created_at,
                updated_at
            ) VALUES (
                v_order_id,
                v_ord_num,
                v_target_branch,
                36000,
                0,
                0,
                36000,
                'paid',
                'completed',
                'pickup',
                (ARRAY['cash', 'stripe', 'qris'])[1 + FLOOR(RANDOM() * 3)::INT],
                v_cust_name,
                v_order_date + ((v_daily_orders * 45) || ' minutes')::INTERVAL,
                v_order_date + ((v_daily_orders * 45) || ' minutes')::INTERVAL
            );

            -- Add Order Items (Mie Setan + Kopi Susu)
            INSERT INTO public.order_items (order_id, product_id, product_name_snapshot, unit_price, quantity, subtotal, spiciness_level, created_at)
            VALUES 
                (v_order_id, 'p0000000-0000-0000-0000-000000000001', 'Mie Setan Iblis', 15000, 2, 30000, 3, v_order_date),
                (v_order_id, 'p0000000-0000-0000-0000-000000000011', 'Es Teh Manis Jumbo', 5000, 1, 5000, NULL, v_order_date);

            -- Add Payment Record
            INSERT INTO public.payments (order_id, provider, provider_payment_id, amount, status, paid_at, created_at)
            VALUES (
                v_order_id,
                'gateway',
                'pi_seed_' || v_ord_num,
                36000,
                'paid',
                v_order_date,
                v_order_date
            );
        END LOOP;
    END LOOP;
END $$;
