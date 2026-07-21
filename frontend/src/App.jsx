import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // 1. Create a state to hold our live database data
  const [transactions, setTransactions] = useState([]);

  // 2. Fetch the data from FastAPI when the app loads
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/transactions');
        const data = await response.json();
        
        // Ensure we only set the state if we got an array back
        if (Array.isArray(data)) {
          setTransactions(data);
        } else {
          console.error("Unexpected data format:", data);
        }
      } catch (error) {
        console.error("Error fetching live transactions:", error);
      }
    };

    fetchTransactions();
  }, []); // The empty array ensures this only runs once when the app starts

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans">
      
      {/* Top Navigation Bar */}
      <header className="bg-[#21005D] text-white h-14 flex items-center justify-between px-6 shrink-0 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#E8DEF8] text-[#21005D] flex items-center justify-center font-bold text-sm">
            FF
          </div>
          <span className="font-semibold text-lg tracking-wide">Fraud Flux</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 p-6 shrink-0 flex flex-col">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Menu</h2>
          <nav className="space-y-2 text-sm font-medium flex-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                activeTab === 'dashboard' 
                  ? 'bg-[#E8DEF8] text-[#21005D] border-l-4 border-[#6750A4]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#6750A4]'
              }`}
            >
              Overview (Figma UI)
            </button>
            <button 
              onClick={() => setActiveTab('operations')}
              className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                activeTab === 'operations' 
                  ? 'bg-[#E8DEF8] text-[#21005D] border-l-4 border-[#6750A4]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#6750A4]'
              }`}
            >
              Operations Desk
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' ? (
            <Dashboard transactions={transactions} />
          ) : (
            <div className="p-10">
              <h1 className="text-2xl font-bold mb-6 text-[#21005D]">Operations Desk</h1>
              <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
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
                    {/* 3. Map over the live data instead of mock data */}
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
        </main>
      </div>
    </div>
  );
}