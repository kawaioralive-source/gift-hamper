import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  phone: z.string().optional().nullable().refine(
    (val) => {
      if (!val || val.trim() === '') return true;
      const digits = val.replace(/\D/g, '');
      const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
      return /^[6-9]\d{9}$/.test(last10);
    },
    'Invalid Indian phone number'
  ),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export const addressSchema = z.object({
  type: z.enum(['shipping', 'billing', 'both']).default('both'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').refine(
    (val) => /^[6-9]\d{9}$/.test(val.replace(/\D/g, '')),
    'Invalid Indian phone number'
  ),
  address_line_1: z.string().min(5, 'Address must be at least 5 characters').max(200),
  address_line_2: z.string().max(200).optional(),
  landmark: z.string().max(100).optional(),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
  postal_code: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid Indian pincode'),
  country: z.string().default('India'),
  delivery_instructions: z.string().max(500).optional(),
  is_default: z.boolean().optional(),
});

export const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(200),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(200).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  short_description: z.string().max(500).optional(),
  description: z.string().optional(),
  category_id: z.string().uuid().optional(),
  occasion_id: z.string().uuid().optional(),
  recipient_id: z.string().uuid().optional(),
  price: z.number().positive('Price must be positive'),
  compare_at_price: z.number().positive().optional().nullable(),
  cost_price: z.number().positive().optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  barcode: z.string().max(50).optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  dimensions: z.object({
    length: z.number(),
    width: z.number(),
    height: z.number(),
    unit: z.enum(['cm', 'in']).default('cm'),
  }).optional().nullable(),
  images: z.array(z.string().url()).min(1, 'At least one image is required').max(10),
  videos: z.array(z.string().url()).max(5).optional().nullable(),
  stock: z.number().int().min(0).default(0),
  low_stock_threshold: z.number().int().min(0).default(5),
  track_inventory: z.boolean().default(true),
  allow_backorder: z.boolean().default(false),
  is_customizable: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_bestseller: z.boolean().default(false),
  is_new_arrival: z.boolean().default(false),
  is_active: z.boolean().default(true),
  status: z.enum(['draft', 'active', 'out_of_stock', 'archived']).default('draft'),
  meta_title: z.string().max(60).optional().nullable(),
  meta_description: z.string().max(160).optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export const itemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(200).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  category: z.enum(['box', 'treat', 'beverage', 'keepsake', 'card', 'packaging']),
  price: z.number().positive('Price must be positive'),
  cost_price: z.number().positive().optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  low_stock_threshold: z.number().int().min(0).default(5),
  track_inventory: z.boolean().default(true),
  specifications: z.record(z.unknown()).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(100).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  image_url: z.string().url().optional().nullable(),
  icon: z.string().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const occasionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(100).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  image_url: z.string().url().optional().nullable(),
  icon: z.string().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const recipientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(100).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  image_url: z.string().url().optional().nullable(),
  icon: z.string().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(50).toUpperCase(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed', 'buy_x_get_y', 'free_shipping']),
  value: z.number().positive('Value must be positive'),
  min_order_amount: z.number().min(0).optional().nullable(),
  max_discount_amount: z.number().positive().optional().nullable(),
  usage_limit: z.number().int().positive().optional().nullable(),
  usage_limit_per_user: z.number().int().positive().optional().nullable(),
  applicable_categories: z.array(z.string().uuid()).optional().nullable(),
  applicable_occasions: z.array(z.string().uuid()).optional().nullable(),
  applicable_products: z.array(z.string().uuid()).optional().nullable(),
  excluded_products: z.array(z.string().uuid()).optional().nullable(),
  starts_at: z.string().datetime().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
  is_active: z.boolean().default(true),
});

export const promoCodeSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(50).toUpperCase(),
  name: z.string().max(100).optional(),
  description: z.string().optional().nullable(),
  discount_type: z.enum(['percentage', 'fixed']).default('percentage'),
  discount_value: z.number().min(0, 'Value must be positive'),
  min_order_amount: z.number().min(0).optional().nullable(),
  max_discount_amount: z.number().positive().optional().nullable(),
  usage_limit: z.number().int().positive().optional().nullable(),
  usage_limit_per_customer: z.number().int().positive().optional().nullable(),
  starts_at: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  applies_to: z.enum(['all', 'categories', 'products', 'customers']).default('all'),
  applicable_ids: z.array(z.string()).default([]),
});

export const giftCardSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(50).toUpperCase(),
  initial_balance: z.number().positive('Balance must be positive'),
  currency: z.string().default('INR'),
  purchaser_email: z.string().email().optional().nullable(),
  recipient_email: z.string().email().optional().nullable(),
  recipient_name: z.string().max(100).optional().nullable(),
  message: z.string().max(500).optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
});

export const reviewSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  content: z.string().min(10, 'Review must be at least 10 characters').max(2000),
  images: z.array(z.string().url()).max(5).optional().nullable(),
});

export const customHamperSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  box_id: z.string().optional().nullable(),
  card_id: z.string().optional().nullable(),
  card_message: z.string().max(500).optional().nullable(),
  packaging_id: z.string().optional().nullable(),
  items: z.array(z.object({
    item_id: z.string(),
    quantity: z.number().int().positive(),
  })).min(0),
  subtotal: z.number().min(0),
  customization_fee: z.number().min(0).default(0),
  packaging_fee: z.number().min(0).default(0),
  total_price: z.number().min(0),
});

export const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  customer_email: z.string().email('Invalid email address'),
  customer_phone: z.string().optional().refine(
    (val) => !val || /^[6-9]\d{9}$/.test(val.replace(/\D/g, '')),
    'Invalid Indian phone number'
  ),
  recipient_name: z.string().min(2, 'Recipient name is required').max(100),
  recipient_phone: z.string().min(10, 'Phone number must be at least 10 digits').refine(
    (val) => /^[6-9]\d{9}$/.test(val.replace(/\D/g, '')),
    'Invalid Indian phone number'
  ),
  recipient_address: z.object({
    address_line_1: z.string().min(5, 'Address must be at least 5 characters').max(200),
    address_line_2: z.string().max(200).optional(),
    landmark: z.string().max(100).optional(),
    city: z.string().min(2, 'City is required').max(100),
    state: z.string().min(2, 'State is required').max(100),
    postal_code: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid Indian pincode'),
    country: z.string().default('India'),
    delivery_instructions: z.string().max(500).optional(),
  }),
  delivery_date: z.string().optional(),
  delivery_slot: z.string().optional(),
  gift_message: z.string().max(500).optional(),
  is_surprise_gift: z.boolean().optional(),
  secret_message: z.string().max(500).optional(),
  packaging_type: z.string().optional(),
  payment_method: z.enum(['razorpay', 'stripe', 'cod', 'bank_transfer', 'gift_card']),
  coupon_code: z.string().optional(),
  gift_card_code: z.string().optional(),
  save_address: z.boolean().optional(),
});

export const serviceabilitySchema = z.object({
  postal_code: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid Indian pincode'),
});

export const deliveryDatesSchema = z.object({
  postal_code: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid Indian pincode'),
  days_ahead: z.number().int().min(1).max(60).default(30),
});

export const updateOrderStatusSchema = z.object({
  order_status: z.enum([
    'pending_payment',
    'paid',
    'confirmed',
    'preparing',
    'packed',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'return_requested',
    'refund_processing',
    'refunded',
  ]),
  tracking_number: z.string().optional(),
  tracking_url: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type OccasionInput = z.infer<typeof occasionSchema>;
export type RecipientInput = z.infer<typeof recipientSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type GiftCardInput = z.infer<typeof giftCardSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type CustomHamperInput = z.infer<typeof customHamperSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ServiceabilityInput = z.infer<typeof serviceabilitySchema>;
export type DeliveryDatesInput = z.infer<typeof deliveryDatesSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;