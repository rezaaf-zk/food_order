import { supabase } from '../supabaseClient';

export const FALLBACK_CATEGORIES = [
  { id: 'c0000000-0000-0000-0000-000000000001', slug: 'makanan', label: 'Makanan', name: 'Makanan' },
  { id: 'c0000000-0000-0000-0000-000000000002', slug: 'minuman', label: 'Minuman', name: 'Minuman' },
  { id: 'c0000000-0000-0000-0000-000000000003', slug: 'snack', label: 'Snack', name: 'Snack' },
  { id: 'c0000000-0000-0000-0000-000000000004', slug: 'paket-hemat', label: 'Paket Hemat', name: 'Paket Hemat' },
  { id: 'c0000000-0000-0000-0000-000000000005', slug: 'dessert', label: 'Dessert', name: 'Dessert' }
];

export const FALLBACK_PRODUCTS = [
  {
    id: 'p0000000-0000-0000-0000-000000000001',
    sku: 'PRD-MIE-01',
    name: 'Mie Setan Iblis',
    category: 'makanan',
    price: 15000,
    base_price: 15000,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500',
    hasLevel: true,
    has_spiciness_level: true,
    description: 'Mie pedas gurih dengan bumbu rahasia dan taburan ayam tabur',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000002',
    sku: 'PRD-MIE-02',
    name: 'Mie Goreng Special',
    category: 'makanan',
    price: 17000,
    base_price: 17000,
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500',
    hasLevel: true,
    has_spiciness_level: true,
    description: 'Mie goreng spesial dengan telur dadar suwir dan sayuran segar',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000003',
    sku: 'PRD-NASI-01',
    name: 'Nasi Goreng Kampung',
    category: 'makanan',
    price: 13000,
    base_price: 13000,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500',
    hasLevel: true,
    has_spiciness_level: true,
    description: 'Nasi goreng tradisional dengan rempah wangi dan telur',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000004',
    sku: 'PRD-NASI-02',
    name: 'Nasi Goreng Khas Jawa',
    category: 'makanan',
    price: 18000,
    base_price: 18000,
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500',
    hasLevel: true,
    has_spiciness_level: true,
    description: 'Nasi goreng manis gurih khas Jawa dengan suwiran ayam',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000005',
    sku: 'PRD-SNK-01',
    name: 'Dimsum Ayam Kukus',
    category: 'snack',
    price: 12000,
    base_price: 12000,
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500',
    hasLevel: false,
    has_spiciness_level: false,
    description: 'Dimsum ayam kukus empuk isi 3 pcs dengan saus cocol',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000006',
    sku: 'PRD-SNK-02',
    name: 'Gorengan Tahu Crispy',
    category: 'snack',
    price: 6000,
    base_price: 6000,
    image: 'https://images.unsplash.com/photo-1562689033-039adc142d2f?w=500',
    hasLevel: false,
    has_spiciness_level: false,
    description: 'Tahu goreng isi krispi dengan cocolan petis khas Jawa Timur',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000007',
    sku: 'PRD-SNK-03',
    name: 'Lumpia Goreng Renyah',
    category: 'snack',
    price: 8000,
    base_price: 8000,
    image: 'https://images.unsplash.com/photo-1562249885-8aa1fb98c835?w=500',
    hasLevel: false,
    has_spiciness_level: false,
    description: 'Lumpia isi rebung dan ayam renyah isi 2 pcs',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000008',
    sku: 'PRD-SNK-04',
    name: 'Bakso Goreng Mekar',
    category: 'snack',
    price: 10000,
    base_price: 10000,
    image: 'https://images.unsplash.com/photo-1605521209206-a5c21d33cf9c?w=500',
    hasLevel: false,
    has_spiciness_level: false,
    description: 'Bakso goreng ayam sapi gurih dan kenyal isi 3 pcs',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000009',
    sku: 'PRD-DRK-01',
    name: 'Kopi Susu Gula Aren',
    category: 'minuman',
    price: 16000,
    base_price: 16000,
    image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500',
    hasLevel: false,
    has_spiciness_level: false,
    description: 'Espresso arabica susu murni dengan gula aren legit dingin',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000010',
    sku: 'PRD-DRK-02',
    name: 'Es Genderuwo',
    category: 'minuman',
    price: 8000,
    base_price: 8000,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500',
    hasLevel: false,
    has_spiciness_level: false,
    description: 'Es campur istimewa dengan cincau, nata de coco, dan sirup merah',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000011',
    sku: 'PRD-DRK-03',
    name: 'Es Teh Manis Jumbo',
    category: 'minuman',
    price: 5000,
    base_price: 5000,
    image: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=500',
    hasLevel: false,
    has_spiciness_level: false,
    description: 'Teh melati wangi dingin segar ukuran jumbo',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000012',
    sku: 'PRD-DRK-04',
    name: 'Jus Jeruk Segar',
    category: 'minuman',
    price: 7000,
    base_price: 7000,
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500',
    hasLevel: false,
    has_spiciness_level: false,
    description: 'Jus perasan jeruk manis alami tanpa pemanis buatan',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000013',
    sku: 'PRD-PKT-01',
    name: 'Paket Kenyang Mie + Es Teh',
    category: 'paket-hemat',
    price: 18000,
    base_price: 18000,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
    hasLevel: true,
    has_spiciness_level: true,
    description: '1 Porsi Mie Setan Iblis + 1 Es Teh Manis Jumbo hemat',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000014',
    sku: 'PRD-DST-01',
    name: 'Pudding Cokelat Lava',
    category: 'dessert',
    price: 9000,
    base_price: 9000,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500',
    hasLevel: false,
    has_spiciness_level: false,
    description: 'Pudding cokelat lembut dengan saus fla vanila creamy',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000015',
    sku: 'PRD-DST-02',
    name: 'Es Krim Matcha Cup',
    category: 'dessert',
    price: 10000,
    base_price: 10000,
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500',
    hasLevel: false,
    has_spiciness_level: false,
    description: 'Es krim green tea lembut menyegarkan',
    available: true
  }
];

export async function fetchCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((c) => ({
        id: c.id,
        slug: c.slug,
        label: c.name,
        name: c.name
      }));
    }
    return FALLBACK_CATEGORIES;
  } catch (err) {
    console.warn('Using fallback categories:', err.message);
    return FALLBACK_CATEGORIES;
  }
}

export async function fetchProductsByBranch(branchId) {
  try {
    if (!branchId) {
      return FALLBACK_PRODUCTS;
    }

    // Query Supabase for products with branch_products overlay
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        sku,
        name,
        description,
        image_url,
        base_price,
        has_spiciness_level,
        is_active,
        categories (
          id,
          name,
          slug
        ),
        branch_products (
          price,
          available,
          branch_id
        )
      `)
      .eq('is_active', true);

    if (!error && data && data.length > 0) {
      return data.map((item) => {
        const bp = (item.branch_products || []).find((b) => b.branch_id === branchId);
        const price = bp && bp.price != null ? Number(bp.price) : Number(item.base_price);
        const available = bp ? bp.available : true;
        const categorySlug = item.categories?.slug || 'makanan';

        return {
          id: item.id,
          sku: item.sku,
          name: item.name,
          category: categorySlug,
          price,
          base_price: Number(item.base_price),
          image: item.image_url || 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500',
          hasLevel: item.has_spiciness_level,
          has_spiciness_level: item.has_spiciness_level,
          description: item.description,
          available
        };
      });
    }

    // Branch specific fallback simulation:
    // If Rungkut branch, Matcha Ice Cream is marked unavailable for demo
    return FALLBACK_PRODUCTS.map((p) => {
      if (branchId === 'a0000000-0000-0000-0000-000000000002' && p.sku === 'PRD-DST-02') {
        return { ...p, available: false };
      }
      return { ...p, available: true };
    });
  } catch (err) {
    console.warn('Using fallback products:', err.message);
    return FALLBACK_PRODUCTS;
  }
}
