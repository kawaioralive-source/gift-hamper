'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Check, X, Gift, Sparkles, Heart, ShoppingBag, Tag, Image, PenTool, Palette, Box, Coffee, Cookie, Ribbon, Package, Truck, Shield, Sparkles as SparklesIcon } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useCart } from '@/hooks/useCart';

interface BuilderItem {
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
  specifications: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BuilderItemsResponse {
  success: boolean;
  data: {
    box: BuilderItem[];
    treat: BuilderItem[];
    beverage: BuilderItem[];
    keepsake: BuilderItem[];
    card: BuilderItem[];
    packaging: BuilderItem[];
  };
}

interface CustomHamperState {
  step: number;
  box_id: string | null;
  items: Array<{ item_id: string; quantity: number }>;
  card_id: string | null;
  card_message: string;
  packaging_id: string | null;
  recipient_name: string;
  occasion: string;
}

interface Totals {
  boxPrice: number;
  itemsPrice: number;
  cardPrice: number;
  packagingPrice: number;
  customizationFee: number;
  total: number;
}

const STEPS = [
  { number: 1, title: 'Choose Box', icon: Box, description: 'Select your gift box or basket' },
  { number: 2, title: 'Add Items', icon: Gift, description: 'Pick treats, drinks & keepsakes' },
  { 3: 'Choose Card', icon: PenTool, description: 'Pick a card & write your message' },
  { 4: 'Packaging', icon: Package, description: 'Ribbon, wrap & finishing touches' },
  { 5: 'Review', icon: SparklesIcon, description: 'Review & add to cart' },
];

const OCCASIONS = [
  'Birthday', 'Anniversary', 'Wedding', "Valentine's Day", 'Baby Shower',
  'Corporate', 'Festival', 'Friendship', 'Get Well', 'Thank You',
  'Congratulations', 'Just Because',
];

export function CustomBuilderClient() {
  const router = useRouter();
  const { addToCart, refreshCart } = useCart();
  const [items, setItems] = useState<BuilderItemsResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<CustomHamperState>({
    step: 1,
    box_id: null,
    items: [],
    card_id: null,
    card_message: '',
    packaging_id: null,
    recipient_name: '',
    occasion: 'Birthday',
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch builder items on mount
  useEffect(() => {
    fetchBuilderItems();
  }, []);

  const fetchBuilderItems = async () => {
    try {
      const response = await fetch('/api/custom-builder');
      const data: BuilderItemsResponse = await response.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch builder items:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateState = useCallback((updates: Partial<CustomHamperState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const goToStep = (step: number) => {
    // Validate current step before moving forward
    if (step > state.step) {
      if (!validateStep(state.step)) return;
    }
    updateState({ step });
  };

  const nextStep = () => {
    if (validateStep(state.step)) {
      updateState({ step: state.step + 1 });
    }
  };

  const prevStep = () => {
    updateState({ step: state.step - 1 });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!state.box_id) {
          alert('Please select a box to continue');
          return false;
        }
        return true;
      case 2:
        if (state.items.length === 0) {
          alert('Please add at least one item to your hamper');
          return false;
        }
        return true;
      case 3:
        // Card is optional
        return true;
      case 4:
        // Packaging is optional
        return true;
      default:
        return true;
    }
  };

  const handleBoxSelect = (boxId: string) => {
    updateState({ box_id: boxId });
  };

  const handleItemToggle = (itemId: string) => {
    const existingIndex = state.items.findIndex(i => i.item_id === itemId);
    if (existingIndex >= 0) {
      const newItems = state.items.filter(i => i.item_id !== itemId);
      updateState({ items: newItems });
    } else {
      updateState({ items: [...state.items, { item_id: itemId, quantity: 1 }] });
    }
  };

  const handleItemQuantityChange = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleItemToggle(itemId);
      return;
    }
    updateState({
      items: state.items.map(i =>
        i.item_id === itemId ? { ...i, quantity } : i
      ),
    });
  };

  const handleCardSelect = (cardId: string) => {
    updateState({ card_id: cardId });
  };

  const handlePackagingSelect = (packagingId: string) => {
    updateState({ packaging_id: packagingId });
  };

const calculateTotalsLocal = () => {
    if (!items) return { boxPrice: 0, itemsPrice: 0, cardPrice: 0, packagingPrice: 0, customizationFee: 0, total: 0 };

    const box = items.box.find(b => b.id === state.box_id);
    const card = items.card.find(c => c.id === state.card_id);
    const packaging = items.packaging.find(p => p.id === state.packaging_id);

    const boxPrice = box?.price || 0;
    const cardPrice = card?.price || 0;
    const packagingPrice = packaging?.price || 0;
    const itemsPrice = state.items.reduce((sum, item) => {
      const builderItem = [...items.treat, ...items.beverage, ...items.keepsake].find(b => b.id === item.item_id);
      return sum + (builderItem?.price || 0) * item.quantity;
    }, 0);

    const customizationFee = 49; // Fixed customization fee
    const subtotal = boxPrice + itemsPrice + cardPrice + packagingPrice + customizationFee;

    return { boxPrice, itemsPrice, cardPrice, packagingPrice, customizationFee, total: subtotal };
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    try {
      const totals = calculateTotalsLocal();
      const customHamperData = {
        name: `Custom ${items?.box.find(b => b.id === state.box_id)?.name || 'Hamper'}`,
        box_id: state.box_id,
        card_id: state.card_id,
        card_message: state.card_message || null,
        packaging_id: state.packaging_id,
        items: state.items.map(i => ({ item_id: i.item_id, quantity: i.quantity })),
        subtotal: totals.boxPrice + totals.itemsPrice + totals.cardPrice + totals.packagingPrice,
        customization_fee: totals.customizationFee,
        packaging_fee: totals.packagingPrice,
        total_price: totals.total,
        status: 'completed' as const,
      };

      const response = await fetch('/api/custom-hamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customHamperData),
      });

      const data = await response.json();
      if (data.success) {
        setShowSuccessModal(true);
      } else {
        alert(data.error || 'Failed to create custom hamper');
      }
    } catch (error) {
      console.error('Failed to create custom hamper:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleAddToCart = async () => {
    if (!validateStep(5)) return;

    try {
      const totals = calculateTotalsLocal();
      const customHamperData = {
        name: `Custom ${items?.box.find(b => b.id === state.box_id)?.name || 'Hamper'}`,
        box_id: state.box_id,
        card_id: state.card_id,
        card_message: state.card_message || null,
        packaging_id: state.packaging_id,
        items: state.items.map(i => ({ item_id: i.item_id, quantity: i.quantity })),
        subtotal: totals.boxPrice + totals.itemsPrice + totals.cardPrice + totals.packagingPrice,
        customization_fee: totals.customizationFee,
        packaging_fee: totals.packagingPrice,
        total_price: totals.total,
        status: 'completed' as const,
      };

      const response = await fetch('/api/custom-hamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customHamperData),
      });

      const data = await response.json();
      if (data.success) {
        // Add to cart through useCart to keep state synchronized across entire app
        const box = items?.box?.find(b => b.id === state.box_id);
        await addToCart(undefined, data.data.id, 1, {
          id: data.data.id,
          name: box ? `Custom ${box.name} Hamper` : 'Custom Artisan Hamper',
          price: totals.total,
          images: box?.image_url ? [box.image_url] : []
        });
        await refreshCart();
        setShowSuccessModal(true);
      } else {
        alert(data.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('An error occurred. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading builder items...</p>
        </div>
      </div>
    );
  }

  if (!items) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-600 dark:text-slate-400">Failed to load builder items</p>
      </div>
    );
  }

  const totals = calculateTotalsLocal();
  const currentStepInfo = STEPS[state.step - 1];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      {/* Progress Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-20 z-40">
        <div className="container-custom px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Build Your Custom Hamper</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Step {state.step} of 5: {currentStepInfo.title}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totals.total)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Estimated Total</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center overflow-x-auto scrollbar-hide py-1 min-w-0">
            {STEPS.map((stepInfo, index) => {
              const isActive = index + 1 === state.step;
              const isCompleted = index + 1 < state.step;
              return (
                <React.Fragment key={stepInfo.number}>
                  <div className="flex flex-col items-center flex-1 min-w-[55px] relative">
                    <div className={cn(
                      'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 z-10 shrink-0',
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isActive
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                    )}>
                      {isCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : stepInfo.number}
                    </div>
                    <span className={cn(
                      'mt-1.5 text-[10px] sm:text-xs font-medium text-center truncate max-w-[70px]',
                      isActive ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'
                    )}>
                      {stepInfo.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      'flex-1 h-0.5 sm:h-1 mx-1 sm:mx-2 transition-colors duration-300 min-w-[12px]',
                      isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                    )} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Builder Content */}
      <div className="container-custom px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Steps Content */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-2xl p-6 animate-in">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <currentStepInfo.icon className="w-6 h-6 text-amber-500" />
                  {currentStepInfo.title}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{currentStepInfo.description}</p>
              </div>

              {/* Step 1: Choose Box */}
              {state.step === 1 && (
                <BoxSelectionStep items={items.box} selectedId={state.box_id} onSelect={handleBoxSelect} />
              )}

              {/* Step 2: Add Items */}
              {state.step === 2 && (
                <ItemsSelectionStep
                  items={items}
                  selectedItems={state.items}
                  onToggle={handleItemToggle}
                  onQuantityChange={handleItemQuantityChange}
                />
              )}

              {/* Step 3: Choose Card */}
              {state.step === 3 && (
                <CardSelectionStep
                  items={items.card}
                  selectedId={state.card_id}
                  onSelect={handleCardSelect}
                  cardMessage={state.card_message}
                  onMessageChange={(e) => updateState({ card_message: e.target.value })}
                  recipientName={state.recipient_name}
                  onRecipientNameChange={(e) => updateState({ recipient_name: e.target.value })}
                  occasion={state.occasion}
                  onOccasionChange={(e) => updateState({ occasion: e.target.value })}
                />
              )}

              {/* Step 4: Packaging */}
              {state.step === 4 && (
                <PackagingSelectionStep
                  items={items.packaging}
                  selectedId={state.packaging_id}
                  onSelect={handlePackagingSelect}
                />
              )}

              {/* Step 5: Review */}
              {state.step === 5 && (
                <ReviewStep
                  items={items}
                  state={state}
                  totals={totals}
                />
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800 mt-8">
                <Button
                  variant="secondary"
                  onClick={prevStep}
                  disabled={state.step === 1}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>

                {state.step < 5 ? (
                  <Button onClick={nextStep} rightIcon={<ChevronRight className="w-4 h-4" />}>
                    Next Step
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => prevStep()}>
                      Edit
                    </Button>
                    <Button onClick={handleAddToCart} rightIcon={<ShoppingBag className="w-4 h-4" />}>
                      Add to Cart ({formatCurrency(totals.total)})
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Live Preview */}
          <div className="lg:col-span-1">
            <BuilderPreview
              items={items}
              state={state}
              totals={totals}
              onAddToCart={handleAddToCart}
            />
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push('/cart');
        }}
        title="Hamper Added to Cart!"
        size="md"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your custom hamper is in the cart!</h3>
          <p className="text-slate-600 dark:text-slate-400">Ready to checkout or continue shopping.</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setShowSuccessModal(false); router.push('/customize/new'); }}>
              Build Another
            </Button>
            <Button onClick={() => { setShowSuccessModal(false); router.push('/cart'); }}>
              View Cart
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- Step Components ---------- */

function BoxSelectionStep({ items, selectedId, onSelect }: { items: BuilderItem[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={cn(
            'relative p-4 rounded-xl border-2 transition-all duration-200 text-left',
            selectedId === item.id
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600'
          )}
        >
          {selectedId === item.id && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
          )}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Gift className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 dark:text-white truncate">{item.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.description}</p>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-2">{formatCurrency(item.price)}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function ItemsSelectionStep({
  items,
  selectedItems,
  onToggle,
  onQuantityChange,
}: {
  items: BuilderItemsResponse['data'];
  selectedItems: Array<{ item_id: string; quantity: number }>;
  onToggle: (itemId: string) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
}) {
  const allItems = [
    ...(items.treat || []).map(i => ({ ...i, categoryLabel: 'Treats & Chocolates', categoryIcon: Cookie })),
    ...(items.beverage || []).map(i => ({ ...i, categoryLabel: 'Wines & Beverages', categoryIcon: Coffee })),
    ...(items.keepsake || []).map(i => ({ ...i, categoryLabel: 'Keepsakes & Spa', categoryIcon: SparklesIcon })),
  ];

  const grouped = allItems.reduce((acc, item) => {
    if (!acc[item.categoryLabel]) acc[item.categoryLabel] = [];
    acc[item.categoryLabel].push(item);
    return acc;
  }, {} as Record<string, typeof allItems>);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([categoryLabel, categoryItems]) => {
        const CategoryIcon = categoryItems[0].categoryIcon;
        return (
          <div key={categoryLabel}>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
              <CategoryIcon className="w-5 h-5 text-amber-500" />
              {categoryLabel}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryItems.map(item => {
                const selected = selectedItems.find(s => s.item_id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => onToggle(item.id)}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                      selected
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Cookie className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-slate-900 dark:text-white truncate">{item.name}</h4>
                          {selected && <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                        <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(item.price)}</p>
                      </div>
                    </div>
                    {selected && (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onQuantityChange(item.id, selected.quantity - 1); }}
                          className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-bold text-slate-900 dark:text-white">{selected.quantity}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onQuantityChange(item.id, selected.quantity + 1); }}
                          className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CardSelectionStep({
  items,
  selectedId,
  onSelect,
  cardMessage,
  onMessageChange,
  recipientName,
  onRecipientNameChange,
  occasion,
  onOccasionChange,
}: {
  items: BuilderItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  cardMessage: string;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  recipientName: string;
  onRecipientNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  occasion: string;
  onOccasionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Occasion & Recipient */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label-text">Occasion</label>
          <select
            value={occasion}
            onChange={onOccasionChange}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <Input
          label="Recipient Name"
          value={recipientName}
          onChange={onRecipientNameChange}
          placeholder="e.g., Mom, Sarah, Team"
        />
      </div>

      {/* Card Options */}
      <div>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Choose a Greeting Card</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                'relative p-4 rounded-xl border-2 transition-all duration-200 text-left',
                selectedId === item.id
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600'
              )}
            >
              {selectedId === item.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Image className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">{item.name}</h4>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(item.price)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Card Message */}
      <div>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Your Personal Message</h4>
        <Textarea
          value={cardMessage}
          onChange={onMessageChange}
          placeholder="Write your heartfelt message here..."
          rows={4}
          helperText={`${cardMessage.length}/200 characters`}
        />
      </div>

      {/* Live Card Preview */}
      {cardMessage && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-900/20 dark:to-rose-900/20 border border-amber-200 dark:border-amber-800">
          <div className="font-serif-luxury italic text-slate-800 dark:text-slate-200 text-center">
            "{cardMessage}"
          </div>
          {recipientName && (
            <div className="text-right mt-4 font-semibold text-slate-700 dark:text-slate-300">
              — {recipientName}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PackagingSelectionStep({ items, selectedId, onSelect }: { items: BuilderItem[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={cn(
            'relative p-4 rounded-xl border-2 transition-all duration-200 text-left',
            selectedId === item.id
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600'
          )}
        >
          {selectedId === item.id && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Ribbon className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">{item.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.description}</p>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-2">{formatCurrency(item.price)}</p>
            </div>
          </div>
        </button>
      ))}
      {/* No packaging option */}
      <button
        onClick={() => onSelect('')}
        className={cn(
          'relative p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-4',
          !selectedId || selectedId === ''
            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600'
        )}
      >
        {(!selectedId || selectedId === '') && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
        )}
        <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
          <Package className="w-6 h-6 text-slate-400" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white">No Additional Packaging</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Standard gift box included with your hamper</p>
          <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-2">Free</p>
        </div>
      </button>
    </div>
  );
}

function ReviewStep({ items, state, totals }: { items: BuilderItemsResponse['data']; state: CustomHamperState; totals: Totals }) {
  const box = items.box.find(b => b.id === state.box_id);
  const card = items.card.find(c => c.id === state.card_id);
  const packaging = items.packaging.find(p => p.id === state.packaging_id);
  const selectedItems = state.items.map(i => {
    const item = [...items.treat, ...items.beverage, ...items.keepsake].find(b => b.id === i.item_id);
    return { ...i, item };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PreviewCard title="Box" content={box?.name || 'None'} price={totals.boxPrice} image={box?.image_url} icon={Box} />
        <PreviewCard title="Greeting Card" content={card?.name || 'None'} price={totals.cardPrice} image={card?.image_url} icon={PenTool} />
      </div>

      <div>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-amber-500" />
          Items ({state.items.length})
        </h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {selectedItems.map(({ item, quantity }) => (
            <div key={item?.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                {item?.image_url ? (
                  <img src={item.image_url} alt={item?.name} className="w-full h-full object-cover" />
                ) : (
                  <Gift className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">{item?.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Qty: {quantity} × {formatCurrency(item?.price || 0)}</p>
              </div>
              <p className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency((item?.price || 0) * quantity)}</p>
            </div>
          ))}
        </div>
      </div>

      <PreviewCard title="Packaging" content={packaging?.name || 'Standard (Free)'} price={totals.packagingPrice} image={packaging?.image_url} icon={Package} />

      {/* Price Breakdown */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Price Breakdown</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Box</span><span>{formatCurrency(totals.boxPrice)}</span></div>
          <div className="flex justify-between"><span>Items ({state.items.length})</span><span>{formatCurrency(totals.itemsPrice)}</span></div>
          <div className="flex justify-between"><span>Greeting Card</span><span>{formatCurrency(totals.cardPrice)}</span></div>
          <div className="flex justify-between"><span>Packaging</span><span>{formatCurrency(totals.packagingPrice)}</span></div>
          <div className="flex justify-between"><span>Customization Fee</span><span>{formatCurrency(totals.customizationFee)}</span></div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ title, content, price, image, icon: Icon }: { title: string; content: string; price: number; image?: string | null; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        <Icon className="w-4 h-4 text-amber-500" />
        {title}
      </div>
      <div className="flex items-center gap-3">
        {image && (
          <img src={image} alt={content} className="w-12 h-12 rounded-lg object-cover" />
        )}
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{content}</p>
          <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatCurrency(price)}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Right Sidebar Preview ---------- */

function BuilderPreview({ items, state, totals, onAddToCart }: { items: BuilderItemsResponse['data']; state: CustomHamperState; totals: Totals; onAddToCart?: () => void }) {
  const box = items.box.find(b => b.id === state.box_id);
  const card = items.card.find(c => c.id === state.card_id);
  const packaging = items.packaging.find(p => p.id === state.packaging_id);
  const selectedItems = state.items.map(i => {
    const item = [...items.treat, ...items.beverage, ...items.keepsake].find(b => b.id === i.item_id);
    return { ...i, item };
  });

  return (
    <div className="sticky top-24 space-y-6">
      {/* Preview Card */}
      <Card variant="glass" padding="lg" className="relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-amber-500" />
            Live Preview
          </h3>

          {/* Box Visual */}
          <div className="aspect-square rounded-xl bg-gradient-to-br from-amber-100 to-rose-100 dark:from-amber-900/30 dark:to-rose-900/30 flex items-center justify-center mb-4 relative overflow-hidden">
            {box?.image_url ? (
              <img src={box.image_url} alt={box.name} className="w-full h-full object-cover rounded-lg max-h-48" />
            ) : (
              <Box className="w-16 h-16 text-amber-300 dark:text-amber-600" />
            )}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900/50 to-transparent" />
          </div>

          {/* Items Stack */}
          {state.items.length > 0 && (
            <div className="space-y-1.5 mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 max-h-32 overflow-y-auto">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Inside the Box</h4>
              {selectedItems.slice(0, 5).map(({ item, quantity }) => (
                <div key={item?.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300 truncate">{item?.name}</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">×{quantity}</span>
                </div>
              ))}
              {selectedItems.length > 5 && (
                <p className="text-xs text-slate-500 text-center">+{selectedItems.length - 5} more items</p>
              )}
            </div>
          )}

          {/* Card Preview */}
          {state.card_message && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-900/30 dark:to-rose-900/30 border border-amber-200 dark:border-amber-800 mb-4">
              <p className="font-serif-luxury italic text-sm text-slate-800 dark:text-slate-200 text-center">"{state.card_message}"</p>
              {state.recipient_name && (
                <p className="text-right text-xs font-medium text-slate-600 dark:text-slate-400 mt-2">— {state.recipient_name}</p>
              )}
            </div>
          )}

          {/* Packaging Badge */}
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Package className="w-3 h-3" />
            <span>{packaging?.name || 'Standard packaging'}</span>
          </div>
        </div>
      </Card>

      {/* Price Summary */}
      <Card variant="elevated" padding="lg">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
            <span className="font-semibold">{formatCurrency(totals.boxPrice + totals.itemsPrice + totals.cardPrice + totals.packagingPrice)}</span>
          </div>
          <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
            <span>Customization Fee</span>
            <span className="font-semibold">+{formatCurrency(totals.customizationFee)}</span>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>

          <div className="pt-4 space-y-2">
            <Button className="w-full" size="lg" onClick={onAddToCart} rightIcon={<ShoppingBag className="w-4 h-4" />}>
              Add to Cart ({formatCurrency(totals.total)})
            </Button>
            <Link href="/cart">
              <Button variant="outline" className="w-full">
                View Cart
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <TrustBadge icon={Truck} text="Express Delivery" desc="Nationwide shipping" />
            <TrustBadge icon={Shield} text="Secure Checkout" desc="SSL encrypted payments" />
            <TrustBadge icon={Ribbon} text="Premium Wrapping" desc="Satin ribbon included" />
            <TrustBadge icon={Truck} text="Easy Returns" desc="7-day return policy" />
          </div>
        </div>
      </Card>
    </div>
  );
}

function TrustBadge({ icon: Icon, text, desc }: { icon: React.ComponentType<{ className?: string }>; text: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
      <Icon className="w-5 h-5 text-amber-500" />
      <div>
        <p className="font-semibold text-sm text-slate-900 dark:text-white">{text}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
      </div>
    </div>
  );
}