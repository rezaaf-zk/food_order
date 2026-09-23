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

  const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  const pOrder = {
    order_number: orderNumber,
    user_id: isUuid(userId) ? userId : null,
    branch_id: isUuid(branchId) ? branchId : 'a0000000-0000-0000-0000-000000000001',
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
    product_id: isUuid(item.id) ? item.id : null,
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
      p_created_by: isUuid(userId) ? userId : null
    });

    if (error) {
      console.warn('RPC create_order_transaction error:', error.message);
      throw error;
    }

    if (data && (data.order || data.order_id)) {
      const createdOrd = data.order || {};
      return {
        success: true,
        orderId: createdOrd.id || data.order_id,
        orderNumber: createdOrd.order_number || data.order_number || orderNumber,
        order: {
          ...createdOrd,
          orderId: createdOrd.id || data.order_id,
          orderNumber: createdOrd.order_number || data.order_number || orderNumber,
          totalPrice: Number(createdOrd.total || totalPrice),
          items,
          customerName,
          status: createdOrd.order_status || orderStatus,
          paymentStatus: createdOrd.payment_status || paymentStatus,
          createdAt: createdOrd.created_at || new Date().toISOString()
        }
      };
    }
  } catch (err) {
    console.warn('RPC failed, trying direct Supabase table insert fallback:', err.message);
  }

  // 2. Direct Supabase insert fallback
  try {
    // Try Variant A: Rich Schema (customer_name, total, etc.)
    const { data: directOrder, error: directErr } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        branch_id: isUuid(branchId) ? branchId : null,
        subtotal: totalPrice,
        total: totalPrice,
        payment_status: paymentStatus,
        order_status: orderStatus,
        order_type: orderType,
        payment_method: paymentMethod,
        customer_name: customerName,
        customer_phone: customerPhone || null,
        customer_note: customerNote || null,
        idempotency_key: idempotencyKey
      })
      .select()
      .single();

    if (!directErr && directOrder) {
      const itemsToInsert = items.map((item) => ({
        order_id: directOrder.id,
        product_id: isUuid(item.id) ? item.id : null,
        product_name_snapshot: item.name,
        unit_price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        spiciness_level: item.level || null,
        notes: item.notes || null
      }));

      await supabase.from('order_items').insert(itemsToInsert);

      return {
        success: true,
        orderId: directOrder.id,
        orderNumber: directOrder.order_number || orderNumber,
        order: {
          ...directOrder,
          orderId: directOrder.id,
          orderNumber: directOrder.order_number || orderNumber,
          totalPrice: Number(directOrder.total),
          items,
          customerName,
          status: directOrder.order_status,
          paymentStatus: directOrder.payment_status,
          createdAt: directOrder.created_at
        }
      };
    } else if (directErr) {
      // If error is column mismatch (e.g. table has buyer_name / menu_name), try Variant B (Simple Schema)
      console.warn('Rich schema insert failed, trying simple schema fallback:', directErr.message);

      const menuNames = items.map((i) => `${i.name} (${i.quantity}x)`).join(', ');
      const highestLevel = items.find((i) => i.level)?.level || 0;

      const { data: simpleOrder, error: simpleErr } = await supabase
        .from('orders')
        .insert({
          buyer_name: customerName,
          menu_name: menuNames,
          spiciness_level: highestLevel ? String(highestLevel) : null,
          total_price: totalPrice,
          payment_method: paymentMethod,
          order_status: orderStatus
        })
        .select()
        .single();

      if (!simpleErr && simpleOrder) {
        return {
          success: true,
          orderId: simpleOrder.id || orderNumber,
          orderNumber: orderNumber,
          order: {
            ...simpleOrder,
            id: simpleOrder.id,
            orderId: simpleOrder.id || orderNumber,
            orderNumber: orderNumber,
            totalPrice: Number(simpleOrder.total_price || totalPrice),
            items,
            customerName: simpleOrder.buyer_name || customerName,
            status: simpleOrder.order_status || orderStatus,
            paymentStatus: paymentStatus,
            createdAt: simpleOrder.created_at || new Date().toISOString()
          }
        };
      } else if (simpleErr) {
        console.error('All Supabase insert attempts failed:', simpleErr.message);
      }
    }
  } catch (err) {
    console.warn('Direct insert fallback failed:', err.message);
  }

  // 3. Last-resort fallback: local persistence (only when offline or RLS blocks)
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
      .select('*')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return data.map((o) => {
        const customerName = o.customer_name || o.buyer_name || 'Pelanggan';
        const totalPrice = Number(o.total || o.total_price || 0);
        const paymentMethod = o.payment_method || 'cash';
        const paymentStatus = o.payment_status || (o.order_status === 'completed' ? 'completed' : 'pending');
        const status = o.order_status || 'pending';
        const orderId = o.order_number || o.id?.toString() || `ORD-${Date.now()}`;

        // Parse items if available or reconstruct from menu_name
        let items = [];
        if (o.order_items && Array.isArray(o.order_items) && o.order_items.length > 0) {
          items = o.order_items.map((oi) => ({
            name: oi.product_name_snapshot || oi.name,
            price: Number(oi.unit_price || oi.price || 0),
            quantity: oi.quantity || 1,
            level: oi.spiciness_level
          }));
        } else if (o.items && Array.isArray(o.items)) {
          items = o.items;
        } else if (o.menu_name) {
          items = [
            {
              name: o.menu_name,
              price: totalPrice,
              quantity: 1,
              level: o.spiciness_level
            }
          ];
        }

        return {
          id: o.id,
          orderId,
          orderNumber: orderId,
          branchId: o.branch_id || 'a0000000-0000-0000-0000-000000000001',
          branchName: o.branch_name || 'Cabang Tunjungan',
          customerName,
          customerPhone: o.customer_phone,
          notes: o.customer_note,
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
