import React from 'react';

export default function LandingPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-[#1a103c] text-white flex flex-col font-sans">
      
      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10 max-w-7xl mx-auto w-full">
        <div 
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => onNavigate('landing')}
        >
          <span className="text-xl font-bold tracking-tight">FraudFlux</span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Pricing Link */}
          <button
            onClick={() => onNavigate('pricing')}
            className="text-sm font-medium text-gray-300 hover:text-white px-3 py-2 transition-colors"
          >
            Pricing
          </button>
          
          <button
            onClick={() => onNavigate('login')}
            className="text-sm font-medium text-gray-300 hover:text-white px-3 py-2 transition-colors"
          >
            Sign In
          </button>

          <button
            onClick={() => onNavigate('register')}
            className="text-sm font-medium bg-[#6750A4] hover:bg-[#533f85] text-white px-5 py-2.5 rounded-lg shadow-lg transition-all"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto my-12">
        <span className="text-xs uppercase tracking-widest bg-[#6750A4]/30 text-[#e0d7f5] px-4 py-1.5 rounded-full font-semibold mb-6 border border-[#6750A4]/40">
          AI-Powered Risk Intelligence
        </span>
        
        <h1 className="text-4xl text-gray-200 sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          Real-Time Transaction<br/>Fraud Detection
        </h1>

        <p className="text-lg text-gray-300 mb-10 max-w-2xl leading-relaxed">
          FraudFlux leverages Machine Learning and real-time database streaming to identify high-risk payments, mitigate financial fraud, and empower operations analysis.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('login')}
            className="bg-[#6750A4] hover:bg-[#533f85] text-white font-medium px-8 py-3.5 rounded-xl text-base shadow-xl transition-all"
          >
            Access Operations Console
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left w-full">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
            <h3 className="font-bold text-lg mb-2 text-[#e0d7f5]">⚡ Instant ML Scoring</h3>
            <p className="text-sm text-gray-400">Evaluate transaction amounts, zip codes, and population density using automated XGBoost model.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
            <h3 className="font-bold text-lg mb-2 text-[#e0d7f5]">📊 Live Dashboard</h3>
            <p className="text-sm text-gray-400">Track key merchant transaction metrics, risk distributions, and live flag statuses effortlessly.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
            <h3 className="font-bold text-lg mb-2 text-[#e0d7f5]">🔒 Secure Data Handle</h3>
            <p className="text-sm text-gray-400">Enterprise-grade secure row-level security and authentication provided by Supabase.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/10 text-center text-xs text-gray-500">
        © 2026 FraudFlux Academic Project. Built with React, Fast API & Supabase.
      </footer>
    </div>
  );
}