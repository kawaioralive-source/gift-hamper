import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await getSessionUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const startDateISO = startDate.toISOString();

    // Fetch all analytics data in parallel
    const [
      revenueOverTimeRes,
      topProductsRes,
      topCategoriesRes,
      topOccasionsRes,
      customerMetricsRes,
      orderStatusRes,
      paymentMethodRes,
      lowStockRes,
      vipCustomersRes,
      customerSegmentsRes,
      repeatPurchaseRateRes,
    ] = await Promise.all([
      // Revenue over time
      supabase
        .from('orders')
        .select('created_at, total_amount')
        .gte('created_at', startDateISO)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: true }),

      // Top products
      supabase
        .from('order_items')
        .select(`
          quantity,
          total_price,
          product:products(name, price, images)
        `)
        .gte('created_at', startDateISO),

      // Top categories
      supabase
        .from('order_items')
        .select(`
          quantity,
          total_price,
          product:products(category:categories(name))
        `)
        .gte('created_at', startDateISO),

      // Top occasions
      supabase
        .from('order_items')
        .select(`
          quantity,
          total_price,
          product:products(occasion:occasions(name))
        `)
        .gte('created_at', startDateISO),

      // Customer metrics with orders for VIP identification
      supabase
        .from('profiles')
        .select('id, created_at, user:users(email, name), orders:orders(id, total_amount, payment_status, created_at, order_status)')
        .eq('role', 'user'),

      // Order status distribution
      supabase
        .from('orders')
        .select('order_status')
        .gte('created_at', startDateISO),

      // Payment method distribution
      supabase
        .from('orders')
        .select('payment_method, total_amount')
        .gte('created_at', startDateISO)
        .eq('payment_status', 'paid'),

      // Low stock alerts - products below threshold
      supabase
        .from('products')
        .select('id, name, stock, low_stock_threshold, price, images')
        .lte('stock', 10)
        .gt('stock', 0)
        .eq('is_active', true)
        .eq('track_inventory', true)
        .order('stock', { ascending: true })
        .limit(20),

      // VIP Customers - high lifetime value, frequent buyers
      supabase
        .from('profiles')
        .select('id, created_at, user:users(email, name), orders:orders(id, total_amount, payment_status, created_at, order_status)')
        .eq('role', 'user'),

      // Customer segments for segmentation analysis
      supabase
        .from('profiles')
        .select('id, created_at, user:users(email, name), orders:orders(id, total_amount, payment_status, created_at, order_status)')
        .eq('role', 'user'),

      // Repeat purchase rate calculation
      supabase
        .from('orders')
        .select('user_id, total_amount, payment_status, created_at')
        .eq('payment_status', 'paid')
        .not('user_id', 'is', null)
        .order('user_id')
        .order('created_at', { ascending: true }),
    ]);

    // Process revenue over time (group by day)
    const revenueMap = new Map<string, { revenue: number; orders: number }>();
    if (revenueOverTimeRes.data) {
      for (const order of revenueOverTimeRes.data) {
        const date = order.created_at.split('T')[0];
        const existing = revenueMap.get(date) || { revenue: 0, orders: 0 };
        existing.revenue += order.total_amount || 0;
        existing.orders += 1;
        revenueMap.set(date, existing);
      }
    }
    const revenueOverTime = Array.from(revenueMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Process top products
    const productMap = new Map<string, { product: { name: string; images: string[]; price: number }; units_sold: number; revenue: number }>();
    if (topProductsRes.data) {
      for (const item of topProductsRes.data) {
        const product = Array.isArray(item.product) ? item.product[0] : item.product;
        if (product) {
          const existing = productMap.get(product.name) || { product, units_sold: 0, revenue: 0 };
          existing.units_sold += item.quantity || 0;
          existing.revenue += item.total_price || 0;
          productMap.set(product.name, existing);
        }
      }
    }
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Process top categories
    const categoryMap = new Map<string, { category: { name: string }; revenue: number; orders: number }>();
    if (topCategoriesRes.data) {
      for (const item of topCategoriesRes.data) {
        const product = Array.isArray(item.product) ? item.product[0] : item.product;
        const category = product?.category ? (Array.isArray(product.category) ? product.category[0] : product.category) : null;
        if (category) {
          const catName = category.name;
          const existing = categoryMap.get(catName) || { category: { name: catName }, revenue: 0, orders: 0 };
          existing.revenue += item.total_price || 0;
          existing.orders += item.quantity || 0;
          categoryMap.set(catName, existing);
        }
      }
    }
    const topCategories = Array.from(categoryMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Process top occasions
    const occasionMap = new Map<string, { occasion: { name: string }; revenue: number; orders: number }>();
    if (topOccasionsRes.data) {
      for (const item of topOccasionsRes.data) {
        const product = Array.isArray(item.product) ? item.product[0] : item.product;
        const occasion = product?.occasion ? (Array.isArray(product.occasion) ? product.occasion[0] : product.occasion) : null;
        if (occasion) {
          const occName = occasion.name;
          const existing = occasionMap.get(occName) || { occasion: { name: occName }, revenue: 0, orders: 0 };
          existing.revenue += item.total_price || 0;
          existing.orders += item.quantity || 0;
          occasionMap.set(occName, existing);
        }
      }
    }
    const topOccasions = Array.from(occasionMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Process customer metrics & VIP identification
    let totalCustomers = 0;
    let newThisMonth = 0;
    let returningCustomers = 0;
    let totalLifetimeValue = 0;
    const vipCustomers: Array<{
      id: string;
      email: string;
      name: string;
      total_spent: number;
      order_count: number;
      avg_order_value: number;
      first_order_date: string;
      last_order_date: string;
      vip_tier: 'platinum' | 'gold' | 'silver' | 'bronze';
      vip_score: number;
    }> = [];
    
    const customerSegmentCounts = {
      vip: 0,
      loyal: 0,
      regular: 0,
      new: 0,
      at_risk: 0,
      lost: 0,
    };

    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();

    if (customerMetricsRes.data) {
      totalCustomers = customerMetricsRes.data.length;
      
      for (const customer of customerMetricsRes.data) {
        if (customer.created_at >= monthAgo) newThisMonth++;
        
        if (customer.orders) {
          const paidOrders = customer.orders.filter((o: any) => o.payment_status === 'paid');
          const orderCount = paidOrders.length;
          
          if (orderCount > 1) returningCustomers++;
          
          const customerTotal = paidOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
          totalLifetimeValue += customerTotal;

          // VIP Identification Logic
          if (orderCount > 0) {
            const avgOrderValue = customerTotal / orderCount;
            const firstOrderDate = paidOrders.sort((a: any, b: any) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )[0]?.created_at || customer.created_at;
            const lastOrderDate = paidOrders.sort((a: any, b: any) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]?.created_at || customer.created_at;
            
            // Calculate VIP score based on:
            // - Lifetime value (40% weight)
            // - Order frequency (30% weight)
            // - Average order value (20% weight)
            // - Recency (10% weight)
            const daysSinceLastOrder = (now.getTime() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24);
            const recencyScore = Math.max(0, 100 - (daysSinceLastOrder * 2));
            
            const ltvScore = Math.min(100, (customerTotal / 50000) * 100); // 50k = max score
            const frequencyScore = Math.min(100, (orderCount / 20) * 100); // 20 orders = max score
            const aovScore = Math.min(100, (avgOrderValue / 5000) * 100); // 5k avg = max score
            
            const vipScore = Math.round(
              ltvScore * 0.4 + 
              frequencyScore * 0.3 + 
              aovScore * 0.2 + 
              recencyScore * 0.1
            );

            let vipTier: 'platinum' | 'gold' | 'silver' | 'bronze' = 'bronze';
            if (vipScore >= 80) vipTier = 'platinum';
            else if (vipScore >= 60) vipTier = 'gold';
            else if (vipScore >= 40) vipTier = 'silver';
            
            // Customer Segmentation
            if (vipScore >= 60) customerSegmentCounts.vip++;
            else if (orderCount >= 5 && daysSinceLastOrder <= 90) customerSegmentCounts.loyal++;
            else if (orderCount >= 2 && daysSinceLastOrder <= 90) customerSegmentCounts.regular++;
            else if (customer.created_at >= monthAgo && orderCount >= 1) customerSegmentCounts.new++;
            else if (daysSinceLastOrder > 90 && daysSinceLastOrder <= 180) customerSegmentCounts.at_risk++;
            else customerSegmentCounts.lost++;

            const userObj = Array.isArray((customer as any).user) ? (customer as any).user[0] : (customer as any).user;
            vipCustomers.push({
              id: customer.id,
              email: userObj?.email || '',
              name: userObj?.name || customer.id,
              total_spent: customerTotal,
              order_count: orderCount,
              avg_order_value: Math.round(avgOrderValue),
              first_order_date: firstOrderDate,
              last_order_date: lastOrderDate,
              vip_tier: vipTier,
              vip_score: vipScore,
            });
          }
        }
      }
    }
    
    const returningRate = totalCustomers > 0 ? Math.round((returningCustomers / totalCustomers) * 100) : 0;
    const avgLifetimeValue = totalCustomers > 0 ? Math.round(totalLifetimeValue / totalCustomers) : 0;

    // Sort VIP customers by score and take top 20
    vipCustomers.sort((a, b) => b.vip_score - a.vip_score);
    const topVipCustomers = vipCustomers.slice(0, 20);

    // Process order status distribution
    const statusMap = new Map<string, number>();
    if (orderStatusRes.data) {
      for (const order of orderStatusRes.data) {
        const status = order.order_status || 'unknown';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      }
    }
    const orderStatusDistribution = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // Process payment method distribution
    const paymentMap = new Map<string, { count: number; revenue: number }>();
    if (paymentMethodRes.data) {
      for (const order of paymentMethodRes.data) {
        const method = order.payment_method || 'unknown';
        const existing = paymentMap.get(method) || { count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += order.total_amount || 0;
        paymentMap.set(method, existing);
      }
    }
    const paymentMethodDistribution = Array.from(paymentMap.entries())
      .map(([method, data]) => ({ method, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // Low stock alerts with severity levels
    const lowStockAlerts = lowStockRes.data?.map(item => {
      const threshold = item.low_stock_threshold || 10;
      const severity = item.stock === 0 ? 'out_of_stock' : 
                       item.stock <= threshold * 0.3 ? 'critical' :
                       item.stock <= threshold * 0.6 ? 'high' : 'medium';
      return {
        product: { 
          id: item.id,
          name: item.name, 
          stock: item.stock, 
          low_stock_threshold: threshold,
          price: item.price,
          image: item.images?.[0] || null,
        },
        severity,
        days_until_stockout: item.stock > 0 ? Math.ceil(item.stock / Math.max(1, (item.price / 100))) : 0, // rough estimate
      };
    }) || [];

    // Sort by severity and stock level
    const severityOrder = { out_of_stock: 0, critical: 1, high: 2, medium: 3 };
    lowStockAlerts.sort((a, b) => severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder]);

    // Repeat purchase rate calculation
    let repeatPurchaseRate = 0;
    if (repeatPurchaseRateRes.data) {
      const userOrders = new Map<string, number>();
      for (const order of repeatPurchaseRateRes.data) {
        if (order.user_id) {
          userOrders.set(order.user_id, (userOrders.get(order.user_id) || 0) + 1);
        }
      }
      const repeatCustomers = Array.from(userOrders.values()).filter(count => count > 1).length;
      const totalUniqueCustomers = userOrders.size;
      repeatPurchaseRate = totalUniqueCustomers > 0 ? Math.round((repeatCustomers / totalUniqueCustomers) * 100) : 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        revenue_over_time: revenueOverTime,
        top_products: topProducts,
        top_categories: topCategories,
        top_occasions: topOccasions,
        customer_metrics: {
          total: totalCustomers,
          new_this_month: newThisMonth,
          returning_rate: returningRate,
          avg_lifetime_value: avgLifetimeValue,
          repeat_purchase_rate: repeatPurchaseRate,
        },
        vip_customers: topVipCustomers,
        customer_segments: customerSegmentCounts,
        order_status_distribution: orderStatusDistribution,
        payment_method_distribution: paymentMethodDistribution,
        low_stock_alerts: lowStockAlerts,
      },
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}