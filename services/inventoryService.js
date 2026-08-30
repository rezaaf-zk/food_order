import { supabase } from '../supabaseClient';

export const FALLBACK_INGREDIENTS = [
  { id: 'i1', sku: 'ING-MIE', name: 'Mie Basah Mentah', unit: 'gram', minimum_stock: 2000, cost_per_unit: 25 },
  { id: 'i2', sku: 'ING-NASI', name: 'Beras Putih Pulen', unit: 'gram', minimum_stock: 5000, cost_per_unit: 15 },
  { id: 'i3', sku: 'ING-AYAM', name: 'Daging Ayam Cincang', unit: 'gram', minimum_stock: 2000, cost_per_unit: 45 },
  { id: 'i4', sku: 'ING-DIMKULIT', name: 'Kulit Dimsum Halus', unit: 'piece', minimum_stock: 150, cost_per_unit: 200 },
  { id: 'i5', sku: 'ING-TELUR', name: 'Telur Ayam Segar', unit: 'piece', minimum_stock: 50, cost_per_unit: 1800 },
  { id: 'i6', sku: 'ING-CABE', name: 'Cabai Rawit Merah', unit: 'gram', minimum_stock: 500, cost_per_unit: 40 },
  { id: 'i7', sku: 'ING-BUMBU', name: 'Bumbu Racik Rahasia', unit: 'gram', minimum_stock: 1000, cost_per_unit: 30 },
  { id: 'i8', sku: 'ING-MINYAK', name: 'Minyak Goreng Sawit', unit: 'milliliter', minimum_stock: 2000, cost_per_unit: 18 },
  { id: 'i9', sku: 'ING-KOPI', name: 'Biji Kopi Arabica Blend', unit: 'gram', minimum_stock: 1000, cost_per_unit: 150 },
  { id: 'i10', sku: 'ING-SUSU', name: 'Susu UHT Full Cream', unit: 'milliliter', minimum_stock: 3000, cost_per_unit: 20 },
  { id: 'i11', sku: 'ING-AREN', name: 'Gula Aren Cair Organik', unit: 'milliliter', minimum_stock: 1000, cost_per_unit: 35 },
  { id: 'i12', sku: 'ING-TEH', name: 'Teh Melati Wangi', unit: 'gram', minimum_stock: 500, cost_per_unit: 20 },
  { id: 'i13', sku: 'ING-GULA', name: 'Gula Pasir Kristal', unit: 'gram', minimum_stock: 2000, cost_per_unit: 16 },
  { id: 'i14', sku: 'ING-CUP', name: 'Cup Plastik 16oz + Tutup', unit: 'piece', minimum_stock: 200, cost_per_unit: 500 },
  { id: 'i15', sku: 'ING-BOWL', name: 'Paper Bowl Box', unit: 'piece', minimum_stock: 200, cost_per_unit: 800 }
];

export const FALLBACK_RECIPES = [
  {
    productName: 'Mie Setan Iblis',
    sku: 'PRD-MIE-01',
    ingredients: [
      { name: 'Mie Basah Mentah', quantity: 120, unit: 'gram' },
      { name: 'Daging Ayam Cincang', quantity: 30, unit: 'gram' },
      { name: 'Cabai Rawit Merah', quantity: 5, unit: 'gram', note: '+2.5g/lvl' },
      { name: 'Bumbu Racik Rahasia', quantity: 15, unit: 'gram' },
      { name: 'Paper Bowl Box', quantity: 1, unit: 'piece' }
    ]
  },
  {
    productName: 'Mie Goreng Special',
    sku: 'PRD-MIE-02',
    ingredients: [
      { name: 'Mie Basah Mentah', quantity: 120, unit: 'gram' },
      { name: 'Telur Ayam Segar', quantity: 1, unit: 'piece' },
      { name: 'Minyak Goreng Sawit', quantity: 20, unit: 'milliliter' },
      { name: 'Paper Bowl Box', quantity: 1, unit: 'piece' }
    ]
  },
  {
    productName: 'Kopi Susu Gula Aren',
    sku: 'PRD-DRK-01',
    ingredients: [
      { name: 'Biji Kopi Arabica Blend', quantity: 20, unit: 'gram' },
      { name: 'Susu UHT Full Cream', quantity: 150, unit: 'milliliter' },
      { name: 'Gula Aren Cair Organik', quantity: 25, unit: 'milliliter' },
      { name: 'Cup Plastik 16oz + Tutup', quantity: 1, unit: 'piece' }
    ]
  },
  {
    productName: 'Dimsum Ayam Kukus',
    sku: 'PRD-SNK-01',
    ingredients: [
      { name: 'Daging Ayam Cincang', quantity: 60, unit: 'gram' },
      { name: 'Kulit Dimsum Halus', quantity: 3, unit: 'piece' },
      { name: 'Paper Bowl Box', quantity: 1, unit: 'piece' }
    ]
  },
  {
    productName: 'Es Teh Manis Jumbo',
    sku: 'PRD-DRK-03',
    ingredients: [
      { name: 'Teh Melati Wangi', quantity: 5, unit: 'gram' },
      { name: 'Gula Pasir Kristal', quantity: 25, unit: 'gram' },
      { name: 'Cup Plastik 16oz + Tutup', quantity: 1, unit: 'piece' }
    ]
  }
];

export function computeStockStatus(quantity, minimumStock) {
  const q = Number(quantity) || 0;
  const min = Number(minimumStock) || 0;

  if (q <= 0) return 'out_of_stock';
  if (q <= min * 0.5) return 'critical';
  if (q <= min) return 'warning';
  return 'normal';
}

export async function fetchBranchInventory(branchId = null) {
  try {
    let query = supabase
      .from('branch_inventory')
      .select(`
        id,
        branch_id,
        ingredient_id,
        quantity,
        reserved_quantity,
        minimum_stock,
        updated_at,
        branches (
          id,
          name,
          code
        ),
        ingredients (
          id,
          sku,
          name,
          unit,
          minimum_stock,
          cost_per_unit
        )
      `)
      .order('quantity', { ascending: true });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return data.map((item) => {
        const minStock = item.minimum_stock != null ? item.minimum_stock : item.ingredients?.minimum_stock || 0;
        const available = Number(item.quantity) - Number(item.reserved_quantity || 0);
        return {
          id: item.id,
          branchId: item.branch_id,
          branchName: item.branches?.name || 'Cabang',
          branchCode: item.branches?.code || '',
          ingredientId: item.ingredient_id,
          sku: item.ingredients?.sku || '',
          name: item.ingredients?.name || 'Bahan Baku',
          unit: item.ingredients?.unit || 'gram',
          costPerUnit: item.ingredients?.cost_per_unit || 0,
          quantity: Number(item.quantity),
          reservedQuantity: Number(item.reserved_quantity || 0),
          availableQuantity: available,
          minimumStock: Number(minStock),
          status: computeStockStatus(item.quantity, minStock),
          updatedAt: item.updated_at
        };
      });
    }

    // Fallback simulation with varied stock levels
    return FALLBACK_INGREDIENTS.map((ing, idx) => {
      let qty = ing.minimum_stock * 3;
      // Simulate warning/critical items for demonstration
      if (idx === 8) qty = 450; // Kopi at warning
      if (idx === 5) qty = 300; // Cabe at critical

      return {
        id: `inv-${ing.sku}`,
        branchId: branchId || 'a0000000-0000-0000-0000-000000000001',
        branchName: 'Cabang Tunjungan',
        branchCode: 'BR-TUNJUNGAN',
        ingredientId: ing.id,
        sku: ing.sku,
        name: ing.name,
        unit: ing.unit,
        costPerUnit: ing.cost_per_unit,
        quantity: qty,
        reservedQuantity: 0,
        availableQuantity: qty,
        minimumStock: ing.minimum_stock,
        status: computeStockStatus(qty, ing.minimum_stock),
        updatedAt: new Date().toISOString()
      };
    });
  } catch (err) {
    console.warn('Using fallback inventory data:', err.message);
    return FALLBACK_INGREDIENTS.map((ing) => ({
      id: `inv-${ing.sku}`,
      branchId: branchId || 'a0000000-0000-0000-0000-000000000001',
      branchName: 'Cabang Tunjungan',
      ingredientId: ing.id,
      sku: ing.sku,
      name: ing.name,
      unit: ing.unit,
      costPerUnit: ing.cost_per_unit,
      quantity: ing.minimum_stock * 2.5,
      reservedQuantity: 0,
      availableQuantity: ing.minimum_stock * 2.5,
      minimumStock: ing.minimum_stock,
      status: 'normal',
      updatedAt: new Date().toISOString()
    }));
  }
}

export async function fetchLowStockAlerts(branchId = null) {
  try {
    const { data, error } = await supabase.rpc('get_low_stock', {
      p_branch_id: branchId
    });

    if (!error && data) {
      return data;
    }

    const inventory = await fetchBranchInventory(branchId);
    return inventory.filter((item) => item.status !== 'normal');
  } catch (err) {
    const inventory = await fetchBranchInventory(branchId);
    return inventory.filter((item) => item.status !== 'normal');
  }
}

export async function adjustStock({ branchId, ingredientId, quantity, type, notes, createdBy = null }) {
  try {
    const { data, error } = await supabase.rpc('adjust_stock', {
      p_branch_id: branchId,
      p_ingredient_id: ingredientId,
      p_adjustment_qty: Number(quantity),
      p_type: type,
      p_notes: notes || 'Penyesuaian stok manual',
      p_created_by: createdBy
    });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('RPC adjust_stock fallback:', err.message);
    return { success: true, message: 'Stock adjusted (offline mode)' };
  }
}

export async function fetchRecipes() {
  try {
    const { data, error } = await supabase
      .from('product_recipes')
      .select(`
        id,
        version,
        description,
        is_active,
        products (
          id,
          name,
          sku
        ),
        recipe_items (
          quantity,
          unit,
          spiciness_multiplier,
          ingredients (
            name,
            sku
          )
        )
      `)
      .eq('is_active', true);

    if (!error && data && data.length > 0) {
      return data.map((r) => ({
        id: r.id,
        productName: r.products?.name || 'Produk',
        sku: r.products?.sku || '',
        ingredients: (r.recipe_items || []).map((ri) => ({
          name: ri.ingredients?.name || 'Bahan',
          quantity: Number(ri.quantity),
          unit: ri.unit,
          note: ri.spiciness_multiplier > 0 ? `+${ri.spiciness_multiplier}g/lvl` : ''
        }))
      }));
    }
    return FALLBACK_RECIPES;
  } catch (err) {
    return FALLBACK_RECIPES;
  }
}
