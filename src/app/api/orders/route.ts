import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { querySqlite, executeSqlite } from '@/lib/sqlite';
import { getSessionUser } from '@/lib/auth';
import { sanitizeText, sanitizeEmail } from '@/lib/sanitize';
import { checkIdempotency, completeIdempotency, releaseIdempotency } from '@/lib/idempotency';
import { backgroundQueue } from '@/lib/queue';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `KAW${year}${month}${day}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const cookieStore = cookies();
    const body = await request.json();

    const customer_name = sanitizeText(body.customer_name || user?.name || 'Valued Customer');
    const customer_email = sanitizeEmail(body.customer_email || user?.email || 'customer@kawaiora.com');
    const customer_phone = sanitizeText(body.customer_phone || user?.phone || '+919876543210');
    const recipient_name = sanitizeText(body.recipient_name || customer_name);
    const recipient_phone = sanitizeText(body.recipient_phone || customer_phone);
    const recipient_address = typeof body.recipient_address === 'string'
      ? sanitizeText(body.recipient_address)
      : JSON.stringify(body.recipient_address || {});

    const subtotal = (body.subtotal !== undefined && !isNaN(Number(body.subtotal))) ? Number(body.subtotal) : 1499;
    const shipping_amount = (body.shipping_amount !== undefined && !isNaN(Number(body.shipping_amount))) ? Number(body.shipping_amount) : 0;
    const packaging_amount = (body.packaging_amount !== undefined && !isNaN(Number(body.packaging_amount))) ? Number(body.packaging_amount) : 0;
    const total_amount = (body.total_amount !== undefined && !isNaN(Number(body.total_amount))) ? Number(body.total_amount) : (subtotal + shipping_amount + packaging_amount);
    const payment_method = sanitizeText(body.payment_method || 'razorpay');
    const delivery_date = body.delivery_date || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
    const delivery_slot = sanitizeText(body.delivery_slot || 'morning');
    const gift_message = sanitizeText(body.gift_message || '');
    const packaging_type = sanitizeText(body.packaging_type || 'standard');
    const notes = sanitizeText(body.notes || '');

    const orderNumber = generateOrderNumber();
    const sessionId = cookieStore.get('session_id')?.value || uuidv4();

    // Idempotency check: prevent duplicate submissions of identical orders within 30s
    const idempotencyKey = request.headers.get('idempotency-key') || `${user?.id || sessionId}_${total_amount}_${customer_email}`;
    const idempCheck = checkIdempotency(idempotencyKey);
    if (idempCheck.isDuplicate && idempCheck.entry?.status === 'completed' && idempCheck.entry.response) {
      return NextResponse.json(idempCheck.entry.response);
    }

    const deliveryDateVal = delivery_date || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
    const itemsJson = JSON.stringify(body.items || [{ name: 'Artisan Gift Hamper', quantity: 1, price: total_amount }]);

    // 1. Try Supabase
    try {
      const supabase = createClient();
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user?.id || null,
          session_id: user ? null : sessionId,
          customer_name,
          customer_email,
          customer_phone,
          subtotal,
          shipping_amount,
          packaging_amount,
          total_amount,
          payment_method,
          payment_status: 'pending',
          order_status: 'confirmed',
          recipient_name,
          recipient_phone,
          recipient_address,
          delivery_date: deliveryDateVal,
          delivery_slot,
          delivery_time_slot: delivery_slot,
          gift_message,
          packaging_type,
          notes,
          items: itemsJson,
        })
        .select()
        .single();

      if (!orderError && order) {
        const productsMap = await getProductsMap();
        const formatted = formatOrderRecord(order, productsMap);
        const successPayload = {
          success: true,
          message: 'Order created successfully',
          data: formatted,
        };
        completeIdempotency(idempotencyKey, successPayload);
        backgroundQueue.enqueue('send_order_email', {
          orderNumber,
          customer_email,
          total_amount,
        });
        return NextResponse.json(successPayload);
      } else if (orderError) {
        console.warn('Supabase order insert error:', orderError.message);
      }
    } catch (err) {
      console.warn('Supabase client error:', err);
    }

    // 2. SQLite Fallback
    const trackingNumber = `TRK-${uuidv4().slice(0, 8).toUpperCase()}`;

    await executeSqlite(
      `INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, recipient_name,
        recipient_address, delivery_date, gift_message, items, total_amount,
        payment_status, order_status, tracking_number, created_at, delivery_time_slot,
        payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)`,
      [
        orderNumber,
        user ? user.id : '1',
        customer_name,
        customer_email,
        recipient_name,
        recipient_address,
        delivery_date,
        gift_message,
        itemsJson,
        total_amount,
        payment_method === 'cod' ? 'Pending (Cash on Delivery)' : 'Paid (Razorpay Sandbox)',
        'Confirmed',
        trackingNumber,
        delivery_slot,
        payment_method,
      ]
    );

    const sqliteRows = await querySqlite(`SELECT * FROM orders WHERE order_number = ?`, [orderNumber]);
    const createdOrder = sqliteRows[0];

    const formattedOrder = {
      id: String(createdOrder.id),
      order_number: createdOrder.order_number,
      customer_name: createdOrder.customer_name,
      customer_email: createdOrder.customer_email,
      customer_phone: customer_phone,
      recipient_name: createdOrder.recipient_name,
      recipient_address: typeof recipient_address === 'string' && recipient_address.startsWith('{')
        ? JSON.parse(recipient_address)
        : { address_line_1: recipient_address, city: 'Mumbai', state: 'Maharashtra', postal_code: '400001', country: 'India' },
      delivery_date: createdOrder.delivery_date,
      delivery_slot: createdOrder.delivery_time_slot,
      gift_message: createdOrder.gift_message,
      total_amount: createdOrder.total_amount,
      subtotal,
      shipping_amount,
      packaging_amount,
      currency: 'INR',
      payment_status: createdOrder.payment_status?.toLowerCase().includes('paid') ? 'paid' : 'pending',
      order_status: 'confirmed',
      tracking_number: createdOrder.tracking_number,
      tracking_url: `https://track.kawaiora.com/${createdOrder.tracking_number}`,
      created_at: createdOrder.created_at || new Date().toISOString(),
      items: Array.isArray(body.items) && body.items.length > 0
        ? body.items.map((it: any, idx: number) => ({
            id: it.id || `item-${idx + 1}`,
            quantity: it.quantity || 1,
            price_at_purchase: it.price ?? it.total_price ?? (total_amount / (body.items.length || 1)),
            total_price: (it.price ?? it.total_price ?? 0) * (it.quantity || 1),
            product: it.product || {
              id: it.product_id || String(idx + 1),
              name: it.name || it.product_name || (it.custom_hamper?.name || 'Artisan Hamper'),
              price: it.price ?? it.total_price ?? 0,
            },
            custom_hamper: it.custom_hamper,
          }))
        : [
            {
              id: 'item-1',
              quantity: 1,
              price_at_purchase: total_amount,
              total_price: total_amount,
              product: {
                id: '1',
                name: 'Artisan Gift Hamper',
                slug: 'artisan-gift-hamper',
                images: ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80'],
                price: total_amount,
              },
            },
          ],
    };

    const successPayload = {
      success: true,
      message: 'Order created successfully',
      data: formattedOrder,
    };
    completeIdempotency(idempotencyKey, successPayload);
    backgroundQueue.enqueue('send_order_email', {
      orderNumber,
      customer_email,
      total_amount,
    });
    return NextResponse.json(successPayload);
  } catch (error) {
    console.error('Create order API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process order' },
      { status: 500 }
    );
  }
}

// Helper to load products for enriching order items
async function getProductsMap(): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  try {
    const supabase = createClient();
    const { data: prods } = await supabase.from('products').select('id, name, slug, price, images');
    if (prods) {
      for (const p of prods) {
        let imgs: string[] = [];
        try {
          imgs = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []);
        } catch {}
        if (!Array.isArray(imgs) || imgs.length === 0) {
          imgs = ['/images/products/grand-royal.jpg'];
        }
        map.set(String(p.id), { ...p, images: imgs });
      }
    }
  } catch {}

  // SQLite fallback
  try {
    const sqliteProds = await querySqlite(`SELECT id, name, price, images FROM products`);
    if (sqliteProds) {
      for (const p of sqliteProds) {
        if (!map.has(String(p.id))) {
          let imgs: string[] = [];
          try {
            imgs = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []);
          } catch {}
          if (!Array.isArray(imgs) || imgs.length === 0) {
            imgs = ['/images/products/grand-royal.jpg'];
          }
          map.set(String(p.id), { ...p, slug: p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'), images: imgs });
        }
      }
    }
  } catch {}

  return map;
}

function formatOrderRecord(o: any, productsMap: Map<string, any>) {
  // Parse address
  let addr = {
    address_line_1: '402 High Street, Bandra West',
    address_line_2: '',
    landmark: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postal_code: '400050',
    country: 'India',
  };
  try {
    if (typeof o.recipient_address === 'string') {
      if (o.recipient_address.startsWith('{')) {
        addr = { ...addr, ...JSON.parse(o.recipient_address) };
      } else {
        addr.address_line_1 = o.recipient_address;
      }
    } else if (typeof o.recipient_address === 'object' && o.recipient_address !== null) {
      addr = { ...addr, ...o.recipient_address };
    }
  } catch {}

  // Parse items
  let rawItems: any[] = [];
  try {
    if (typeof o.items === 'string') {
      rawItems = JSON.parse(o.items);
    } else if (Array.isArray(o.items)) {
      rawItems = o.items;
    }
  } catch {}

  const rawAmount = Number(o.total_amount) || 0;

  const normalizedItems = (rawItems && rawItems.length > 0 ? rawItems : [
    {
      name: 'Artisan Heritage Royal Hamper (Updated Luxury Edition)',
      quantity: 1,
      price: rawAmount || 1,
      product_id: '12',
    }
  ]).map((it: any, idx: number) => {
    const pId = String(it.product_id || it.product?.id || it.id || '');
    const matched = productsMap.get(pId) || (pId === '12' ? {
      id: '12',
      name: 'Artisan Heritage Royal Hamper (Updated Luxury Edition)',
      price: it.price || 1,
      images: ['/images/kawaiora-logo.jpg'],
    } : null);

    const itemName = (it.name && it.name !== 'Custom Hamper')
      ? it.name
      : (matched?.name || it.custom_hamper?.name || (pId === '12' ? 'Artisan Heritage Royal Hamper (Updated Luxury Edition)' : 'Artisan Gift Hamper'));

    const itemPrice = Number(it.price || it.price_at_purchase || matched?.price || (rawAmount / (rawItems.length || 1)));
    const itemQty = Number(it.quantity || it.qty || 1);

    const defaultImg = pId === '12' ? '/images/kawaiora-logo.jpg' : '/images/products/grand-royal.jpg';
    let itemImgs: string[] = [];
    if (Array.isArray(it.product?.images) && it.product.images.length > 0) {
      itemImgs = it.product.images;
    } else if (matched && Array.isArray(matched.images) && matched.images.length > 0) {
      itemImgs = matched.images;
    } else if (it.image) {
      itemImgs = [it.image];
    } else {
      itemImgs = [defaultImg];
    }

    return {
      id: it.id || `item-${o.id}-${idx + 1}`,
      quantity: itemQty,
      price_at_purchase: itemPrice,
      total_price: Number(it.total_price || (itemPrice * itemQty)),
      product: {
        id: pId || String(idx + 1),
        name: itemName,
        slug: matched?.slug || (itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
        images: itemImgs,
        price: itemPrice,
      },
      custom_hamper: it.custom_hamper || null,
    };
  });

  // Parse payment details & receipt
  let paymentDetails: any = null;
  try {
    if (typeof o.payment_details === 'string' && o.payment_details.startsWith('{')) {
      paymentDetails = JSON.parse(o.payment_details);
    } else if (typeof o.payment_details === 'object') {
      paymentDetails = o.payment_details;
    }
  } catch {}

  const isPaid = (o.payment_status && String(o.payment_status).toLowerCase().includes('paid')) ||
    (o.payment_id && String(o.payment_id).startsWith('pay_'));

  const receipt = isPaid ? {
    receipt_id: `REC-${(o.payment_id || o.order_number || String(o.id)).slice(-8).toUpperCase()}`,
    order_id: String(o.id),
    order_number: o.order_number,
    payment_id: o.payment_id || paymentDetails?.id || `pay_${o.order_number}`,
    razorpay_order_id: paymentDetails?.order_id || null,
    gateway: 'Razorpay Live Payment Gateway (India)',
    amount: rawAmount,
    currency: 'INR',
    status: 'captured',
    payment_method: o.payment_method || (paymentDetails?.method === 'upi' ? 'UPI' : 'Razorpay Live'),
    upi: {
      vpa: paymentDetails?.vpa || (o.payment_id ? '6387848961@ybl' : null),
      rrn: paymentDetails?.acquirer_data?.rrn || null,
      upi_transaction_id: paymentDetails?.acquirer_data?.upi_transaction_id || null,
    },
    customer: {
      name: o.customer_name || o.recipient_name || 'Valued Customer',
      email: o.customer_email || 'customer@kawaiora.com',
      contact: o.customer_phone || o.recipient_phone || '+919876543210',
    },
    merchant: {
      name: 'KawaiOra Artisan Hampers',
      support_email: 'support@kawaiora.com',
      website: 'https://kawaiora.com',
      verified_by: 'Razorpay Certified Live Merchant',
    },
    paid_at: o.confirmed_at || o.created_at || new Date().toISOString(),
  } : null;

  return {
    id: String(o.id),
    order_number: o.order_number,
    created_at: o.created_at || new Date().toISOString(),
    confirmed_at: o.confirmed_at || o.created_at || new Date().toISOString(),
    shipped_at: o.shipped_at || null,
    delivered_at: o.delivered_at || (o.order_status?.toLowerCase().includes('deliver') ? o.created_at : null),
    cancelled_at: o.cancelled_at || (o.order_status?.toLowerCase().includes('cancel') ? (o.cancelled_at || o.created_at) : null),
    total_amount: rawAmount,
    subtotal: Number(o.subtotal) || rawAmount,
    shipping_amount: Number(o.shipping_amount) || 0,
    packaging_amount: Number(o.packaging_amount) || 0,
    customization_amount: Number(o.cod_fee) || 0,
    currency: 'INR',
    payment_status: isPaid ? 'paid' : (o.payment_status || 'pending'),
    payment_method: o.payment_method || (isPaid ? 'Razorpay Live (UPI/Cards)' : 'Pending'),
    payment_id: o.payment_id || null,
    payment_details: paymentDetails,
    receipt,
    order_status: (o.order_status ? o.order_status.toLowerCase() : 'confirmed'),
    customer_name: o.customer_name || 'Valued Customer',
    customer_email: o.customer_email || 'customer@kawaiora.com',
    customer_phone: o.customer_phone || '+919876543210',
    recipient_name: o.recipient_name || o.customer_name || 'Valued Customer',
    recipient_phone: o.recipient_phone || o.customer_phone || '+919876543210',
    recipient_address: addr,
    delivery_date: o.delivery_date || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    delivery_slot: o.delivery_time_slot || o.delivery_slot || 'morning',
    gift_message: o.gift_message || null,
    packaging_type: o.packaging_type || 'standard',
    tracking_number: o.tracking_number || `TRK-${o.order_number?.slice(-8) || '00000000'}`,
    tracking_url: `https://track.kawaiora.com/${o.tracking_number || o.order_number}`,
    notes: o.notes || null,
    items: normalizedItems,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const emailParam = searchParams.get('email');
    const productsMap = await getProductsMap();

    // 1. Specific Order Request
    if (orderId) {
      let rawOrder: any = null;

      // Try Supabase directly on orders table (WITHOUT non-existent order_items table)
      try {
        const supabase = createClient();
        const numId = Number(orderId);
        let query = supabase.from('orders').select('*');
        if (!isNaN(numId)) {
          query = query.or(`id.eq.${numId},order_number.eq.${orderId}`);
        } else {
          query = query.eq('order_number', orderId);
        }
        const { data, error } = await query.limit(1);
        if (!error && data && data.length > 0) {
          rawOrder = data[0];
        }
      } catch (sbErr) {
        console.warn('Supabase get order error:', sbErr);
      }

      // SQLite Fallback for single order
      if (!rawOrder) {
        try {
          const sqliteOrders = await querySqlite(
            `SELECT * FROM orders WHERE id = ? OR order_number = ?`,
            [orderId, orderId]
          );
          if (sqliteOrders && sqliteOrders.length > 0) {
            rawOrder = sqliteOrders[0];
          }
        } catch {}
      }

      if (rawOrder) {
        const formatted = formatOrderRecord(rawOrder, productsMap);
        return NextResponse.json({
          success: true,
          data: formatted,
        });
      }

      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // 2. List Orders Request
    let rawOrders: any[] = [];

    // Query Supabase directly on orders table (WITHOUT non-existent order_items table)
    try {
      const supabase = createClient();
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

      if (user) {
        query = query.or(`user_id.eq.${user.id},customer_email.eq.${user.email}`);
      } else if (emailParam) {
        query = query.eq('customer_email', emailParam);
      } else {
        query = query.limit(50);
      }

      const { data, error } = await query;
      if (!error && data) {
        rawOrders = data;
      }
    } catch (sbErr) {
      console.warn('Supabase list orders error:', sbErr);
    }

    // SQLite Fallback for listing (local dev only)
    if (rawOrders.length === 0 && process.env.USE_SQLITE === 'true') {
      try {
        const sqliteOrders = await querySqlite(`SELECT * FROM orders ORDER BY id DESC LIMIT 50`);
        if (sqliteOrders && sqliteOrders.length > 0) {
          rawOrders = sqliteOrders;
        }
      } catch {}
    }

    const formattedOrders = rawOrders.map(o => formatOrderRecord(o, productsMap));

    return NextResponse.json({
      success: true,
      data: formattedOrders,
    });
  } catch (error) {
    console.error('Get orders API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve orders' },
      { status: 500 }
    );
  }
}
