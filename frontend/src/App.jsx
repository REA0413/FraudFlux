import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import Login from './Login'; // Import Login component
import { useAuth } from './context/AuthContext'; // Import useAuth hook
import LandingPage from './LandingPage';
import Register from './Register';
import MerchantSettings from './MerchantSettings';

export default function App() {
  const { user, logout, loading } = useAuth(); // Auth state

  const [authView, setAuthView] = useState('landing');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);

  // New State for the ML Sandbox
  const [mlData, setMlData] = useState({ amt: 1500, city_pop: 85000, zip: 10001 });
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // Fetch the live database data
  useEffect(() => {
    if (!user) return; // Only fetch if user is logged in
    
    const fetchTransactions = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/transactions');
        const data = await response.json();
        if (Array.isArray(data)) setTransactions(data);
      } catch (error) {
        console.error("Error fetching live transactions:", error);
      }
    };
    fetchTransactions();
  }, [user]);

  // Function to call the ML Model
  const handlePredict = async (e) => {
    e.preventDefault();
    setIsPredicting(true);
    setPredictionResult(null);

    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amt: parseFloat(mlData.amt),
          city_pop: parseInt(mlData.city_pop),
          zip: parseInt(mlData.zip)
        })
      });
      const data = await response.json();
      setPredictionResult(data.is_fraud);
    } catch (error) {
      console.error("Error asking AI for prediction:", error);
    } finally {
      setIsPredicting(false);
    }
  };

  // 1. Show Loading State while Supabase checks session
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 text-[#21005D]">
        <p className="text-lg font-semibold animate-pulse">Loading FraudFlux Session...</p>
      </div>
    );
  }

  // 2. Show Public Landing Page or Login Screen if User is NOT Authenticated
  if (!user) {
    if (authView === 'login') {
      return (
        <div className="relative">
          <button
            onClick={() => setAuthView('landing')}
            className="absolute top-6 left-6 text-white text-sm hover:underline z-10 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md"
          >
            ← Back to Home
          </button>
          <Login />
        </div>
      );
    }

    if (authView === 'register') {
      return (
        <div className="relative">
          <button
            onClick={() => setAuthView('landing')}
            className="absolute top-6 left-6 text-white text-sm hover:underline z-10 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md"
          >
            ← Back to Home
          </button>
          <Register onSwitchToLogin={() => setAuthView('login')} />
        </div>
      );
    }

    return <LandingPage onNavigate={(view) => setAuthView(view)} />;
  }

  // 3. Render Main Application if Authenticated
  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans">
      
      {/* Top Navigation Bar */}
      <header className="bg-[#21005D] text-white h-14 flex items-center justify-between px-6 shrink-0 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#E8DEF8] text-[#21005D] flex items-center justify-center font-bold text-sm">FF</div>
          <span className="font-semibold text-lg tracking-wide">Fraud Flux</span>
        </div>

        {/* User Info & Logout Button */}
        <div className="flex items-center space-x-4">
          <span className="text-xs bg-[#6750A4] px-3 py-1 rounded-full text-white font-medium">
            {user.email}
          </span>
          <button
            onClick={logout}
            className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 p-6 shrink-0 flex flex-col">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Menu</h2>
          <nav className="space-y-2 text-sm font-medium flex-1">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'dashboard' ? 'bg-[#E8DEF8] text-[#21005D] border-l-4 border-[#6750A4]' : 'text-gray-600 hover:bg-gray-50 hover:text-[#6750A4]'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('operations')} 
              className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'operations' ? 'bg-[#E8DEF8] text-[#21005D] border-l-4 border-[#6750A4]' : 'text-gray-600 hover:bg-gray-50 hover:text-[#6750A4]'}`}
            >
              Operations Desk
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'settings' ? 'bg-[#E8DEF8] text-[#21005D] border-l-4 border-[#6750A4]' : 'text-gray-600 hover:bg-gray-50 hover:text-[#6750A4]'}`}
            >
              Risk Controls
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">

          {/* TAB 1: OVERVIEW / DASHBOARD */}
          {activeTab === 'dashboard' && (
            <Dashboard transactions={transactions} />
          )}

          {/* TAB 2: OPERATIONS DESK */}
          {activeTab === 'operations' && (
            <div className="p-10 max-w-6xl mx-auto">
              <h1 className="text-2xl font-bold mb-6 text-[#21005D]">Operations Desk</h1>
              
              {/* --- ML PREDICTION SANDBOX --- */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Live ML Prediction Sandbox</h2>
                <form onSubmit={handlePredict} className="flex items-end space-x-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-medium text-gray-600">Amount ($)</label>
                    <input type="number" step="0.01" required className="border border-gray-300 rounded px-3 py-2 w-32 focus:outline-none focus:border-[#6750A4]" value={mlData.amt} onChange={(e) => setMlData({...mlData, amt: e.target.value})} />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-medium text-gray-600">City Population</label>
                    <input type="number" required className="border border-gray-300 rounded px-3 py-2 w-40 focus:outline-none focus:border-[#6750A4]" value={mlData.city_pop} onChange={(e) => setMlData({...mlData, city_pop: e.target.value})} />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-medium text-gray-600">Zip Code</label>
                    <input type="number" required className="border border-gray-300 rounded px-3 py-2 w-32 focus:outline-none focus:border-[#6750A4]" value={mlData.zip} onChange={(e) => setMlData({...mlData, zip: e.target.value})} />
                  </div>
                  <button type="submit" disabled={isPredicting} className="bg-[#6750A4] text-white px-5 py-2 rounded font-medium hover:bg-[#533f85] transition-colors disabled:opacity-50">
                    {isPredicting ? 'Analyzing...' : 'Test AI Model'}
                  </button>
                </form>

                {/* Display ML Result */}
                {predictionResult !== null && (
                  <div className={`mt-6 p-4 rounded-md border ${predictionResult === 1 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <h3 className={`font-bold text-lg ${predictionResult === 1 ? 'text-red-700' : 'text-green-700'}`}>
                      AI Decision: {predictionResult === 1 ? '🚨 FRAUD DETECTED (1)' : '✅ NORMAL TRANSACTION (0)'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Based on XGBoost model evaluation of amount, population, and zip code.</p>
                  </div>
                )}
              </div>

              {/* --- DATABASE TRANSACTIONS TABLE --- */}
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Database Transactions</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#E8DEF8] text-[#21005D]">
                    <tr>
                      <th className="p-4 font-semibold">Transaction ID</th>
                      <th className="p-4 font-semibold">User Email</th>
                      <th className="p-4 font-semibold">Amount</th>
                      <th className="p-4 font-semibold">Risk Score</th>
                      <th className="p-4 font-semibold">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, index) => (
                      <tr key={tx.transaction_id || index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4 font-medium text-[#6750A4]">{tx.transaction_id}</td>
                        <td className="p-4 text-gray-700">{tx.customer_email}</td>
                        <td className="p-4 text-gray-700">${tx.amount?.toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${tx.risk_score >= 0.5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {tx.risk_score}
                          </span>
                        </td>
                        <td className="p-4 text-gray-700 font-medium">{tx.decision}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-500">
                          Loading live data or no transactions found...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: RISK CONTROLS (SETTINGS) */}
          {activeTab === 'settings' && (
            <div className="p-10 max-w-6xl mx-auto">
              <MerchantSettings />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}