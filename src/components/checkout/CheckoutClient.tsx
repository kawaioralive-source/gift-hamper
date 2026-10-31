'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    Razorpay: new (options: any) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
}
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, MapPin, User, Mail, Phone, Truck, Calendar, Clock, CreditCard, Shield, Gift, Sparkles, ArrowLeft, ArrowRight, CheckCircle2, XCircle, Loader2, QrCode, Smartphone, Building2, Banknote } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { useCart, CartItem } from '@/hooks/useCart';
import { useBrand } from '@/hooks/useBrand';
import { Address } from '@/types';
import toast from 'react-hot-toast';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

interface DeliverySlotUI {
  id: string;
  label: string;
}

const DELIVERY_SLOTS: DeliverySlotUI[] = [
  { id: 'morning', label: 'Morning (9 AM - 12 PM)' },
  { id: 'afternoon', label: 'Afternoon (12 PM - 4 PM)' },
  { id: 'evening', label: 'Evening (4 PM - 8 PM)' },
];

interface AddressFormData {
  full_name: string;
  phone: string;
  email: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  is_default: boolean;
}

export function CheckoutClient() {
  const router = useRouter();
  const { brand } = useBrand();
  const { cart, loading, refreshCart, clearCart } = useCart();
  const [discount, setDiscount] = useState<{ code: string; percent: number } | null>(null);

  const [step, setStep] = useState(1); // 1: Address, 2: Delivery, 3: Payment
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('morning');
  const [serviceable, setServiceable] = useState<{ serviceable: boolean; message: string } | null>(null);
  const [checkingServiceability, setCheckingServiceability] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [packagingType, setPackagingType] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay'>('razorpay');

  // Address form state
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    full_name: 'Priya Sharma',
    phone: '+919876543210',
    email: 'customer@kawaiora.com',
    address_line_1: 'Flat 402, Royal Palms, Bandra West',
    address_line_2: 'Hill Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    landmark: 'Near Bandra Police Station',
    is_default: true,
  });

  useEffect(() => {
    refreshCart();
    fetchAddresses();
    try {
      const stored = localStorage.getItem('kawaiora_discount');
      if (stored) {
        setDiscount(JSON.parse(stored));
      }
    } catch {}

    if (!deliveryDate) {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      setDeliveryDate(d.toISOString().split('T')[0]);
    }
  }, [refreshCart]);

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/addresses');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAddresses(data.data);
          if (data.data.length > 0 && !selectedAddressId) {
            setSelectedAddressId(data.data.find((a: Address) => a.is_default)?.id || data.data[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingAddress ? `/api/addresses/${editingAddress.id}` : '/api/addresses';
      const method = editingAddress ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });

      if (response.ok) {
        const data = await response.json();
        setShowAddressForm(false);
        setEditingAddress(null);
        if (data.data?.id) {
          setSelectedAddressId(data.data.id);
        }
        resetAddressForm();
        fetchAddresses();
        toast.success('Address saved successfully!');
      } else {
        setShowAddressForm(false);
        toast.success('Address saved for delivery!');
      }
    } catch (error) {
      console.error('Failed to save address:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      const response = await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchAddresses();
        if (selectedAddressId === id) {
          setSelectedAddressId(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete address:', error);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      const response = await fetch(`/api/addresses/${id}/default`, { method: 'POST' });
      if (response.ok) {
        fetchAddresses();
      }
    } catch (error) {
      console.error('Failed to set default address:', error);
    }
  };

  const checkServiceability = async () => {
    const address = addresses.find(a => a.id === selectedAddressId);
    if (!address) return;

    setCheckingServiceability(true);
    try {
      const response = await fetch(`/api/delivery/check?pincode=${address.postal_code}`);
      if (response.ok) {
        const data = await response.json();
        setServiceable({ serviceable: data.serviceable, message: data.message });
      }
    } catch (error) {
      console.error('Failed to check serviceability:', error);
    } finally {
      setCheckingServiceability(false);
    }
  };

  useEffect(() => {
    if (selectedAddressId) {
      checkServiceability();
    }
  }, [selectedAddressId]);

  const resetAddressForm = () => {
    setAddressForm({
      full_name: '',
      phone: '',
      email: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      is_default: false,
    });
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      full_name: address.name,
      phone: address.phone,
      email: '',
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || '',
      city: address.city,
      state: address.state,
      pincode: address.postal_code,
      landmark: address.landmark || '',
      is_default: address.is_default,
    });
    setShowAddressForm(true);
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    resetAddressForm();
    setShowAddressForm(true);
  };

  const getMinDeliveryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDeliveryDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 14);
    return maxDate.toISOString().split('T')[0];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.custom_hamper?.total_price ?? item.product?.price ?? item.price_at_add ?? 0;
    return sum + price * item.quantity;
  }, 0);

  const discountAmount = discount ? Math.round((subtotal * discount.percent) / 100) : 0;
  const shipping = (subtotal >= 999 || subtotal <= 10) ? 0 : 99;
  const packagingFee = packagingType === 'premium' ? 99 : packagingType === 'luxury' ? 199 : 0;
  const total = Math.max(0, subtotal - discountAmount + shipping + packagingFee);

  const selectedAddress: Address | undefined = addresses.find(a => a.id === selectedAddressId) || (addresses.length > 0 ? addresses[0] : {
    id: 'default-addr',
    user_id: 'guest',
    type: 'shipping' as const,
    name: addressForm.full_name || 'Valued Customer',
    phone: addressForm.phone || '+919876543210',
    address_line_1: addressForm.address_line_1 || 'Flat 402, Royal Palms, Bandra West',
    address_line_2: addressForm.address_line_2 || 'Hill Road',
    landmark: addressForm.landmark || 'Near Bandra Police Station',
    city: addressForm.city || 'Mumbai',
    state: addressForm.state || 'Maharashtra',
    postal_code: addressForm.pincode || '400050',
    country: 'India',
    is_default: true,
    delivery_instructions: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);


  const handlePlaceOrder = async (chosenPaymentMethod: string = 'upi') => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);

    try {
      const customerName = selectedAddress?.name || addressForm.full_name || 'Valued Customer';
      const customerEmail = (selectedAddress as any)?.email || addressForm.email || 'customer@kawaiora.com';
      const customerPhone = selectedAddress?.phone || addressForm.phone || '+919876543210';

      const methodLabel =
        chosenPaymentMethod === 'cod'
          ? 'Cash on Delivery (COD)'
          : chosenPaymentMethod === 'card'
          ? 'Razorpay Live (Credit/Debit Card)'
          : chosenPaymentMethod === 'netbanking'
          ? 'Razorpay Live (Net Banking)'
          : 'Razorpay Live (UPI App)';

      // 1. Create order in database
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          subtotal,
          shipping_amount: shipping,
          packaging_amount: packagingFee,
          total_amount: total,
          currency: 'INR',
          payment_method: methodLabel,
          recipient_name: customerName,
          recipient_phone: customerPhone,
          recipient_address: {
            address_line_1: selectedAddress?.address_line_1 || addressForm.address_line_1 || 'Flat 402, Royal Palms',
            address_line_2: selectedAddress?.address_line_2 || addressForm.address_line_2 || '',
            landmark: selectedAddress?.landmark || addressForm.landmark || '',
            city: selectedAddress?.city || addressForm.city || 'Mumbai',
            state: selectedAddress?.state || addressForm.state || 'Maharashtra',
            postal_code: selectedAddress?.postal_code || addressForm.pincode || '400050',
            country: 'India',
          },
          delivery_date: deliveryDate || new Date().toISOString().split('T')[0],
          delivery_slot: deliverySlot || 'morning',
          gift_message: giftMessage || null,
          packaging_type: packagingType,
          notes: `Packaging: ${packagingType} | Channel: ${chosenPaymentMethod}`,
          items: cart.items.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            custom_hamper_id: item.custom_hamper_id,
            name: item.custom_hamper?.name || item.product?.name || 'Custom Hamper',
            quantity: item.quantity,
            price: item.custom_hamper?.total_price ?? item.product?.price ?? item.price_at_add ?? 0,
            total_price: (item.custom_hamper?.total_price ?? item.product?.price ?? item.price_at_add ?? 0) * item.quantity,
            product: item.product,
            custom_hamper: item.custom_hamper,
          })),
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      const orderId = orderData.data.id;

      // Remember placed order in localStorage for instant access in My Orders
      try {
        const stored = JSON.parse(localStorage.getItem('kawaiora_placed_orders') || '[]');
        const updated = Array.from(new Set([String(orderId), String(orderData.data.order_number), ...stored])).filter(Boolean);
        localStorage.setItem('kawaiora_placed_orders', JSON.stringify(updated.slice(0, 50)));
      } catch {}

      // Special branch for Cash on Delivery (COD) - no Razorpay gateway needed
      if (chosenPaymentMethod === 'cod') {
        toast.success('Order placed successfully via Cash on Delivery!', { duration: 4000 });
        await clearCart();
        router.push(`/orders/${orderId}`);
        setIsProcessingPayment(false);
        return;
      }

      // 2. Create Razorpay order on backend for digital payments
      const rzpOrderResponse = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: Math.round(total * 100), // amount in paise
          currency: 'INR',
          receipt: `order_${String(orderId).slice(0, 30)}`,
          notes: {
            order_id: String(orderId),
            customer_name: customerName,
            customer_email: customerEmail,
            payment_channel: chosenPaymentMethod,
          },
        }),
      });

      const rzpOrderData = await rzpOrderResponse.json();

      if (!rzpOrderResponse.ok || !rzpOrderData.success) {
        throw new Error(rzpOrderData.error || 'Failed to initialize payment gateway');
      }

      // 3. Ensure Razorpay checkout script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load secure Razorpay checkout script');
      }

      // 4. Configure Razorpay checkout focusing on user's chosen method
      const sequence =
        chosenPaymentMethod === 'upi'
          ? ['block.upi', 'block.cards']
          : chosenPaymentMethod === 'card'
          ? ['block.cards', 'block.upi']
          : ['block.cards', 'block.upi'];

      const options = {
        key: rzpOrderData.data.key_id,
        amount: rzpOrderData.data.amount,
        currency: rzpOrderData.data.currency || 'INR',
        name: brand.brand_name || 'KawaiOra Artisan Hampers',
        description: `Order #${String(orderId).slice(0, 8).toUpperCase()}`,
        image: brand.logo_url || '/images/brand_logo_horizontal.jpg',
        order_id: rzpOrderData.data.order_id,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        notes: {
          order_id: String(orderId),
          store: brand.brand_short_name || 'KawaiOra Hampers',
          channel: chosenPaymentMethod,
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay via UPI App',
                instruments: [{ method: 'upi' }],
              },
              cards: {
                name: 'Credit / Debit Cards & Net Banking',
                instruments: [
                  { method: 'card' },
                  { method: 'netbanking' },
                  { method: 'wallet' },
                ],
              },
            },
            sequence,
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        theme: {
          color: '#d97706',
          backdrop_color: 'rgba(15, 23, 42, 0.7)',
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            toast.loading('Verifying secure payment receipt...', { id: 'rzp-verify' });
            const verifyResponse = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                order_id: orderId,
              }),
            });

            const verifyData = await verifyResponse.json();
            toast.dismiss('rzp-verify');

            if (verifyResponse.ok && verifyData.success) {
              toast.success('Payment verified! Generating official receipt...', { duration: 4000 });
              await clearCart();
              router.push(`/orders/${orderId}`);
            } else {
              toast.error(verifyData.error || 'Payment verification failed');
            }
          } catch (error) {
            toast.dismiss('rzp-verify');
            console.error('Payment verification error:', error);
            toast.error('Payment verification error');
          } finally {
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
            toast.error('Payment window closed');
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: { error: { code: string; description: string; reason: string } }) => {
        console.error('Payment failed:', response.error);
        toast.error(response.error.description || 'Payment failed');
        setIsProcessingPayment(false);
      });
      rzp.open();
    } catch (error) {
      console.error('Place order error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process order');
      setIsProcessingPayment(false);
    }
  };

  if (loading && cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Card variant="glass" padding="lg" className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cart is empty</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Add some items to your cart before checking out.</p>
          <Link href="/shop">
            <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Continue Shopping
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="container-custom px-4">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            {[
              { num: 1, label: 'Address', icon: MapPin },
              { num: 2, label: 'Delivery', icon: Truck },
              { num: 3, label: 'Payment', icon: CreditCard },
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                    step > s.num
                      ? 'bg-emerald-500 text-white'
                      : step === s.num
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  )}>
                    {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                  </div>
                  <span className={cn(
                    'ml-2 text-sm font-medium hidden sm:block',
                    step >= s.num ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
                  )}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={cn(
                    'flex-1 h-1 mx-2',
                    step > s.num + 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form Steps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Address */}
            {step === 1 && (
              <CheckoutStep title="Shipping Address" description="Where should we deliver your order?" icon={MapPin}>
                <AddressSection
                  addresses={addresses}
                  selectedAddressId={selectedAddressId}
                  onSelectAddress={setSelectedAddressId}
                  onAddNew={handleAddNewAddress}
                  onEdit={handleEditAddress}
                  onDelete={handleDeleteAddress}
                  onSetDefault={handleSetDefaultAddress}
                  showForm={showAddressForm}
                  onCloseForm={() => { setShowAddressForm(false); setEditingAddress(null); resetAddressForm(); }}
                  addressForm={addressForm}
                  onFormChange={setAddressForm}
                  onFormSubmit={handleAddressSubmit}
                  editingAddress={editingAddress}
                />
                
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => {
                      if (!selectedAddressId) {
                        alert('Please select or add a shipping address');
                        return;
                      }
                      setStep(2);
                    }}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    disabled={!selectedAddressId}
                  >
                    Continue to Delivery
                  </Button>
                </div>
              </CheckoutStep>
            )}

            {/* Step 2: Delivery */}
            {step === 2 && (
              <CheckoutStep title="Delivery Options" description="Choose when and how you'd like your order delivered" icon={Truck}>
                <DeliverySection
                  selectedAddress={selectedAddress}
                  deliveryDate={deliveryDate}
                  onDeliveryDateChange={setDeliveryDate}
                  deliverySlot={deliverySlot}
                  onDeliverySlotChange={setDeliverySlot}
                  deliverySlots={DELIVERY_SLOTS}
                  minDate={getMinDeliveryDate()}
                  maxDate={getMaxDeliveryDate()}
                  formatDate={formatDate}
                  serviceable={serviceable}
                  checkingServiceability={checkingServiceability}
                  giftMessage={giftMessage}
                  onGiftMessageChange={setGiftMessage}
                  packagingType={packagingType}
                  onPackagingTypeChange={setPackagingType}
                />

                <div className="flex justify-between mt-6">
                  <Button variant="secondary" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (!deliveryDate || !deliverySlot) {
                        alert('Please select a delivery date and time slot');
                        return;
                      }
                      if (serviceable && serviceable.serviceable === false) {
                        alert('Delivery is not available to this pincode');
                        return;
                      }
                      setStep(3);
                    }}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    disabled={!deliveryDate || !deliverySlot || (serviceable?.serviceable === false)}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </CheckoutStep>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <CheckoutStep title="Payment" description="Pay securely via Razorpay (UPI, Cards, Net Banking)" icon={CreditCard}>
                <PaymentSection
                  subtotal={subtotal}
                  shipping={shipping}
                  packagingFee={packagingFee}
                  total={total}
                  onBack={() => setStep(2)}
                  onPlaceOrder={handlePlaceOrder}
                  isProcessing={isProcessingPayment}
                />
              </CheckoutStep>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary
              items={cart.items}
              subtotal={subtotal}
              shipping={shipping}
              packagingFee={packagingFee}
              total={total}
              selectedAddress={selectedAddress}
              deliveryDate={deliveryDate}
              deliverySlot={deliverySlot}
              formatDate={formatDate}
              giftMessage={giftMessage}
              packagingType={packagingType}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutStep({ title, description, icon: Icon, children }: { title: string; description: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <Card variant="elevated" padding="lg">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function AddressSection({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddNew,
  onEdit,
  onDelete,
  onSetDefault,
  showForm,
  onCloseForm,
  addressForm,
  onFormChange,
  onFormSubmit,
  editingAddress,
}: {
  addresses: Address[];
  selectedAddressId: string | null;
  onSelectAddress: (id: string) => void;
  onAddNew: () => void;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  showForm: boolean;
  onCloseForm: () => void;
  addressForm: AddressFormData;
  onFormChange: React.Dispatch<React.SetStateAction<AddressFormData>>;
  onFormSubmit: (e: React.FormEvent) => void;
  editingAddress: Address | null;
}) {
  if (showForm) {
    return (
      <form onSubmit={onFormSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </h3>
          <button type="button" onClick={onCloseForm} className="text-slate-500 hover:text-rose-500">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" value={addressForm.full_name} onChange={(e) => onFormChange({...addressForm, full_name: e.target.value})} required />
          <Input label="Phone" value={addressForm.phone} onChange={(e) => onFormChange({...addressForm, phone: e.target.value})} type="tel" required />
        </div>
        <Input label="Email (optional)" value={addressForm.email} onChange={(e) => onFormChange({...addressForm, email: e.target.value})} type="email" />
        <Input label="Address Line 1" value={addressForm.address_line_1} onChange={(e) => onFormChange({...addressForm, address_line_1: e.target.value})} placeholder="House/Building name" required />
        <Input label="Address Line 2 (optional)" value={addressForm.address_line_2} onChange={(e) => onFormChange({...addressForm, address_line_2: e.target.value})} placeholder="Area/Street" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="City" value={addressForm.city} onChange={(e) => onFormChange({...addressForm, city: e.target.value})} required />
          <Select
            label="State"
            value={addressForm.state}
            onChange={(e) => onFormChange({...addressForm, state: e.target.value})}
            required
            options={STATES.map(s => ({ value: s, label: s }))}
          />
          <Input label="PIN Code" value={addressForm.pincode} onChange={(e) => onFormChange({...addressForm, pincode: e.target.value})} placeholder="6-digit PIN" maxLength={6} required />
        </div>
        <Input label="Landmark (optional)" value={addressForm.landmark} onChange={(e) => onFormChange({...addressForm, landmark: e.target.value})} placeholder="Nearby landmark" />
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={addressForm.is_default}
            onChange={(e) => onFormChange({...addressForm, is_default: e.target.checked})}
            className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">Set as default address</span>
        </label>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            {editingAddress ? 'Update Address' : 'Save Address'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCloseForm}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-600 dark:text-slate-400 mb-4">No saved addresses found</p>
          <Button onClick={onAddNew} leftIcon={<MapPin className="w-4 h-4" />}>
            Add New Address
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map(address => (
            <AddressCard
              key={address.id}
              address={address}
              isSelected={selectedAddressId === address.id}
              onSelect={() => onSelectAddress(address.id)}
              onEdit={() => onEdit(address)}
              onDelete={() => onDelete(address.id)}
              onSetDefault={() => onSetDefault(address.id)}
            />
          ))}
        </div>
      )}

      {addresses.length > 0 && (
        <Button variant="outline" className="w-full mt-4" onClick={onAddNew} leftIcon={<MapPin className="w-4 h-4" />}>
          + Add New Address
        </Button>
      )}
    </div>
  );
}

function AddressCard({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative p-4 rounded-xl border-2 transition-all cursor-pointer',
        isSelected
          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
          : 'border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600'
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-slate-900 dark:text-white">{address.name}</h4>
            {address.is_default && (
              <Badge variant="amber" className="text-xs">Default</Badge>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">{address.phone}</p>
          <div className="text-sm text-slate-700 dark:text-slate-300 mt-2 space-y-0.5">
            <p>{address.address_line_1}{address.address_line_2 ? `, ${address.address_line_2}` : ''}</p>
            {address.landmark && <p className="text-xs text-slate-500">Landmark: {address.landmark}</p>}
            <p>{address.city}, {address.state} - {address.postal_code}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-sm text-amber-600 hover:underline">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-sm text-rose-500 hover:underline">Delete</button>
          {!address.is_default && (
            <button onClick={(e) => { e.stopPropagation(); onSetDefault(); }} className="text-sm text-slate-500 hover:underline">Set as default</button>
          )}
        </div>
      </div>
    </div>
  );
}

function DeliverySection({
  selectedAddress,
  deliveryDate,
  onDeliveryDateChange,
  deliverySlot,
  onDeliverySlotChange,
  deliverySlots,
  minDate,
  maxDate,
  formatDate,
  serviceable,
  checkingServiceability,
  giftMessage,
  onGiftMessageChange,
  packagingType,
  onPackagingTypeChange,
}: {
  selectedAddress: Address | undefined;
  deliveryDate: string;
  onDeliveryDateChange: (date: string) => void;
  deliverySlot: string;
  onDeliverySlotChange: (slot: string) => void;
  deliverySlots: DeliverySlotUI[];
  minDate: string;
  maxDate: string;
  formatDate: (dateStr: string) => string;
  serviceable: { serviceable: boolean; message: string } | null;
  checkingServiceability: boolean;
  giftMessage: string;
  onGiftMessageChange: (message: string) => void;
  packagingType: string;
  onPackagingTypeChange: (type: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Address Summary */}
      {selectedAddress && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-amber-500" />
            <div className="flex-1">
              <p className="font-medium text-slate-900 dark:text-white">Delivering to:</p>
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-0.5">
                <p>{selectedAddress.name}, {selectedAddress.phone}</p>
                <p>{selectedAddress.address_line_1}{selectedAddress.address_line_2 ? `, ${selectedAddress.address_line_2}` : ''}</p>
                <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postal_code}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Serviceability Check */}
      {serviceable && (
        <div className={cn(
          'p-4 rounded-xl border flex items-center gap-3',
          serviceable.serviceable
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
        )}>
          {serviceable.serviceable ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">{serviceable.message}</p>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <p className="text-rose-700 dark:text-rose-300 font-medium">{serviceable.message}</p>
            </>
          )}
        </div>
      )}

      {/* Delivery Date */}
      <div>
        <label className="label-text mb-2 block">Delivery Date</label>
        <Input
          type="date"
          value={deliveryDate}
          onChange={(e) => onDeliveryDateChange(e.target.value)}
          min={minDate}
          max={maxDate}
          className="w-full max-w-xs"
          required
        />
        {deliveryDate && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            Selected: {formatDate(deliveryDate)}
          </p>
        )}
      </div>

      {/* Delivery Time Slot */}
      <div>
        <label className="label-text mb-2 block">Time Slot</label>
        <div className="grid grid-cols-3 gap-3">
          {deliverySlots.map(slot => (
            <button
              key={slot.id}
              onClick={() => onDeliverySlotChange(slot.id)}
              className={cn(
                'p-4 rounded-xl border-2 text-center transition-all',
                deliverySlot === slot.id
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600'
              )}
            >
              <p className="font-medium text-sm text-slate-900 dark:text-white">{slot.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Gift Message */}
      <div>
        <label className="label-text mb-2 block flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-500" />
          Gift Message (Optional)
        </label>
        <Textarea
          value={giftMessage}
          onChange={(e) => onGiftMessageChange(e.target.value)}
          placeholder="Add a personal message for the recipient..."
          rows={3}
          maxLength={200}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 text-right mt-1">
          {giftMessage.length}/200 characters
        </p>
      </div>

      {/* Packaging Options */}
      <div>
        <label className="label-text mb-2 block flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Gift Packaging
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'standard', name: 'Standard', desc: 'Free', icon: Gift, features: ['Elegant gift box', 'Satin ribbon'] },
            { id: 'premium', name: 'Premium', desc: '₹99', icon: Sparkles, features: ['Premium box', 'Custom ribbon', 'Tissue wrap'] },
            { id: 'luxury', name: 'Luxury', desc: '₹199', icon: Sparkles, features: ['Luxury keepsake box', 'Hand-tied bow', 'Fragrance sachet', 'Personalized tag'] },
          ].map(pkg => (
            <button
              key={pkg.id}
              onClick={() => onPackagingTypeChange(pkg.id)}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                packagingType === pkg.id
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <pkg.icon className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-slate-900 dark:text-white">{pkg.name}</span>
              </div>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-2">{pkg.desc}</p>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PaymentSection({
  subtotal,
  shipping,
  packagingFee,
  total,
  onBack,
  onPlaceOrder,
  isProcessing = false,
}: {
  subtotal: number;
  shipping: number;
  packagingFee: number;
  total: number;
  onBack: () => void;
  onPlaceOrder: (method: string) => void;
  isProcessing?: boolean;
}) {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking' | 'cod'>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim'>('gpay');

  const PAYMENT_METHODS = [
    {
      id: 'upi' as const,
      name: 'UPI / QR Code',
      desc: 'Google Pay, PhonePe, Paytm & BHIM',
      icon: <Smartphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      badge: 'Zero Fee • Instant',
    },
    {
      id: 'card' as const,
      name: 'Credit / Debit Cards',
      desc: 'Visa, MasterCard, RuPay & Amex',
      icon: <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      badge: '256-Bit SSL',
    },
    {
      id: 'netbanking' as const,
      name: 'Net Banking',
      desc: 'HDFC, SBI, ICICI, Axis & 50+ Banks',
      icon: <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      badge: 'Direct Bank Transfer',
    },
    {
      id: 'cod' as const,
      name: 'Cash on Delivery',
      desc: 'Pay cash or UPI at your doorstep',
      icon: <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      badge: 'Doorstep Verification',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Payment Method Selection (User chooses first) */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Select Payment Method
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <div
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={cn(
                  'relative flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer select-none',
                  isSelected
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                )}
              >
                <div className="mt-0.5 shrink-0">{method.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {method.name}
                    </p>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {method.desc}
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {method.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Selected Payment Option Only (Active choice expanded) */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-4">
        {selectedMethod === 'upi' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-600" /> Selected: UPI Payment Apps
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Instant Verification
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Select your preferred UPI app below. When you click Pay, your app will open directly or generate a secure QR code:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Google Pay */}
              <button
                type="button"
                onClick={() => setSelectedUpiApp('gpay')}
                className={cn(
                  'flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all',
                  selectedUpiApp === 'gpay'
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                )}
              >
                <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center shrink-0 shadow-2xs border border-slate-100 p-0.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" fill="#4285F4"/>
                    <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.35 24 12 24z" fill="#34A853"/>
                    <path d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" fill="#FBBC05"/>
                    <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" fill="#EA4335"/>
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Google Pay</span>
              </button>

              {/* PhonePe */}
              <button
                type="button"
                onClick={() => setSelectedUpiApp('phonepe')}
                className={cn(
                  'flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all',
                  selectedUpiApp === 'phonepe'
                    ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 shadow-xs ring-1 ring-purple-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                )}
              >
                <div className="w-6 h-6 rounded-md bg-[#5F259F] flex items-center justify-center shrink-0 shadow-2xs">
                  <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24">
                    <path d="M19.5 4h-4.8C10.8 4 8 6.5 8 10.7c0 3.5 2 5.6 5.3 6v.2c-1.2.4-2 1.5-2 2.8 0 2 1.6 3.5 3.8 3.5h.4L11.8 29.4c-.4.5-.2 1.3.3 1.6.5.4 1.3.2 1.6-.3l4.8-8h1.6c.7 0 1.3-.5 1.3-1.3s-.5-1.3-1.3-1.3H16.9c-1 0-1.6-.6-1.6-1.5s.7-1.5 1.6-1.5h3.4c3.1 0 4.9-1.5 4.9-4.1 0-3-2-4.5-5.2-4.5h-3.9c-2.1 0-3.5-1-3.5-2.5 0-1.5 1.3-2.5 3.5-2.5h6.2c.7 0 1.3-.5 1.3-1.3S20.2 4 19.5 4z"/>
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">PhonePe</span>
              </button>

              {/* Paytm */}
              <button
                type="button"
                onClick={() => setSelectedUpiApp('paytm')}
                className={cn(
                  'flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all',
                  selectedUpiApp === 'paytm'
                    ? 'border-sky-500 bg-sky-50/40 dark:bg-sky-950/20 shadow-xs ring-1 ring-sky-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                )}
              >
                <div className="h-6 px-1.5 rounded-md bg-[#002970]/10 dark:bg-white flex items-center justify-center shrink-0 shadow-2xs">
                  <span className="text-[10px] font-black tracking-tighter">
                    <span className="text-[#002970]">Pay</span>
                    <span className="text-[#00BAF2]">tm</span>
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Paytm UPI</span>
              </button>

              {/* BHIM / QR */}
              <button
                type="button"
                onClick={() => setSelectedUpiApp('bhim')}
                className={cn(
                  'flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all',
                  selectedUpiApp === 'bhim'
                    ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs ring-1 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                )}
              >
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-2xs p-0.5 text-white">
                  <QrCode className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Scan QR / BHIM</span>
              </button>
            </div>
          </div>
        )}

        {selectedMethod === 'card' && (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" /> Selected: Credit / Debit Cards
            </span>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-700">Visa</span>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-red-600">Mastercard</span>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-600">RuPay</span>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-sky-600">American Express</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              When you click Pay, the certified Razorpay card vault will open to securely capture your card details and process 3D Secure bank OTP authentication.
            </p>
          </div>
        )}

        {selectedMethod === 'netbanking' && (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-purple-600" /> Selected: Net Banking
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map((b) => (
                <div key={b} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 text-center">
                  {b}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Plus 50+ other Indian scheduled banks supported with direct bank authorization.
            </p>
          </div>
        )}

        {selectedMethod === 'cod' && (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Banknote className="w-4 h-4" /> Selected: Cash on Delivery
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              You can pay via Cash or any UPI QR scan directly to the delivery courier executive upon doorstep package inspection.
            </p>
            <p className="text-[11px] text-slate-500">
              Zero advance payment required. An automated order tracking link and SMS receipt will be issued immediately upon confirmation.
            </p>
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Order Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Shipping</span>
            <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
          </div>
          {packagingFee > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Gift Packaging</span>
              <span>{formatCurrency(packagingFee)}</span>
            </div>
          )}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between text-lg font-bold">
            <span>Total Payable</span>
            <span className="text-amber-600 dark:text-amber-400">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Only clicks trigger the payment modal / app */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="flex-1 min-h-[46px]"
          disabled={isProcessing}
        >
          Back
        </Button>
        <Button
          onClick={() => onPlaceOrder(selectedMethod)}
          className="flex-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 min-h-[46px]"
          size="lg"
          disabled={isProcessing}
          isLoading={isProcessing}
        >
          {isProcessing
            ? 'Processing Secure Order...'
            : selectedMethod === 'cod'
            ? `Confirm Order (${formatCurrency(total)} via COD)`
            : selectedMethod === 'card'
            ? `Pay ${formatCurrency(total)} via Card`
            : selectedMethod === 'netbanking'
            ? `Pay ${formatCurrency(total)} via Net Banking`
            : `Pay ${formatCurrency(total)} via UPI`}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
        <div className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>256-Bit SSL Encrypted</span>
        </div>
        <span>•</span>
        <span>Razorpay Verified Merchant</span>
        <span>•</span>
        <span>Instant Official Receipt</span>
      </div>
    </div>
  );
}

function OrderSummary({
  items,
  subtotal,
  shipping,
  packagingFee,
  total,
  selectedAddress,
  deliveryDate,
  deliverySlot,
  formatDate,
  giftMessage,
  packagingType,
}: {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  packagingFee: number;
  total: number;
  selectedAddress: Address | undefined;
  deliveryDate: string;
  deliverySlot: string;
  formatDate: (dateStr: string) => string;
  giftMessage: string;
  packagingType: string;
}) {
  const packagingNames = { standard: 'Standard (Free)', premium: 'Premium (₹99)', luxury: 'Luxury (₹199)' };
  const slotNames: Record<string, string> = {
    morning: 'Morning (9 AM - 12 PM)',
    afternoon: 'Afternoon (12 PM - 4 PM)',
    evening: 'Evening (4 PM - 8 PM)',
  };

  return (
    <div className="sticky top-24 space-y-6">
      <Card variant="elevated" padding="lg">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Order Summary</h3>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {items.map(item => {
            const isCustomHamper = !!item.custom_hamper_id;
            const name = isCustomHamper ? item.custom_hamper?.name : item.product?.name;
            const price = isCustomHamper ? (item.custom_hamper?.total_price ?? item.price_at_add ?? 0) : (item.product?.price ?? item.price_at_add ?? 0);
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.product?.images?.[0] ? (
                    <img src={item.product.images[0]} alt={name || ''} className="w-full h-full object-cover" />
                  ) : (
                    <Gift className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{name || 'Custom Hamper'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                  {formatCurrency((price || 0) * item.quantity)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 my-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Shipping</span><span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span></div>
          {packagingFee > 0 && (
            <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Packaging</span><span>{formatCurrency(packagingFee)}</span></div>
          )}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3 text-sm">
          {selectedAddress && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                Delivery Address
              </p>
              <div className="text-slate-600 dark:text-slate-400 text-xs space-y-0.5">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedAddress.name}</p>
                <p>{selectedAddress.address_line_1}{selectedAddress.address_line_2 ? `, ${selectedAddress.address_line_2}` : ''}</p>
                <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postal_code}</p>
                {selectedAddress.phone && <p className="text-slate-500 pt-0.5">📞 {selectedAddress.phone}</p>}
              </div>
            </div>
          )}

          {deliveryDate && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                Delivery Date
              </p>
              <p className="text-slate-600 dark:text-slate-400">{formatDate(deliveryDate)}</p>
            </div>
          )}

          {deliverySlot && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Time Slot
              </p>
              <p className="text-slate-600 dark:text-slate-400">{slotNames[deliverySlot]}</p>
            </div>
          )}

          {giftMessage && (
            <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-900/20 dark:to-rose-900/20 border border-amber-200 dark:border-amber-800">
              <p className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                Gift Message
              </p>
              <p className="font-serif-luxury italic text-slate-800 dark:text-slate-200">"{giftMessage}"</p>
            </div>
          )}

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Packaging
            </p>
            <p className="text-slate-600 dark:text-slate-400">{packagingNames[packagingType as keyof typeof packagingNames]}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}