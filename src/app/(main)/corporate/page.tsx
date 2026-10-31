'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Briefcase, Building2, Gift, CheckCircle2, ShieldCheck, Truck, Sparkles, Send, Award, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

export default function CorporateGiftingPage() {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    quantity: 50,
    budget_range: '₹3,000 - ₹5,000 per hamper',
    occasion: 'Festive / Diwali Gifting',
    delivery_locations: 'Pan-India Multi-Location Direct to Employees/Clients',
    customization_requirements: '',
    expected_delivery_date: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim() || !formData.contact_person.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/corporate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmittedReference(data.reference_code);
        toast.success(data.message || 'Inquiry received!');
      } else {
        toast.error(data.error || 'Failed to submit inquiry');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-950 text-white py-16 lg:py-24 border-b border-amber-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_50%)]" />
        <div className="container-custom relative px-4 text-center max-w-4xl mx-auto">
          <Badge variant="amber" className="mb-4 text-xs tracking-wider uppercase px-3 py-1 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Enterprise & VIP Client Gifting
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif mb-6">
            Bespoke Corporate Gift Hampers
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Elevate business relationships, celebrate company milestones, and thank valuable clients with handcrafted luxury hampers customized with your brand identity.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs sm:text-sm text-slate-300">
            <span className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700">
              <CheckCircle2 className="w-4 h-4 text-amber-400" /> Custom Logo Embossing
            </span>
            <span className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700">
              <Truck className="w-4 h-4 text-amber-400" /> Individual Multi-Address Shipping
            </span>
            <span className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700">
              <Award className="w-4 h-4 text-amber-400" /> Dedicated Account Concierge
            </span>
          </div>
        </div>
      </section>

      {/* Volume Tiers & Perks */}
      <section className="py-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container-custom px-4">
          <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-8">
            Volume Tiered Pricing & Exclusive Corporate Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card variant="glass" padding="md" className="border-slate-200 dark:border-slate-800 text-center">
              <Badge variant="outline" className="mb-3">Tier 1: 25 - 99 Hampers</Badge>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">10% Corporate Privilege</h3>
              <p className="text-xs text-slate-500 mt-2">Includes custom printed logo cards & satin ribbon styling in corporate brand colors.</p>
            </Card>

            <Card variant="elevated" padding="md" className="border-amber-500/50 relative text-center bg-gradient-to-b from-amber-500/5 to-transparent">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-bold text-[10px] tracking-wider uppercase px-3 py-0.5 rounded-full">
                Most Popular
              </div>
              <Badge variant="amber" className="mb-3">Tier 2: 100 - 249 Hampers</Badge>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">15% Volume Privilege</h3>
              <p className="text-xs text-slate-500 mt-2">Includes foil-stamped luxury boxes, bespoke item swaps, and nationwide individual doorstep delivery.</p>
            </Card>

            <Card variant="glass" padding="md" className="border-slate-200 dark:border-slate-800 text-center">
              <Badge variant="outline" className="mb-3">Tier 3: 250+ Hampers</Badge>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">20% Custom VIP Contract</h3>
              <p className="text-xs text-slate-500 mt-2">Fully bespoke hamper engineering, imported specialty delicacies, and dedicated logistics manager.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Inquiry Form Section */}
      <section className="py-16 px-4">
        <div className="container-custom max-w-3xl mx-auto">
          {submittedReference ? (
            <Card variant="elevated" padding="lg" className="text-center py-12 px-6 border-emerald-500/30 bg-emerald-500/5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Corporate Inquiry Received!</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm max-w-lg mx-auto mb-4">
                Your corporate proposal request has been logged under reference code:
              </p>
              <div className="inline-block px-4 py-2 bg-slate-900 text-amber-400 font-mono font-bold text-lg rounded-xl mb-6">
                {submittedReference}
              </div>
              <p className="text-xs text-slate-500 mb-8 max-w-md mx-auto">
                A KawaiOra Corporate Gifting Specialist will review your request and send a tailored digital quotation and product catalog within 4 business hours.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => setSubmittedReference(null)}>
                  Submit Another Inquiry
                </Button>
                <Link href="/shop">
                  <Button variant="primary">Browse Retail Collection</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card variant="elevated" padding="lg" className="border-slate-200 dark:border-slate-800">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-amber-600" />
                  Request a Custom Corporate Quotation
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Fill in your requirements below and receive customized sample proposals and tiered volume pricing.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Organization *</label>
                    <input
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="e.g. Apex Global Solutions"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Person Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="e.g. Rajesh Khurana (HR / Procurement)"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Business Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. rajesh@apexsolutions.com"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Estimated Quantity *</label>
                    <input
                      type="number"
                      min={5}
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 5 })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Budget per Hamper</label>
                    <select
                      value={formData.budget_range}
                      onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="₹1,500 - ₹3,000">₹1,500 - ₹3,000</option>
                      <option value="₹3,000 - ₹5,000 per hamper">₹3,000 - ₹5,000</option>
                      <option value="₹5,000 - ₹10,000">₹5,000 - ₹10,000</option>
                      <option value="₹10,000+ Luxury VIP">₹10,000+ Luxury VIP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Occasion / Theme</label>
                    <select
                      value={formData.occasion}
                      onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Festive / Diwali Gifting">Diwali / Festive Gifting</option>
                      <option value="New Year & Year-End">New Year & Holidays</option>
                      <option value="Employee Appreciation & Onboarding">Employee Milestone / Onboarding</option>
                      <option value="Executive Client VIP Gifts">Executive Client VIP Gifts</option>
                      <option value="Conference & Annual Summit">Annual Summit / Event</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Delivery Distribution Model</label>
                  <select
                    value={formData.delivery_locations}
                    onChange={(e) => setFormData({ ...formData, delivery_locations: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Single Bulk Drop at Company HQ">Single Bulk Delivery at Company HQ / Warehouse</option>
                    <option value="Pan-India Multi-Location Direct to Employees/Clients">Individual Direct-to-Doorstep Pan-India Multi-Delivery</option>
                    <option value="Multi-Office Regional Distribution">Multi-Branch Regional Office Distribution</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Branding & Customization Requirements (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.customization_requirements}
                    onChange={(e) => setFormData({ ...formData, customization_requirements: e.target.value })}
                    placeholder="e.g. Include company logo on box lid, custom branded greeting card, specific gourmet items, dietary preferences (100% vegetarian, sugar-free, etc.)."
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center font-bold shadow-lg shadow-amber-500/25 py-3.5 rounded-xl text-base"
                    isLoading={submitting}
                    leftIcon={<Send className="w-5 h-5" />}
                  >
                    Submit Corporate Inquiry
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
