import { supabase } from '../supabaseClient';

export async function createOrder(orderPayload) {
  const {
    branchId,
    customerName,
    customerPhone,
    customerNote,
    items,
    totalPrice,
    paymentMethod = 'cash',
    paymentStatus = 'pending',
    orderStatus = 'waiting',
    paymentIntentId = null,
    userId = null
  } = orderPayload;

  const orderNumber = orderPayload.orderNumber || `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const menuNames = (items || []).map((i) => `${i.name} (${i.quantity}x)`).join(', ') || 'Menu Pesanan';

  // 1. Direct Supabase Insert with exact table schema
  try {
    const payload = {
      'order id': orderNumber,
      buyer_name: customerName || 'Pelanggan',
      menu_name: menuNames,
      status: orderStatus === 'pending' ? 'waiting' : orderStatus,
      total_price: Math.round(Number(totalPrice) || 0),
      payment_method: paymentMethod || 'cash',
      payment_status: paymentStatus || 'pending'
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      console.log('Pesanan berhasil disimpan di Supabase:', data);
      const createdOrder = {
        id: data.id,
        orderId: data['order id'] || orderNumber,
        orderNumber: data['order id'] || orderNumber,
        branchId: branchId || 'a0000000-0000-0000-0000-000000000001',
        branchName: orderPayload.branchName || 'Cabang Tunjungan',
        customerName: data.buyer_name || customerName,
        customerPhone,
        notes: customerNote,
        items,
        totalPrice: Number(data.total_price || totalPrice),
        paymentMethod: data.payment_method || paymentMethod,
        paymentStatus: data.payment_status || paymentStatus,
        status: data.status || 'waiting',
        createdAt: data.created_at || new Date().toISOString()
      };

      return {
        success: true,
        orderId: createdOrder.orderId,
        orderNumber: createdOrder.orderNumber,
        order: createdOrder
      };
    } else if (error) {
      console.error('Supabase insert error in createOrder:', error);
    }
  } catch (err) {
    console.warn('Gagal koneksi ke Supabase:', err.message);
  }

  // 2. Local fallback if offline or connection fails
  const fallbackOrder = {
    id: `ord_${Date.now()}`,
    orderId: orderNumber,
    orderNumber: orderNumber,
    branchId: branchId || 'a0000000-0000-0000-0000-000000000001',
    branchName: orderPayload.branchName || 'Cabang Tunjungan',
    customerName: customerName || 'Pelanggan',
    customerPhone,
    customerNote,
    items,
    totalPrice,
    paymentMethod,
    paymentStatus,
    status: orderStatus === 'pending' ? 'waiting' : orderStatus,
    paymentIntentId,
    createdAt: new Date().toISOString()
  };

  try {
    const saved = localStorage.getItem('orders');
    const orders = saved ? JSON.parse(saved) : [];
    localStorage.setItem('orders', JSON.stringify([fallbackOrder, ...orders]));
  } catch (e) {}

  return {
    success: true,
    orderId: fallbackOrder.orderId,
    orderNumber: fallbackOrder.orderNumber,
    order: fallbackOrder
  };
}

export async function fetchOrders(branchId = null) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((o) => {
        const orderId = o['order id'] || o.order_id || o.order_number || (o.id ? String(o.id) : `ORD-${Date.now()}`);
        const customerName = o.buyer_name || o.customer_name || 'Pelanggan';
        const totalPrice = Number(o.total_price || o.total || 0);
        const status = o.status || o.order_status || 'waiting';
        const paymentStatus = o.payment_status || o['payment status'] || 'pending';
        const paymentMethod = o.payment_method || o.payment_methoc || 'cash';

        // Parse items
        let items = [];
        if (o.items && Array.isArray(o.items)) {
          items = o.items;
        } else if (o.menu_name) {
          items = o.menu_name.split(',').map((part) => {
            const trimmed = part.trim();
            const match = trimmed.match(/^(.*?)(?:\s*\((\d+)x\))?$/);
            const name = match ? match[1].trim() : trimmed;
            const qty = match && match[2] ? parseInt(match[2], 10) : 1;
            return {
              name,
              price: Math.round(totalPrice / Math.max(qty, 1)),
              quantity: qty
            };
          });
        }

        return {
          id: o.id,
          orderId,
          orderNumber: orderId,
          branchId: o.branch_id || 'a0000000-0000-0000-0000-000000000001',
          branchName: o.branch_name || 'Cabang Tunjungan',
          customerName,
          customerPhone: o.customer_phone || '',
          notes: o.customer_note || '',
          totalPrice,
          paymentMethod,
          paymentStatus,
          status,
          createdAt: o.created_at,
          items
        };
      });
    }
  } catch (err) {
    console.warn('Fallback loading orders from localStorage:', err.message);
  }

  try {
    const saved = localStorage.getItem('orders');
    if (saved) {
      const orders = JSON.parse(saved);
      if (branchId) {
        return orders.filter((o) => !o.branchId || o.branchId === branchId);
      }
      return orders;
    }
  } catch (e) {}

  return [];
}

export async function deleteOrder(orderId) {
  try {
    let query;
    if (typeof orderId === 'number' || (!isNaN(Number(orderId)) && !String(orderId).startsWith('ORD-'))) {
      query = supabase.from('orders').delete().eq('id', Number(orderId));
    } else {
      query = supabase.from('orders').delete().eq('order id', String(orderId));
    }

    const { error } = await query;
    if (error) {
      console.warn('Delete order from Supabase failed:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.warn('Error in deleteOrder:', err.message);
    return { success: false, error: err.message };
  }
}

export async function updateOrderStatus(orderId, newStatus, newPaymentStatus = null) {
  try {
    const updatePayload = { status: newStatus };
    if (newPaymentStatus) {
      updatePayload.payment_status = newPaymentStatus;
    }

    // Try updating by id or "order id"
    let query;
    if (typeof orderId === 'number' || (!isNaN(Number(orderId)) && !String(orderId).startsWith('ORD-'))) {
      query = supabase.from('orders').update(updatePayload).eq('id', Number(orderId));
    } else {
      query = supabase.from('orders').update(updatePayload).eq('order id', String(orderId));
    }

    const { error } = await query;
    if (error) {
      console.warn('Update order status in Supabase failed:', error.message);
    }
  } catch (err) {
    console.warn('Error in updateOrderStatus:', err.message);
  }

  return { success: true };
}
