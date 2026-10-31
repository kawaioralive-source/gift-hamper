const { createClient } = require('@supabase/supabase-js');

async function seedSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('No Supabase credentials, skipping Supabase seeding.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const customersToSeed = [
    {
      name: 'Ananya Sharma',
      email: 'ananya.sharma@gmail.com',
      phone: '+91 98201 45821',
      role: 'user',
      created_at: '2026-09-15T10:30:00Z',
      orders: [
        {
          order_number: 'KAW26102001',
          total_amount: 14999,
          order_status: 'delivered',
          payment_status: 'paid',
          payment_method: 'Razorpay Live (UPI)',
          created_at: '2026-10-20T14:22:00Z',
          tracking_number: 'TRK-KAW26102001',
          delivery_date: '2026-10-22',
          delivery_time_slot: 'morning',
          recipient_name: 'Ananya Sharma',
          recipient_address: JSON.stringify({
            address_line_1: '402 Sea Face Towers',
            address_line_2: 'Bandra West, Sea Face Promenade',
            city: 'Mumbai',
            state: 'Maharashtra',
            postal_code: '400050',
            country: 'India',
          }),
          gift_message: 'Wishing you a grand celebration filled with warmth, love, and joyful memories!',
          items: JSON.stringify([
            {
              product_id: '14',
              name: 'Grand Royal Celebration Hamper',
              quantity: 1,
              price: 14999,
              total_price: 14999,
              image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
            }
          ]),
          payment_details: JSON.stringify({
            id: 'pay_P14999ananya',
            method: 'upi',
            vpa: 'ananya@oksbi',
            order_id: 'order_RZP1499901',
            status: 'captured',
            acquirer_data: { rrn: '984512763201', upi_transaction_id: 'UPI984512763201' },
          }),
        },
        {
          order_number: 'KAW26102502',
          total_amount: 11950,
          order_status: 'delivered',
          payment_status: 'paid',
          payment_method: 'Razorpay Live (UPI)',
          created_at: '2026-10-25T11:45:00Z',
          tracking_number: 'TRK-KAW26102502',
          delivery_date: '2026-10-26',
          delivery_time_slot: 'evening',
          recipient_name: 'Kabir Sharma',
          recipient_address: JSON.stringify({
            address_line_1: '10B Altamount Road',
            address_line_2: 'Cumballa Hill',
            city: 'Mumbai',
            state: 'Maharashtra',
            postal_code: '400026',
            country: 'India',
          }),
          gift_message: 'A toast to your outstanding career milestone and promotion! So proud of you.',
          items: JSON.stringify([
            {
              product_id: '15',
              name: 'Artisanal Chocolate & Wine Opulence',
              quantity: 1,
              price: 11950,
              total_price: 11950,
              image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
            }
          ]),
          payment_details: JSON.stringify({
            id: 'pay_P11950ananya',
            method: 'upi',
            vpa: 'ananya@oksbi',
            order_id: 'order_RZP1195002',
            status: 'captured',
            acquirer_data: { rrn: '984512763202', upi_transaction_id: 'UPI984512763202' },
          }),
        }
      ]
    },
    {
      name: 'Vikramaditya Singhania',
      email: 'vikram.singhania@apexcorp.in',
      phone: '+91 98450 12890',
      role: 'user',
      created_at: '2026-08-10T09:15:00Z',
      orders: [
        {
          order_number: 'KAW26102403',
          total_amount: 37800,
          order_status: 'dispatched',
          payment_status: 'paid',
          payment_method: 'Razorpay Live (Netbanking)',
          created_at: '2026-10-24T16:10:00Z',
          tracking_number: 'TRK-KAW26102403',
          delivery_date: '2026-10-27',
          delivery_time_slot: 'afternoon',
          recipient_name: 'Dr. Alok Verma & Rajiv Sen',
          recipient_address: JSON.stringify({
            address_line_1: 'Apex Corporate Towers, Level 14',
            address_line_2: '100 Feet Road, Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            postal_code: '560038',
            country: 'India',
          }),
          gift_message: 'In recognition of your outstanding leadership, vision, and Q3 project excellence.',
          items: JSON.stringify([
            {
              product_id: '16',
              name: 'Executive Corporate Achievement Crate',
              quantity: 2,
              price: 18900,
              total_price: 37800,
              image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd48?auto=format&fit=crop&w=800&q=80',
            }
          ]),
          payment_details: JSON.stringify({
            id: 'pay_P37800vikram',
            method: 'netbanking',
            bank: 'HDFC Bank Corporate',
            order_id: 'order_RZP3780003',
            status: 'captured',
          }),
        },
        {
          order_number: 'KAW26102604',
          total_amount: 22500,
          order_status: 'processing',
          payment_status: 'paid',
          payment_method: 'Razorpay Live (Card)',
          created_at: '2026-10-26T09:00:00Z',
          tracking_number: 'TRK-KAW26102604',
          delivery_date: '2026-10-28',
          delivery_time_slot: 'morning',
          recipient_name: 'Vikramaditya Singhania',
          recipient_address: JSON.stringify({
            address_line_1: 'Prestige Golfshire Villa 14',
            address_line_2: 'Nandi Hills Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            postal_code: '562164',
            country: 'India',
          }),
          gift_message: 'Curated reserve selection for the Board of Directors weekend gathering.',
          items: JSON.stringify([
            {
              product_id: '21',
              name: 'Golden Gourmet Caviar & Cheese Trunk',
              quantity: 1,
              price: 22500,
              total_price: 22500,
              image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
            }
          ]),
          payment_details: JSON.stringify({
            id: 'pay_P22500vikram',
            method: 'card',
            card_last4: '4242',
            card_network: 'Visa Infinite',
            order_id: 'order_RZP2250004',
            status: 'captured',
          }),
        }
      ]
    },
    {
      name: 'Priya Mehta',
      email: 'priya.mehta@delhicapital.org',
      phone: '+91 98110 93452',
      role: 'user',
      created_at: '2026-10-01T12:00:00Z',
      orders: [
        {
          order_number: 'KAW26102605',
          total_amount: 7999,
          order_status: 'confirmed',
          payment_status: 'paid',
          payment_method: 'Razorpay Live (UPI)',
          created_at: '2026-10-26T15:30:00Z',
          tracking_number: 'TRK-KAW26102605',
          delivery_date: '2026-10-27',
          delivery_time_slot: 'evening',
          recipient_name: 'Riya Mehta',
          recipient_address: JSON.stringify({
            address_line_1: '7 Golf Links',
            address_line_2: 'Near Lodhi Gardens',
            city: 'New Delhi',
            state: 'Delhi',
            postal_code: '110003',
            country: 'India',
          }),
          gift_message: 'Happy 25th Birthday dearest Riya! May your year ahead be sweet, vibrant, and sparkling.',
          items: JSON.stringify([
            {
              product_id: '17',
              name: 'Sweet Birthday Delight Basket',
              quantity: 1,
              price: 7999,
              total_price: 7999,
              image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
            }
          ]),
          payment_details: JSON.stringify({
            id: 'pay_P7999priya',
            method: 'upi',
            vpa: 'priyamehta@paytm',
            order_id: 'order_RZP799905',
            status: 'captured',
            acquirer_data: { rrn: '984512763205', upi_transaction_id: 'UPI984512763205' },
          }),
        }
      ]
    }
  ];

  for (const cust of customersToSeed) {
    let { data: existingUser } = await supabase.from('users').select('id').eq('email', cust.email).maybeSingle();
    let uid = existingUser?.id;

    if (!uid) {
      const { data: newUser, error: uErr } = await supabase.from('users').insert({
        name: cust.name,
        email: cust.email,
        password: cust.password || 'Password123!',
        role: cust.role,
        created_at: cust.created_at,
      }).select('id').single();

      if (!uErr && newUser) {
        uid = newUser.id;
        console.log(`[Supabase] Created user ${cust.name} (${uid})`);
      } else {
        console.log(`[Supabase] User insert message:`, uErr?.message);
      }
    } else {
      console.log(`[Supabase] User ${cust.name} already exists (${uid})`);
    }

    for (const ord of cust.orders) {
      const { error: oErr } = await supabase.from('orders').upsert({
        order_number: ord.order_number,
        user_id: uid ? String(uid) : null,
        customer_name: cust.name,
        customer_email: cust.email,
        recipient_name: ord.recipient_name,
        recipient_address: ord.recipient_address,
        delivery_date: ord.delivery_date,
        delivery_slot: ord.delivery_time_slot,
        delivery_time_slot: ord.delivery_time_slot,
        gift_message: ord.gift_message,
        items: ord.items,
        total_amount: ord.total_amount,
        payment_status: ord.payment_status,
        order_status: ord.order_status,
        tracking_number: ord.tracking_number,
        payment_method: ord.payment_method,
        payment_details: ord.payment_details,
        created_at: ord.created_at,
      }, { onConflict: 'order_number' });

      if (oErr) {
        console.error(`[Supabase] Error seeding order ${ord.order_number}:`, oErr.message);
      } else {
        console.log(`[Supabase] Seeded order ${ord.order_number} for ${cust.name}`);
      }
    }
  }

  console.log('Supabase seeding done!');
}

seedSupabase().catch(console.error);
