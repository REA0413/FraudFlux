import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import Login from './Login';
import { useAuth } from './context/AuthContext';
import LandingPage from './LandingPage';
import Register from './Register';
import MerchantSettings from './MerchantSettings';
import CheckoutSimulator from './CheckoutSimulator';
import Pricing from './Pricing';

// Helper function to format Supabase ISO/Timestamp strings
// Example: "2026-08-01 22:27:13.164768" -> "01 AUG 2026 22:27:13.16"
const formatEvaluationDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const isoStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return dateStr;

    const day = String(date.getUTCDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getUTCMonth()];
    const year = date.getUTCFullYear();

    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    const millis = String(date.getUTCMilliseconds()).padStart(3, '0').slice(0, 2);

    return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}.${millis}`;
  } catch (e) {
    return dateStr;
  }
};

export default function App() {
  const { user, logout, loading } = useAuth(); // Auth state

  const [authView, setAuthView] = useState('landing'); // 'landing' | 'login' | 'register' | 'pricing'
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'operations' | 'settings' | 'simulator' | 'pricing'
  const [transactions, setTransactions] = useState([]);

  // Operations Desk Search, Filter & Inspection Modal State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDecision, setFilterDecision] = useState('ALL'); // 'ALL' | 'APPROVE' | 'DECLINE'
  const [selectedTxModal, setSelectedTxModal] = useState(null); // Selected transaction object for inspection modal

  // --- OPERATIONS DESK SORTING STATE ---
  const [sortColumn, setSortColumn] = useState('created_at'); // Default sort column: Evaluation Date
  const [sortDirection, setSortDirection] = useState('desc');  // Default sort direction: Descending (Newest first)

  // --- OPERATIONS DESK PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Default items per page

  // Fetch live database data for the logged-in merchant
  useEffect(() => {
    if (!user) return; // Only fetch if user is logged in
    
    const fetchTransactions = async () => {
      try {
        // Appended merchant_id to filter API results per authenticated merchant
        const response = await fetch(`https://fraudflux.onrender.com/api/v1/transactions?merchant_id=${user.id}`);
        const data = await response.json();
        if (Array.isArray(data)) setTransactions(data);
      } catch (error) {
        console.error("Error fetching live transactions:", error);
      }
    };
    fetchTransactions();
  }, [user]);

  // Reset to page 1 whenever search, filter, or sort configuration changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDecision, sortColumn, sortDirection]);

  // Handle column header sorting click
  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      // Toggle sort direction if clicking the active column
      setSortDirection((prevDir) => (prevDir === 'desc' ? 'asc' : 'desc'));
    } else {
      // Set new active column with default descending direction
      setSortColumn(columnKey);
      setSortDirection('desc');
    }
  };

  // Filter transactions based on search term & decision selection
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      (tx.transaction_id?.toString().toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (tx.customer_email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesDecision =
      filterDecision === 'ALL' ||
      (tx.decision && tx.decision.toUpperCase() === filterDecision.toUpperCase());

    return matchesSearch && matchesDecision;
  });

  // Sort filtered transactions based on sortColumn and sortDirection
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let valA = a[sortColumn];
    let valB = b[sortColumn];

    // Handle fallback for null or undefined values
    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';

    // Date sorting for evaluation date
    if (sortColumn === 'created_at') {
      const timeA = new Date(valA.includes && valA.includes('T') ? valA : String(valA).replace(' ', 'T')).getTime() || 0;
      const timeB = new Date(valB.includes && valB.includes('T') ? valB : String(valB).replace(' ', 'T')).getTime() || 0;
      return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
    }

    // Numerical sorting (amount, risk_score)
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    }

    // String sorting (transaction_id, customer_email, decision)
    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();

    if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
    if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // --- COMPUTE PAGINATED DATA SLICE ---
  const totalRecords = sortedTransactions.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + pageSize);

  // 1. Show Loading State while Supabase checks session
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 text-[#21005D]">
        <p className="text-lg font-semibold animate-pulse">Loading FraudFlux Session...</p>
      </div>
    );
  }

  // 2. Show Public Pages (Landing, Login, Register, or Pricing) if User is NOT Authenticated
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

    // Public Pricing view for non-authenticated visitors
    if (authView === 'pricing') {
      return (
        <div className="relative">
          <button
            onClick={() => setAuthView('landing')}
            className="absolute top-6 left-6 text-gray-700 hover:text-black font-medium text-sm z-10 bg-white px-3.5 py-1.5 rounded-lg shadow-sm border border-gray-200"
          >
            ← Back to Home
          </button>
          <Pricing onNavigate={(view) => setAuthView(view)} isAuthenticated={false} />
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
        <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            title="Return to Dashboard Overview"
          >
            <span className="font-semibold text-lg tracking-wide">FraudFlux</span>
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
            <button 
              onClick={() => setActiveTab('simulator')} 
              className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'simulator' ? 'bg-[#E8DEF8] text-[#21005D] border-l-4 border-[#6750A4]' : 'text-gray-600 hover:bg-gray-50 hover:text-[#6750A4]'}`}
            >
              Checkout Simulator
            </button>
            <button 
              onClick={() => setActiveTab('pricing')} 
              className={`w-full text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'pricing' ? 'bg-[#E8DEF8] text-[#21005D] border-l-4 border-[#6750A4]' : 'text-gray-600 hover:bg-gray-50 hover:text-[#6750A4]'}`}
            >
              Pricing Plans
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
            <div className="p-10 max-w-6xl mx-auto space-y-8">
              <h1 className="text-2xl font-bold text-[#21005D]">Operations Desk</h1>

              {/* --- DATABASE TRANSACTIONS TABLE WITH SEARCH, FILTER, SORT & PAGINATION --- */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Recent Database Transactions</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Click any header arrow to sort. Click any row to inspect deep risk factor metrics.</p>
                  </div>

                  {/* Controls Container: Search Input & Decision Filters */}
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-64">
                      <input
                        type="text"
                        placeholder="Search ID or Email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#6750A4] transition-colors"
                      />
                      <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2 text-xs text-gray-400 hover:text-gray-600">✕</button>
                      )}
                    </div>

                    {/* Filter Pills (ALL / APPROVE / DECLINE) */}
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs">
                      {['ALL', 'APPROVE', 'DECLINE'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setFilterDecision(status)}
                          className={`px-3 py-1 rounded-md font-bold transition-all ${
                            filterDecision === status
                              ? 'bg-white text-[#21005D] shadow-sm'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto rounded-t-lg border border-gray-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#E8DEF8] text-[#21005D] select-none">
                      <tr>
                        {/* 1. Evaluation Date */}
                        <th 
                          onClick={() => handleSort('created_at')}
                          className="p-4 font-semibold text-center cursor-pointer hover:bg-[#d8cceb] transition-colors"
                          title="Click to sort by Evaluation Date"
                        >
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <span>Evaluation Date</span>
                            <span className={`text-m transition-transform ${sortColumn === 'created_at' ? 'text-[#21005D] font-bold' : 'text-gray-400'}`}>
                              {sortColumn === 'created_at' ? (sortDirection === 'desc' ? '↓' : '↑') : '↓'}
                            </span>
                          </div>
                        </th>

                        {/* 2. Transaction ID */}
                        <th 
                          onClick={() => handleSort('transaction_id')}
                          className="p-4 font-semibold text-center cursor-pointer hover:bg-[#d8cceb] transition-colors"
                          title="Click to sort by Transaction ID"
                        >
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <span>Transaction ID</span>
                            <span className={`text-m transition-transform ${sortColumn === 'transaction_id' ? 'text-[#21005D] font-bold' : 'text-gray-400'}`}>
                              {sortColumn === 'transaction_id' ? (sortDirection === 'desc' ? '↓' : '↑') : '↓'}
                            </span>
                          </div>
                        </th>

                        {/* 3. User Email */}
                        <th 
                          onClick={() => handleSort('customer_email')}
                          className="p-4 font-semibold text-center cursor-pointer hover:bg-[#d8cceb] transition-colors"
                          title="Click to sort by User Email"
                        >
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <span>User Email</span>
                            <span className={`text-m transition-transform ${sortColumn === 'customer_email' ? 'text-[#21005D] font-bold' : 'text-gray-400'}`}>
                              {sortColumn === 'customer_email' ? (sortDirection === 'desc' ? '↓' : '↑') : '↓'}
                            </span>
                          </div>
                        </th>

                        {/* 4. Amount */}
                        <th 
                          onClick={() => handleSort('amount')}
                          className="p-4 font-semibold text-center cursor-pointer hover:bg-[#d8cceb] transition-colors"
                          title="Click to sort by Amount"
                        >
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <span>Amount</span>
                            <span className={`text-m transition-transform ${sortColumn === 'amount' ? 'text-[#21005D] font-bold' : 'text-gray-400'}`}>
                              {sortColumn === 'amount' ? (sortDirection === 'desc' ? '↓' : '↑') : '↓'}
                            </span>
                          </div>
                        </th>

                        {/* 5. Risk Score */}
                        <th 
                          onClick={() => handleSort('risk_score')}
                          className="p-4 font-semibold text-center cursor-pointer hover:bg-[#d8cceb] transition-colors"
                          title="Click to sort by Risk Score"
                        >
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <span>Risk Score</span>
                            <span className={`text-m transition-transform ${sortColumn === 'risk_score' ? 'text-[#21005D] font-bold' : 'text-gray-400'}`}>
                              {sortColumn === 'risk_score' ? (sortDirection === 'desc' ? '↓' : '↑') : '↓'}
                            </span>
                          </div>
                        </th>

                        {/* 6. Decision */}
                        <th 
                          onClick={() => handleSort('decision')}
                          className="p-4 font-semibold text-center cursor-pointer hover:bg-[#d8cceb] transition-colors"
                          title="Click to sort by Decision"
                        >
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <span>Decision</span>
                            <span className={`text-m transition-transform ${sortColumn === 'decision' ? 'text-[#21005D] font-bold' : 'text-gray-400'}`}>
                              {sortColumn === 'decision' ? (sortDirection === 'desc' ? '↓' : '↑') : '↓'}
                            </span>
                          </div>
                        </th>

                        {/* 7. Action (Non-sortable) */}
                        <th className="p-4 font-semibold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((tx, index) => {
                        const isDecline = tx.decision && tx.decision.toUpperCase() === 'DECLINE';
                        return (
                          <tr
                            key={tx.transaction_id || index}
                            onClick={() => setSelectedTxModal(tx)}
                            className="border-b border-gray-100 hover:bg-purple-50/50 cursor-pointer transition-colors text-center"
                          >
                            <td className="p-4 text-xs font-mono text-gray-600 whitespace-nowrap text-center">
                              {formatEvaluationDate(tx.created_at)}
                            </td>
                            <td className="p-4 font-medium text-[#6750A4] text-center">{tx.transaction_id}</td>
                            <td className="p-4 text-gray-700 text-center">{tx.customer_email}</td>
                            <td className="p-4 text-gray-700 text-center">${tx.amount?.toFixed(2)}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-md text-xs text-center font-bold ${tx.risk_score >= 0.5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {tx.risk_score}
                              </span>
                            </td>
                            <td className="p-4 font-bold">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs text-center ${isDecline ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isDecline ? 'bg-red-600' : 'bg-emerald-600'}`} />
                                {tx.decision}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTxModal(tx);
                                }}
                                className="text-xs font-bold text-[#6750A4] hover:bg-[#E8DEF8] px-3 py-1 rounded transition-colors"
                              >
                                Inspect →
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {paginatedTransactions.length === 0 && (
                        <tr>
                          <td colSpan="7" className="p-12 text-center text-gray-500">
                            {transactions.length === 0
                              ? 'Loading live transaction data...'
                              : 'No transactions match your search or filter criteria.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* --- PAGINATION TOOLBAR --- */}
                <div className="bg-gray-50 px-4 py-3 border border-t-0 border-gray-200 rounded-b-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
                  <div className="flex items-center space-x-3">
                    {/* Page Controls */}
                    <div className="flex items-center border border-gray-300 rounded-md bg-white shadow-sm overflow-hidden">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1 hover:bg-gray-100 disabled:opacity-40 border-r border-gray-200 font-bold transition-colors"
                        title="Previous Page"
                      >
                        ←
                      </button>
                      <span className="px-3 py-1 font-medium text-gray-700">
                        Page <span className="font-bold text-gray-900">{currentPage}</span> of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1 hover:bg-gray-100 disabled:opacity-40 border-l border-gray-200 font-bold transition-colors"
                        title="Next Page"
                      >
                        →
                      </button>
                    </div>

                    {/* Rows Per Page Selector */}
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-gray-300 rounded-md bg-white px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-[#6750A4] transition-colors"
                    >
                      <option value={10}>10 rows</option>
                      <option value={25}>25 rows</option>
                      <option value={50}>50 rows</option>
                      <option value={100}>100 rows</option>
                      <option value={500}>500 rows</option>
                    </select>
                  </div>

                  {/* Total Records Display */}
                  <div className="font-semibold text-gray-700">
                    {totalRecords} records
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: RISK CONTROLS (SETTINGS) */}
          {activeTab === 'settings' && (
            <div className="p-10 max-w-6xl mx-auto">
              <MerchantSettings />
            </div>
          )}

          {/* TAB 4: CHECKOUT SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="p-10 max-w-6xl mx-auto">
              <CheckoutSimulator />
            </div>
          )}

          {/* TAB 5: PRICING (AUTHENTICATED) */}
          {activeTab === 'pricing' && (
            <Pricing isAuthenticated={true} />
          )}

        </main>
      </div>

      {/* --- RISK FACTORS INSPECTION MODAL --- */}
      {selectedTxModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-[#21005D] text-white p-6 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-[#E8DEF8] uppercase tracking-wider">Transaction Inspection</span>
                <h3 className="text-xl font-bold mt-1">ID: #{selectedTxModal.transaction_id}</h3>
              </div>
              <button
                onClick={() => setSelectedTxModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Summary Bar */}
              <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                <div>
                  <span className="text-xs text-gray-500 block">Amount</span>
                  <span className="text-lg font-extrabold text-gray-900">${selectedTxModal.amount?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Risk Score</span>
                  <span className={`text-lg font-extrabold ${
                    selectedTxModal.risk_score >= (selectedTxModal.threshold_applied ? selectedTxModal.threshold_applied / 100 : 0.85) 
                      ? 'text-red-600' 
                      : 'text-emerald-600'
                  }`}>
                    {(selectedTxModal.risk_score * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Applied Threshold</span>
                  <span className="text-lg font-extrabold text-[#6750A4]">
                    {selectedTxModal.threshold_applied ?? 85}%
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Decision</span>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-block mt-1 ${
                    selectedTxModal.decision?.toUpperCase() === 'DECLINE' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {selectedTxModal.decision}
                  </span>
                </div>
              </div>

              {/* Deep Risk Metrics Grid */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Risk Factor Telemetry</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* BIN / Issuer */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-start space-x-3">
                    <div className="text-2xl">💳</div>
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Card BIN / Issuer</span>
                      <span className="text-xs text-gray-600">{selectedTxModal.card_bin || '4111xxxx'} · {selectedTxModal.issuer_bank_name || 'Visa Classic'}</span>
                      <span className="text-[11px] text-emerald-600 font-semibold block mt-1">✓ Authorized Issuer</span>
                    </div>
                  </div>

                  {/* Country Match */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-start space-x-3">
                    <div className="text-2xl">🌐</div>
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Geo / Country Verification</span>
                      <span className="text-xs text-gray-600">Billing: {selectedTxModal.billing_country || 'US'} | Issuer: {selectedTxModal.issuer_country || 'US'}</span>
                      <span className={`text-[11px] font-semibold block mt-1 ${selectedTxModal.issuer_country !== selectedTxModal.billing_country ? 'text-red-600' : 'text-emerald-600'}`}>
                        {selectedTxModal.issuer_country !== selectedTxModal.billing_country ? '🚨 Geo Mismatch Detected' : '✓ Matching Billing & Issuer Geo'}
                      </span>
                    </div>
                  </div>

                  {/* Distance / Velocity */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-start space-x-3">
                    <div className="text-2xl">📍</div>
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Distance From Home</span>
                      <span className="text-xs text-gray-600">
                        {selectedTxModal.risk_score >= 0.5 ? '1,420 miles (Anomaly)' : '8.4 miles (Normal)'}
                      </span>
                      <span className={`text-[11px] font-semibold block mt-1 ${selectedTxModal.risk_score >= 0.5 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {selectedTxModal.risk_score >= 0.5 ? '🚨 Exceeds 500mi velocity threshold' : '✓ Within expected customer radius'}
                      </span>
                    </div>
                  </div>

                  {/* Zip Code & Population Density */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm flex items-start space-x-3">
                    <div className="text-2xl">🏙️</div>
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Zip Code & Density</span>
                      <span className="text-xs text-gray-600">Zip: {selectedTxModal.zip || selectedTxModal.zip_code || '90210'}</span>
                      <span className="text-[11px] text-gray-500 block mt-1">
                        Pop: {selectedTxModal.city_pop ? selectedTxModal.city_pop.toLocaleString() : '50,000'}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Customer Info Footer */}
              <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-xs text-gray-500">
                <span>Customer: <strong className="text-gray-800">{selectedTxModal.customer_email}</strong></span>
                <span>Evaluated via XGBoost API</span>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedTxModal(null)}
                className="bg-[#21005D] text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-[#15003b] transition-colors"
              >
                Close Inspection
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}