import { supabase } from '../supabaseClient';

export async function createOrder(orderPayload) {
  const {
    branchId,
    customerName,
    customerPhone,
    customerNote,
    items,
    totalPrice,
    paymentMethod,
    paymentStatus = 'pending',
    orderStatus = 'pending',
    orderType = 'pickup',
    paymentIntentId = null,
    userId = null,
    latitude = null,
    longitude = null
  } = orderPayload;

  const idempotencyKey = orderPayload.idempotencyKey || `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const orderNumber = orderPayload.orderNumber || `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const pOrder = {
    order_number: orderNumber,
    user_id: userId,
    branch_id: branchId,
    subtotal: totalPrice,
    discount: 0,
    tax: 0,
    delivery_fee: 0,
    total: totalPrice,
    payment_status: paymentStatus,
    order_status: orderStatus,
    order_type: orderType,
    payment_method: paymentMethod,
    customer_name: customerName,
    customer_phone: customerPhone || null,
    customer_note: customerNote || null,
    latitude: latitude || null,
    longitude: longitude || null,
    idempotency_key: idempotencyKey,
    payment_intent_id: paymentIntentId
  };

  const pItems = items.map((item) => ({
    product_id: item.id,
    product_name_snapshot: item.name,
    unit_price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
    spiciness_level: item.level || null,
    notes: item.notes || null
  }));

  try {
    // 1. Try atomic Supabase RPC
    const { data, error } = await supabase.rpc('create_order_transaction', {
      p_order: pOrder,
      p_items: pItems,
      p_created_by: userId
    });

    if (error) {
      console.warn('RPC create_order_transaction error:', error.message);
      throw error;
    }

    if (data && data.order) {
      return {
        success: true,
        orderId: data.order.id,
        orderNumber: data.order.order_number,
        order: {
          ...data.order,
          orderId: data.order.id,
          orderNumber: data.order.order_number,
          totalPrice: Number(data.order.total),
          items,
          customerName,
          status: data.order.order_status,
          paymentStatus: data.order.payment_status,
          createdAt: data.order.created_at
        }
      };
    }
  } catch (err) {
    console.warn('Falling back to local order persistence:', err.message);
  }

  // Fallback local persistence
  const fallbackOrder = {
    id: `ord_${Date.now()}`,
    orderId: orderNumber,
    orderNumber: orderNumber,
    branchId: branchId || 'a0000000-0000-0000-0000-000000000001',
    customerName,
    customerPhone,
    customerNote,
    items,
    totalPrice,
    paymentMethod,
    paymentStatus,
    status: orderStatus === 'pending' && paymentStatus === 'completed' ? 'processing' : orderStatus,
    paymentIntentId,
    createdAt: new Date().toISOString()
  };

  try {
    const saved = localStorage.getItem('orders');
    const orders = saved ? JSON.parse(saved) : [];
    localStorage.setItem('orders', JSON.stringify([fallbackOrder, ...orders]));
  } catch (e) {
    // ignore
  }

  return {
    success: true,
    orderId: fallbackOrder.orderId,
    orderNumber: fallbackOrder.orderNumber,
    order: fallbackOrder
  };
}

export async function fetchOrders(branchId = null) {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        branches (
          id,
          name,
          code
        ),
        order_items (
          id,
          product_name_snapshot,
          unit_price,
          quantity,
          subtotal,
          spiciness_level,
          notes
        )
      `)
      .order('created_at', { ascending: false });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return data.map((o) => ({
        id: o.id,
        orderId: o.order_number || o.id,
        orderNumber: o.order_number || o.id,
        branchId: o.branch_id,
        branchName: o.branches?.name || 'Cabang',
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        notes: o.customer_note,
        totalPrice: Number(o.total),
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        status: o.order_status,
        createdAt: o.created_at,
        items: (o.order_items || []).map((oi) => ({
          name: oi.product_name_snapshot,
          price: Number(oi.unit_price),
          quantity: oi.quantity,
          level: oi.spiciness_level
        }))
      }));
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

export async function updateOrderStatus(orderId, newStatus, newPaymentStatus = null) {
  try {
    const updatePayload = { order_status: newStatus };
    if (newPaymentStatus) {
      updatePayload.payment_status = newPaymentStatus;
    }

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .or(`id.eq.${orderId},order_number.eq.${orderId}`);

    if (error) {
      console.warn('Update order status in Supabase failed:', error.message);
    }
  } catch (err) {}

  return { success: true };
}
