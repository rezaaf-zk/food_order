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
    image:'/menu/mie pedas.jpeg',
    hasLevel: true,
    has_spiciness_level: true,
    description: 'Mie Setan Iblis dengan Sensasi mie gurih berbalut bumbu rahasia super lezat yang dipadukan dengan taburan aroma menggoda. Pilih level pedas favoritmu dan rasakan ledakan rasa yang bikin ketagihan di setiap suapan!',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000002',
    sku: 'PRD-MIE-02',
    name: 'Mie Goreng Special',
    category: 'makanan',
    price: 17000,
    base_price: 17000,
    image: '/menu/mie spesial.jpeg',
    hasLevel: true,
    has_spiciness_level: true,
    description: 'Mie goreng spesial dengan telur dadar suwir dan sayuran segar',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000003',
    sku: 'PRD-NASI-01',
    name: 'Nasi Goreng Ayam Kampung',
    category: 'makanan',
    price: 13000,
    base_price: 13000,
    image: '/menu/Nasi goreng.jpeg',
    hasLevel: true,
    has_spiciness_level: true,
    description: 'Nasi goreng ala rumahan dengan aroma smoky yang khas dari wajan panas. Dimasak dengan bumbu rempah melimpah, telur, dan suwiran lauk pilihan yang meresap sempurna ke setiap butir nasi. Menu klasik yang selalu berhasil menggugah selera.',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000004',
    sku: 'PRD-NASI-02',
    name: 'Nasi Goreng Khas Jawa',
    category: 'makanan',
    price: 18000,
    base_price: 18000,
    image: '/menu/nasgor jaw.jpeg',
    hasLevel: true,
    has_spiciness_level: true,
    description: 'Nasi Goreng Jawa adalah hidangan khas nusantara yang sederhana namun penuh cita rasa. Dibuat dari nasi putih yang digoreng bersama bumbu tradisional seperti bawang merah, bawang putih, cabai, dan kecap manis, menghasilkan aroma harum yang menggugah selera.',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000005',
    sku: 'PRD-SNK-01',
    name: 'Dimsum Ayam',
    category: 'snack',
    price: 12000,
    base_price: 12000,
    image: '/menu/dimsum.jpeg',
    hasLevel: false,
    has_spiciness_level: false,
    description: 'Dimsum ayam kukus empuk isi 3 pcs dengan saus cocol',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000006',
    sku: 'PRD-SNK-02',
    name: 'Tahu Crispy',
    category: 'snack',
    price: 6000,
    base_price: 6000,
    image: '/menu/tahu goreng.jpeg',
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
    image: '/menu/lumpia goreng.jpeg',
    hasLevel: false,
    has_spiciness_level: false,
    description: 'Lumpia goreng renyah dengan isian padat melimpah dari sayuran segar dan tumisan bumbu gurih pilihan. Digoreng hingga berwarna keemasan sempurna, memberikan tekstur krispi di gigitan pertama yang berpadu nikmat dengan saus pelengkapnya.',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000008',
    sku: 'PRD-SNK-04',
    name: 'Bakso Goreng',
    category: 'snack',
    price: 10000,
    base_price: 10000,
    image: '/menu/bakso goreng.jpeg',
    hasLevel: false,
    has_spiciness_level: false,
    description: 'Camilan favorit sejuta umat! Bakso goreng renyah di luar namun tetap lembut dan juicy di bagian dalam. Disajikan selagi hangat lengkap dengan saus sambal khas yang memberikan sensasi rasa gurih mantap di setiap gigitan.',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000009',
    sku: 'PRD-DRK-01',
    name: 'Kopi Susu Gula Aren',
    category: 'minuman',
    price: 16000,
    base_price: 16000,
    image: '/menu/es kopi.jpeg',
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
    image: '/menu/es gendruwo.jpeg',
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
    image: '/menu/es teh.jpeg',
    hasLevel: false,
    has_spiciness_level: false,
    description: 'Penyegar sejati yang tak pernah salah. Perpaduan seduhan daun teh pilihan berkualitas tinggi dengan manisnya gula asli dan es batu yang melimpah. Menghadirkan kesegaran instant yang langsung menuntaskan dahaga di cuaca terik.',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000012',
    sku: 'PRD-DRK-04',
    name: 'Es Jeruk',
    category: 'minuman',
    price: 7000,
    base_price: 7000,
    image: '/menu/es jeruk.jpeg',
    hasLevel: false,
    has_spiciness_level: false,
    description: 'Jus perasan jeruk manis alami tanpa pemanis buatan',
    available: true
  },
  {
    id: 'p0000000-0000-0000-0000-000000000013',
    sku: 'PRD-PKT-01',
    name: 'Paket hemat Mie + Es Teh',
    category: 'paket-hemat',
    price: 18000,
    base_price: 18000,
    image: 'menu/paket mie esteh.jpeg',
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
    image: 'menu/Pudding.jpeg',
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
    image: '/menu/es matcha.jpeg',
    hasLevel: false,
    has_spiciness_level: false,
    description: 'Es krim matcha lembut dan tentunya sangat menyegarkan',
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
