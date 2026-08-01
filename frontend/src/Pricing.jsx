import React, { useState } from 'react';

export default function Pricing({ onNavigate, isAuthenticated = false }) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'

  const plans = [
    {
      name: 'Free',
      id: 'plan-free',
      priceMonthly: '$0',
      priceAnnual: '$0',
      period: 'forever',
      description: 'Ideal for small projects, testing, and sandbox integration.',
      highlight: false,
      badge: null,
      ctaText: 'Get Started Free',
      ctaStyle: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300',
      features: [
        'Up to 1,000 transactions / mo',
        'Standard rule-based risk evaluation',
        '< 100ms evaluation latency SLA',
        'Single merchant profile',
        '7-day transaction logs history',
        'Community support',
      ],
    },
    {
      name: 'Pro',
      id: 'plan-pro',
      priceMonthly: '$20',
      priceAnnual: '$15',
      period: '/ month',
      description: 'For growing e-commerce businesses needing real-time ML risk inference.',
      highlight: true,
      badge: 'MOST POPULAR',
      ctaText: 'Start 14-Day Free Trial',
      ctaStyle: 'bg-[#6750A4] hover:bg-[#533f85] text-white shadow-md',
      features: [
        'Up to 100,000 transactions / mo',
        'Real-time XGBoost ML Model scoring',
        'Sub-50ms latency SLA guarantee',
        'Dynamic auto-decline threshold tuning',
        'CSV & report export tools (30-day logs)',
        'Standard email & chat support',
      ],
    },
    {
      name: 'Lifetime',
      id: 'plan-lifetime',
      priceMonthly: '$200',
      priceAnnual: '$200',
      period: 'one-time pay',
      description: 'Pay once, protect forever. Unlimited access for scale-ups and founders.',
      highlight: false,
      badge: 'BEST VALUE',
      ctaText: 'Get Lifetime Access',
      ctaStyle: 'bg-[#21005D] hover:bg-[#15003b] text-white shadow-md',
      features: [
        'Unlimited monthly transactions',
        'Priority XGBoost ML Model execution',
        'Ultra-low latency infrastructure (<30ms SLA)',
        'Unlimited historical transaction logs',
        'Custom risk rule configuration',
        '24/7 Priority developer support',
        'All future ML model updates included',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <span className="text-xs font-bold text-[#6750A4] uppercase tracking-widest bg-[#E8DEF8] px-3 py-1 rounded-full">
          Transparent Pricing
        </span>
        <h1 className="text-4xl font-extrabold text-[#21005D] sm:text-5xl">
          Simple, Predictive Fraud Prevention
        </h1>
        <p className="text-base text-gray-600 max-w-2xl mx-auto">
          Scale your checkout without high chargeback fees.<br/>Protect your store using real-time ML risk scoring.
        </p>

        {/* Monthly / Annual Toggle */}
        <div className="pt-4 flex items-center justify-center space-x-3">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
            Monthly Billing
          </span>
          <button
            type="button"
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[#6750A4] transition-colors duration-200 ease-in-out focus:outline-none"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                billingCycle === 'annual' ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
            Annual Billing <span className="text-xs text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-full ml-1">Save 20%</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="max-w-7xl mx-auto mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6 items-stretch">
        {plans.map((plan) => {
          // Check if this card represents the logged-in user's active tier
          const isCurrentPlan = isAuthenticated && plan.id === 'plan-free';
          const buttonText = isCurrentPlan ? 'Your Current Plan' : plan.ctaText;
          const buttonStyle = isCurrentPlan
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold cursor-default'
            : plan.ctaStyle;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl bg-white p-8 shadow-sm flex flex-col justify-between border transition-all duration-200 ${
                plan.highlight
                  ? 'border-2 border-[#6750A4] shadow-xl scale-105 z-10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Top Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className={`text-[10px] font-black uppercase tracking-wider text-white px-3 py-1 rounded-full ${
                    plan.highlight ? 'bg-[#6750A4]' : 'bg-[#21005D]'
                  }`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div>
                {/* Card Header */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-[#21005D]">{plan.name}</h2>
                </div>
                <p className="text-xs text-gray-500 min-h-[36px] mb-6">{plan.description}</p>

                {/* Pricing Display */}
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly}
                  </span>
                  <span className="text-xs font-medium text-gray-500 ml-1">{plan.period}</span>
                </div>

                {/* Feature List */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-3 text-xs text-gray-600">
                      <svg
                        className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dynamic CTA Button */}
              <button
                type="button"
                disabled={isCurrentPlan}
                onClick={() => {
                  if (isCurrentPlan) return;
                  if (onNavigate) onNavigate('register');
                }}
                className={`w-full text-center text-xs font-bold py-3 px-4 rounded-lg transition-colors ${buttonStyle}`}
              >
                {buttonText}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust & FAQ Footer */}
      <div className="max-w-3xl mx-auto mt-16 text-center border-t border-gray-200 pt-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Need a custom enterprise integration?</h3>
        <p className="text-xs text-gray-500 mb-4">
          We offer dedicated VPC deployments, custom ML retrain schedules, and tailored enterprise SLAs.
        </p>
        <a href="mailto:support@fraudflux.io" className="text-xs font-bold text-[#6750A4] hover:underline">
          Contact Enterprise Sales →
        </a>
      </div>
    </div>
  );
}