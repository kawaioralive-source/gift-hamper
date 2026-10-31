export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          password_hash: string;
          role: 'user' | 'admin';
          phone: string | null;
          phone_verified: boolean;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          password_hash: string;
          role?: 'user' | 'admin';
          phone?: string | null;
          phone_verified?: boolean;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          password_hash?: string;
          role?: 'user' | 'admin';
          phone?: string | null;
          phone_verified?: boolean;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          date_of_birth: string | null;
          gender: 'male' | 'female' | 'other' | null;
          preferences: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name?: string | null;
          last_name?: string | null;
          date_of_birth?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          preferences?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string | null;
          last_name?: string | null;
          date_of_birth?: string | null;
          gender?: 'male' | 'female' | 'other' | null;
          preferences?: Json | null;
          updated_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          type: 'shipping' | 'billing' | 'both';
          name: string;
          phone: string;
          address_line_1: string;
          address_line_2: string | null;
          landmark: string | null;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          is_default: boolean;
          delivery_instructions: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: 'shipping' | 'billing' | 'both';
          name: string;
          phone: string;
          address_line_1: string;
          address_line_2?: string | null;
          landmark?: string | null;
          city: string;
          state: string;
          postal_code: string;
          country?: string;
          is_default?: boolean;
          delivery_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'shipping' | 'billing' | 'both';
          name?: string;
          phone?: string;
          address_line_1?: string;
          address_line_2?: string | null;
          landmark?: string | null;
          city?: string;
          state?: string;
          postal_code?: string;
          country?: string;
          is_default?: boolean;
          delivery_instructions?: string | null;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      occasions: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      recipients: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          short_description: string | null;
          description: string | null;
          category_id: string | null;
          occasion_id: string | null;
          recipient_id: string | null;
          price: number;
          compare_at_price: number | null;
          cost_price: number | null;
          sku: string | null;
          barcode: string | null;
          weight: number | null;
          dimensions: Json | null;
          images: string[];
          videos: string[] | null;
          rating: number;
          review_count: number;
          stock: number;
          low_stock_threshold: number;
          track_inventory: boolean;
          allow_backorder: boolean;
          is_customizable: boolean;
          is_featured: boolean;
          is_bestseller: boolean;
          is_new_arrival: boolean;
          is_active: boolean;
          status: 'draft' | 'active' | 'out_of_stock' | 'archived';
          meta_title: string | null;
          meta_description: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          short_description?: string | null;
          description?: string | null;
          category_id?: string | null;
          occasion_id?: string | null;
          recipient_id?: string | null;
          price: number;
          compare_at_price?: number | null;
          cost_price?: number | null;
          sku?: string | null;
          barcode?: string | null;
          weight?: number | null;
          dimensions?: Json | null;
          images?: string[];
          videos?: string[] | null;
          rating?: number;
          review_count?: number;
          stock?: number;
          low_stock_threshold?: number;
          track_inventory?: boolean;
          allow_backorder?: boolean;
          is_customizable?: boolean;
          is_featured?: boolean;
          is_bestseller?: boolean;
          is_new_arrival?: boolean;
          is_active?: boolean;
          status?: 'draft' | 'active' | 'out_of_stock' | 'archived';
          meta_title?: string | null;
          meta_description?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          short_description?: string | null;
          description?: string | null;
          category_id?: string | null;
          occasion_id?: string | null;
          recipient_id?: string | null;
          price?: number;
          compare_at_price?: number | null;
          cost_price?: number | null;
          sku?: string | null;
          barcode?: string | null;
          weight?: number | null;
          dimensions?: Json | null;
          images?: string[];
          videos?: string[] | null;
          rating?: number;
          review_count?: number;
          stock?: number;
          low_stock_threshold?: number;
          track_inventory?: boolean;
          allow_backorder?: boolean;
          is_customizable?: boolean;
          is_featured?: boolean;
          is_bestseller?: boolean;
          is_new_arrival?: boolean;
          is_active?: boolean;
          status?: 'draft' | 'active' | 'out_of_stock' | 'archived';
          meta_title?: string | null;
          meta_description?: string | null;
          tags?: string[];
          updated_at?: string;
        };
      };
      product_items: {
        Row: {
          id: string;
          product_id: string;
          item_id: string;
          quantity: number;
          is_required: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          item_id: string;
          quantity?: number;
          is_required?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          item_id?: string;
          quantity?: number;
          is_required?: boolean;
          sort_order?: number;
        };
      };
      items: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          category: 'box' | 'treat' | 'beverage' | 'keepsake' | 'card' | 'packaging';
          price: number;
          cost_price: number | null;
          sku: string | null;
          image_url: string | null;
          stock: number;
          low_stock_threshold: number;
          track_inventory: boolean;
          specifications: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          category: 'box' | 'treat' | 'beverage' | 'keepsake' | 'card' | 'packaging';
          price: number;
          cost_price?: number | null;
          sku?: string | null;
          image_url?: string | null;
          stock?: number;
          low_stock_threshold?: number;
          track_inventory?: boolean;
          specifications?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          category?: 'box' | 'treat' | 'beverage' | 'keepsake' | 'card' | 'packaging';
          price?: number;
          cost_price?: number | null;
          sku?: string | null;
          image_url?: string | null;
          stock?: number;
          low_stock_threshold?: number;
          track_inventory?: boolean;
          specifications?: Json | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      carts: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_id: string | null;
          custom_hamper_id: string | null;
          quantity: number;
          price_at_add: number;
          customization_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_id?: string | null;
          custom_hamper_id?: string | null;
          quantity: number;
          price_at_add: number;
          customization_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          product_id?: string | null;
          custom_hamper_id?: string | null;
          quantity?: number;
          price_at_add?: number;
          customization_data?: Json | null;
          updated_at?: string;
        };
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
        };
      };
      custom_hampers: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          name: string;
          box_id: string | null;
          card_id: string | null;
          card_message: string | null;
          packaging_id: string | null;
          items: Json;
          subtotal: number;
          customization_fee: number;
          packaging_fee: number;
          total_price: number;
          status: 'draft' | 'completed' | 'ordered';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          name: string;
          box_id?: string | null;
          card_id?: string | null;
          card_message?: string | null;
          packaging_id?: string | null;
          items: Json;
          subtotal: number;
          customization_fee: number;
          packaging_fee: number;
          total_price: number;
          status?: 'draft' | 'completed' | 'ordered';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          name?: string;
          box_id?: string | null;
          card_id?: string | null;
          card_message?: string | null;
          packaging_id?: string | null;
          items?: Json;
          subtotal?: number;
          customization_fee?: number;
          packaging_fee?: number;
          total_price?: number;
          status?: 'draft' | 'completed' | 'ordered';
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          session_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          shipping_amount: number;
          packaging_amount: number;
          customization_amount: number;
          total_amount: number;
          currency: string;
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
          payment_method: string | null;
          payment_id: string | null;
          order_status: 'pending_payment' | 'paid' | 'confirmed' | 'preparing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'return_requested' | 'refund_processing' | 'refunded';
          recipient_name: string;
          recipient_phone: string;
          recipient_address: Json;
          delivery_date: string | null;
          delivery_slot: string | null;
          gift_message: string | null;
          is_surprise_gift: boolean;
          secret_message: string | null;
          packaging_type: string | null;
          tracking_number: string | null;
          tracking_url: string | null;
          notes: string | null;
          applied_coupon_id: string | null;
          applied_gift_card_id: string | null;
          created_at: string;
          updated_at: string;
          confirmed_at: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id?: string | null;
          session_id?: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone?: string | null;
          subtotal: number;
          discount_amount?: number;
          tax_amount?: number;
          shipping_amount?: number;
          packaging_amount?: number;
          customization_amount?: number;
          total_amount: number;
          currency?: string;
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
          payment_method?: string | null;
          payment_id?: string | null;
          order_status?: 'pending_payment' | 'paid' | 'confirmed' | 'preparing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'return_requested' | 'refund_processing' | 'refunded';
          recipient_name: string;
          recipient_phone: string;
          recipient_address: Json;
          delivery_date?: string | null;
          delivery_slot?: string | null;
          gift_message?: string | null;
          is_surprise_gift?: boolean;
          secret_message?: string | null;
          packaging_type?: string | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          notes?: string | null;
          applied_coupon_id?: string | null;
          applied_gift_card_id?: string | null;
          created_at?: string;
          updated_at?: string;
          confirmed_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
        };
        Update: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          session_id?: string | null;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string | null;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          shipping_amount?: number;
          packaging_amount?: number;
          customization_amount?: number;
          total_amount?: number;
          currency?: string;
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
          payment_method?: string | null;
          payment_id?: string | null;
          order_status?: 'pending_payment' | 'paid' | 'confirmed' | 'preparing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'return_requested' | 'refund_processing' | 'refunded';
          recipient_name?: string;
          recipient_phone?: string;
          recipient_address?: Json;
          delivery_date?: string | null;
          delivery_slot?: string | null;
          gift_message?: string | null;
          is_surprise_gift?: boolean;
          secret_message?: string | null;
          packaging_type?: string | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          notes?: string | null;
          applied_coupon_id?: string | null;
          applied_gift_card_id?: string | null;
          updated_at?: string;
          confirmed_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          custom_hamper_id: string | null;
          name: string;
          sku: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          customization_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          custom_hamper_id?: string | null;
          name: string;
          sku?: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          customization_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          custom_hamper_id?: string | null;
          name?: string;
          sku?: string | null;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          customization_data?: Json | null;
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          provider: 'razorpay' | 'stripe' | 'cod' | 'bank_transfer' | 'gift_card';
          provider_payment_id: string | null;
          provider_order_id: string | null;
          amount: number;
          currency: string;
          status: 'created' | 'attempted' | 'paid' | 'failed' | 'refunded' | 'cancelled';
          method: string | null;
          metadata: Json | null;
          error_code: string | null;
          error_message: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          provider: 'razorpay' | 'stripe' | 'cod' | 'bank_transfer' | 'gift_card';
          provider_payment_id?: string | null;
          provider_order_id?: string | null;
          amount: number;
          currency?: string;
          status?: 'created' | 'attempted' | 'paid' | 'failed' | 'refunded' | 'cancelled';
          method?: string | null;
          metadata?: Json | null;
          error_code?: string | null;
          error_message?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          provider?: 'razorpay' | 'stripe' | 'cod' | 'bank_transfer' | 'gift_card';
          provider_payment_id?: string | null;
          provider_order_id?: string | null;
          amount?: number;
          currency?: string;
          status?: 'created' | 'attempted' | 'paid' | 'failed' | 'refunded' | 'cancelled';
          method?: string | null;
          metadata?: Json | null;
          error_code?: string | null;
          error_message?: string | null;
          paid_at?: string | null;
          updated_at?: string;
        };
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'free_shipping';
          value: number;
          min_order_amount: number | null;
          max_discount_amount: number | null;
          usage_limit: number | null;
          usage_limit_per_user: number | null;
          used_count: number;
          applicable_categories: string[] | null;
          applicable_occasions: string[] | null;
          applicable_products: string[] | null;
          excluded_products: string[] | null;
          starts_at: string | null;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'free_shipping';
          value: number;
          min_order_amount?: number | null;
          max_discount_amount?: number | null;
          usage_limit?: number | null;
          usage_limit_per_user?: number | null;
          used_count?: number;
          applicable_categories?: string[] | null;
          applicable_occasions?: string[] | null;
          applicable_products?: string[] | null;
          excluded_products?: string[] | null;
          starts_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          type?: 'percentage' | 'fixed' | 'buy_x_get_y' | 'free_shipping';
          value?: number;
          min_order_amount?: number | null;
          max_discount_amount?: number | null;
          usage_limit?: number | null;
          usage_limit_per_user?: number | null;
          used_count?: number;
          applicable_categories?: string[] | null;
          applicable_occasions?: string[] | null;
          applicable_products?: string[] | null;
          excluded_products?: string[] | null;
          starts_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      coupon_usage: {
        Row: {
          id: string;
          coupon_id: string;
          user_id: string | null;
          order_id: string | null;
          discount_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          coupon_id: string;
          user_id?: string | null;
          order_id?: string | null;
          discount_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          coupon_id?: string;
          user_id?: string | null;
          order_id?: string | null;
          discount_amount?: number;
        };
      };
      gift_cards: {
        Row: {
          id: string;
          code: string;
          initial_balance: number;
          current_balance: number;
          currency: string;
          purchaser_id: string | null;
          purchaser_email: string | null;
          recipient_email: string | null;
          recipient_name: string | null;
          message: string | null;
          status: 'active' | 'expired' | 'redeemed' | 'cancelled';
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          initial_balance: number;
          current_balance: number;
          currency?: string;
          purchaser_id?: string | null;
          purchaser_email?: string | null;
          recipient_email?: string | null;
          recipient_name?: string | null;
          message?: string | null;
          status?: 'active' | 'expired' | 'redeemed' | 'cancelled';
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          initial_balance?: number;
          current_balance?: number;
          currency?: string;
          purchaser_id?: string | null;
          purchaser_email?: string | null;
          recipient_email?: string | null;
          recipient_name?: string | null;
          message?: string | null;
          status?: 'active' | 'expired' | 'redeemed' | 'cancelled';
          expires_at?: string | null;
          updated_at?: string;
        };
      };
      gift_card_transactions: {
        Row: {
          id: string;
          gift_card_id: string;
          order_id: string | null;
          type: 'purchase' | 'redeem' | 'refund' | 'expire';
          amount: number;
          balance_before: number;
          balance_after: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          gift_card_id: string;
          order_id?: string | null;
          type: 'purchase' | 'redeem' | 'refund' | 'expire';
          amount: number;
          balance_before: number;
          balance_after: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          gift_card_id?: string;
          order_id?: string | null;
          type?: 'purchase' | 'redeem' | 'refund' | 'expire';
          amount?: number;
          balance_before?: number;
          balance_after?: number;
        };
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string | null;
          order_id: string | null;
          rating: number;
          title: string | null;
          content: string;
          images: string[] | null;
          is_verified_purchase: boolean;
          is_approved: boolean;
          helpful_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id?: string | null;
          order_id?: string | null;
          rating: number;
          title?: string | null;
          content: string;
          images?: string[] | null;
          is_verified_purchase?: boolean;
          is_approved?: boolean;
          helpful_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          user_id?: string | null;
          order_id?: string | null;
          rating?: number;
          title?: string | null;
          content?: string;
          images?: string[] | null;
          is_verified_purchase?: boolean;
          is_approved?: boolean;
          helpful_count?: number;
          updated_at?: string;
        };
      };
      delivery_zones: {
        Row: {
          id: string;
          name: string;
          postal_codes: string[];
          cities: string[] | null;
          states: string[] | null;
          countries: string[] | null;
          base_shipping_cost: number;
          free_shipping_threshold: number | null;
          estimated_days_min: number;
          estimated_days_max: number;
          same_day_cutoff_time: string | null;
          same_day_eligible: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          postal_codes: string[];
          cities?: string[] | null;
          states?: string[] | null;
          countries?: string[] | null;
          base_shipping_cost: number;
          free_shipping_threshold?: number | null;
          estimated_days_min?: number;
          estimated_days_max?: number;
          same_day_cutoff_time?: string | null;
          same_day_eligible?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          postal_codes?: string[];
          cities?: string[] | null;
          states?: string[] | null;
          countries?: string[] | null;
          base_shipping_cost?: number;
          free_shipping_threshold?: number | null;
          estimated_days_min?: number;
          estimated_days_max?: number;
          same_day_cutoff_time?: string | null;
          same_day_eligible?: boolean;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      delivery_slots: {
        Row: {
          id: string;
          zone_id: string;
          name: string;
          start_time: string;
          end_time: string;
          days_of_week: number[];
          additional_cost: number;
          capacity_per_slot: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          zone_id: string;
          name: string;
          start_time: string;
          end_time: string;
          days_of_week: number[];
          additional_cost?: number;
          capacity_per_slot?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          zone_id?: string;
          name?: string;
          start_time?: string;
          end_time?: string;
          days_of_week?: number[];
          additional_cost?: number;
          capacity_per_slot?: number | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          type: 'order_confirmed' | 'payment_confirmed' | 'order_preparing' | 'order_packed' | 'order_shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded' | 'review_request' | 'promo' | 'back_in_stock' | 'price_drop' | 'wishlist_sale';
          title: string;
          message: string;
          data: Json | null;
          is_read: boolean;
          read_at: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type: 'order_confirmed' | 'payment_confirmed' | 'order_preparing' | 'order_packed' | 'order_shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded' | 'review_request' | 'promo' | 'back_in_stock' | 'price_drop' | 'wishlist_sale';
          title: string;
          message: string;
          data?: Json | null;
          is_read?: boolean;
          read_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: 'order_confirmed' | 'payment_confirmed' | 'order_preparing' | 'order_packed' | 'order_shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded' | 'review_request' | 'promo' | 'back_in_stock' | 'price_drop' | 'wishlist_sale';
          title?: string;
          message?: string;
          data?: Json | null;
          is_read?: boolean;
          read_at?: string | null;
          sent_at?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
      };
      system_config: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          description?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          description?: string | null;
          is_public?: boolean;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_serviceability: {
        Args: { postal_code: string };
        Returns: {
          is_serviceable: boolean;
          zone_id: string | null;
          shipping_cost: number;
          estimated_days_min: number;
          estimated_days_max: number;
          same_day_available: boolean;
          same_day_cutoff_time: string | null;
        }[];
      };
      calculate_shipping: {
        Args: { postal_code: string; order_amount: number };
        Returns: {
          shipping_cost: number;
          is_free_shipping: boolean;
          estimated_days_min: number;
          estimated_days_max: number;
        }[];
      };
      get_available_delivery_dates: {
        Args: { postal_code: string; days_ahead?: number };
        Returns: {
          date: string;
          slots: { id: string; name: string; start_time: string; end_time: string; additional_cost: number }[];
        }[];
      };
    };
    Enums: {
      user_role: 'user' | 'admin';
      address_type: 'shipping' | 'billing' | 'both';
      product_status: 'draft' | 'active' | 'out_of_stock' | 'archived';
      item_category: 'box' | 'treat' | 'beverage' | 'keepsake' | 'card' | 'packaging';
      order_payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
      order_status: 'pending_payment' | 'paid' | 'confirmed' | 'preparing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'return_requested' | 'refund_processing' | 'refunded';
      payment_provider: 'razorpay' | 'stripe' | 'cod' | 'bank_transfer' | 'gift_card';
      payment_status: 'created' | 'attempted' | 'paid' | 'failed' | 'refunded' | 'cancelled';
      coupon_type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'free_shipping';
      gift_card_status: 'active' | 'expired' | 'redeemed' | 'cancelled';
      gift_card_transaction_type: 'purchase' | 'redeem' | 'refund' | 'expire';
      notification_type: 'order_confirmed' | 'payment_confirmed' | 'order_preparing' | 'order_packed' | 'order_shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded' | 'review_request' | 'promo' | 'back_in_stock' | 'price_drop' | 'wishlist_sale';
      custom_hamper_status: 'draft' | 'completed' | 'ordered';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}