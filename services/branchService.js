import { supabase } from '../supabaseClient';
import { calculateDistance } from '../utils/distance';

// Seed fallback branches in Surabaya (Chapter 40)
export const FALLBACK_BRANCHES = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    code: 'BR-TUNJUNGAN',
    name: 'Cabang Tunjungan',
    address: 'Jl. Tunjungan No. 45, Genteng',
    city: 'Surabaya',
    province: 'Jawa Timur',
    postal_code: '60275',
    latitude: -7.260655,
    longitude: 112.738379,
    phone: '081234567801',
    is_active: true,
    opening_hours: '10:00 - 22:00'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    code: 'BR-RUNGKUT',
    name: 'Cabang Rungkut',
    address: 'Jl. Rungkut Madya No. 12, Gunung Anyar',
    city: 'Surabaya',
    province: 'Jawa Timur',
    postal_code: '60293',
    latitude: -7.31844,
    longitude: 112.77583,
    phone: '081234567802',
    is_active: true,
    opening_hours: '10:00 - 22:00'
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    code: 'BR-MERR',
    name: 'Cabang MERR',
    address: 'Jl. Dr. Ir. H. Soekarno No. 88, Rungkut',
    city: 'Surabaya',
    province: 'Jawa Timur',
    postal_code: '60298',
    latitude: -7.29112,
    longitude: 112.78235,
    phone: '081234567803',
    is_active: true,
    opening_hours: '10:00 - 23:00'
  }
];

export async function fetchBranches(userLat = null, userLon = null) {
  try {
    // 1. Try fetching from Supabase
    let branches = [];
    if (userLat != null && userLon != null) {
      const { data, error } = await supabase.rpc('get_nearest_branches', {
        user_lat: userLat,
        user_lon: userLon,
        max_distance_km: 500,
        limit_count: 20
      });

      if (!error && data && data.length > 0) {
        branches = data;
      }
    }

    if (branches.length === 0) {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!error && data && data.length > 0) {
        branches = data;
      }
    }

    // If Supabase returned data, use it; otherwise fallback
    const rawBranches = branches.length > 0 ? branches : FALLBACK_BRANCHES;

    // Compute distance if coordinates available
    const enriched = rawBranches.map((b) => {
      const dist =
        userLat != null && userLon != null
          ? b.distance_km != null
            ? Number(b.distance_km)
            : calculateDistance(userLat, userLon, Number(b.latitude), Number(b.longitude))
          : null;

      return {
        ...b,
        distance_km: dist,
        isOpen: b.is_active
      };
    });

    if (userLat != null && userLon != null) {
      enriched.sort((a, b) => (a.distance_km || 9999) - (b.distance_km || 9999));
    }

    return enriched;
  } catch (err) {
    console.warn('Fallback to local branches due to error:', err.message);
    return FALLBACK_BRANCHES.map((b) => {
      const dist =
        userLat != null && userLon != null
          ? calculateDistance(userLat, userLon, b.latitude, b.longitude)
          : null;
      return { ...b, distance_km: dist, isOpen: true };
    });
  }
}
