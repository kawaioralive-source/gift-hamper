import type { Database } from '@/lib/database.types';

export type User = Database['public']['Tables']['users']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Address = Database['public']['Tables']['addresses']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Occasion = Database['public']['Tables']['occasions']['Row'];
export type Recipient = Database['public']['Tables']['recipients']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type ProductItem = Database['public']['Tables']['product_items']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type Cart = Database['public']['Tables']['carts']['Row'];
export type CartItem = Database['public']['Tables']['cart_items']['Row'];
export type Wishlist = Database['public']['Tables']['wishlists']['Row'];
export type CustomHamper = Database['public']['Tables']['custom_hampers']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type Coupon = Database['public']['Tables']['coupons']['Row'];
export type CouponUsage = Database['public']['Tables']['coupon_usage']['Row'];
export type GiftCard = Database['public']['Tables']['gift_cards']['Row'];
export type GiftCardTransaction = Database['public']['Tables']['gift_card_transactions']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type DeliveryZone = Database['public']['Tables']['delivery_zones']['Row'];
export type DeliverySlot = Database['public']['Tables']['delivery_slots']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type SystemConfig = Database['public']['Tables']['system_config']['Row'];

export type ProductWithRelations = Product & {
  category?: Category | null;
  occasion?: Occasion | null;
  recipient?: Recipient | null;
  items?: (ProductItem & { item: Item })[];
  reviews?: Review[];
  avg_rating?: number;
  review_count?: number;
};

export type OrderWithItems = Order & {
  items: (OrderItem & { product?: Product | null })[];
  payments?: Payment[];
};

export type CartWithItems = Cart & {
  items: (CartItem & { product?: Product | null; custom_hamper?: CustomHamper | null })[];
};

export type CustomHamperData = {
  box_id?: string;
  card_id?: string;
  card_message?: string;
  packaging_id?: string;
  items: Array<{ item_id: string; quantity: number }>;
};

export type CheckoutData = {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: {
    address_line_1: string;
    address_line_2?: string;
    landmark?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    delivery_instructions?: string;
  };
  delivery_date?: string;
  delivery_slot?: string;
  gift_message?: string;
  is_surprise_gift?: boolean;
  secret_message?: string;
  packaging_type?: string;
  payment_method: 'razorpay' | 'stripe' | 'cod' | 'bank_transfer' | 'gift_card';
  coupon_code?: string;
  gift_card_code?: string;
  save_address?: boolean;
};

export type PaymentIntentData = {
  order_id: string;
  amount: number;
  currency: string;
  payment_method: 'razorpay' | 'stripe' | 'cod' | 'bank_transfer' | 'gift_card';
  return_url?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export type ProductFilters = {
  category?: string;
  occasion?: string;
  recipient?: string;
  min_price?: number;
  max_price?: number;
  rating?: number;
  in_stock?: boolean;
  is_customizable?: boolean;
  is_featured?: boolean;
  is_bestseller?: boolean;
  is_new_arrival?: boolean;
  tags?: string[];
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating' | 'discount';
  page?: number;
  limit?: number;
};

export type ServiceabilityResponse = {
  is_serviceable: boolean;
  zone_id?: string;
  shipping_cost: number;
  estimated_days_min: number;
  estimated_days_max: number;
  same_day_available: boolean;
  same_day_cutoff_time?: string;
};

export type DeliveryDateResponse = {
  date: string;
  slots: Array<{
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    additional_cost: number;
  }>;
}[];

export type CouponValidationResponse = {
  valid: boolean;
  coupon?: Coupon;
  discount_amount?: number;
  error?: string;
};

export type GiftCardValidationResponse = {
  valid: boolean;
  gift_card?: GiftCard;
  balance?: number;
  error?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  phone?: string;
  phone_verified: boolean;
  avatar_url?: string;
};

export type SessionUser = AuthUser & {
  access_token: string;
  refresh_token: string;
};

export type AdminStats = {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  pending_orders: number;
  low_stock_products: number;
  avg_order_value: number;
  conversion_rate: number;
};

export type AnalyticsData = {
  revenue_over_time: Array<{ date: string; revenue: number; orders: number }>;
  top_products: Array<{ product: Product; units_sold: number; revenue: number }>;
  top_categories: Array<{ category: Category; revenue: number; orders: number }>;
  top_occasions: Array<{ occasion: Occasion; revenue: number; orders: number }>;
  customer_metrics: {
    total: number;
    new_this_month: number;
    returning_rate: number;
    avg_lifetime_value: number;
  };
  order_status_distribution: Array<{ status: string; count: number }>;
  payment_method_distribution: Array<{ method: string; count: number; revenue: number }>;
  low_stock_alerts: Array<{ product: Product; stock: number }>;
};

export type CustomBuilderStep = 1 | 2 | 3 | 4 | 5;

export type CustomBuilderState = {
  step: CustomBuilderStep;
  box_id?: string;
  items: Array<{ item_id: string; quantity: number }>;
  card_id?: string;
  card_message?: string;
  packaging_id?: string;
  recipient_name?: string;
  occasion?: string;
};

export type ShippingCalculation = {
  shipping_cost: number;
  is_free_shipping: boolean;
  estimated_days_min: number;
  estimated_days_max: number;
};

export type PriceBreakdown = {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  packaging: number;
  customization: number;
  total: number;
  currency: string;
};