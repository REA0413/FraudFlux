import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// Import useAuth to access authenticated merchant user session (Req 6)
import { useAuth } from './context/AuthContext';

// 1. Accept the transactions prop we just passed from App.jsx
export default function Dashboard({ transactions = [] }) {
  // Access logged-in user context
  const { user } = useAuth();
  
  // State for CSV export date filter and loading state (Req 6)
  const [days, setDays] = useState(30);
  const [downloading, setDownloading] = useState(false);

  // 2. Format the data slightly so Recharts can easily read it
  const chartData = transactions.map(tx => ({
    name: tx.transaction_id,
    amount: tx.amount
  }));

  // CSV Export Handler Function for Requirement 6
  const handleExportCSV = async () => {
    if (!user?.id) {
      alert("Merchant session not found. Please sign in again.");
      return;
    }

    setDownloading(true);

    try {
      // Fetch transaction CSV stream from FastAPI backend
      const response = await fetch(
        `http://localhost:8000/v1/transactions/export?merchant_id=${user.id}&days=${days}`
      );

      if (!response.ok) throw new Error('Failed to generate export report.');

      // Step 1: Convert response stream into a downloadable file Blob
      const blob = await response.blob();
      
      // Step 2: Create a temporary in-memory Object URL for browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fraudflux_report_${days}d.csv`;

      // Step 3: Programmatically click the link to trigger download and cleanup memory
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Error exporting CSV report.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-10 bg-white flex-1 overflow-y-auto text-gray-900 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Section 1: Fraud */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Fraud</h1>

            {/* CSV Export Date Selector and Download Button Controls (Req 6) */}
            <div className="flex items-center gap-3">
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="p-1.5 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#6750A4]"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
              </select>

              <button
                onClick={handleExportCSV}
                disabled={downloading}
                className="text-[#6750A4] text-sm font-medium flex items-center hover:underline disabled:opacity-50"
              >
                {downloading ? 'Downloading...' : 'Download report overview (CSV)'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 mb-6">
            <div>
              <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <span className="w-3 h-3 bg-blue-400 mr-2 rounded-sm"></span> Fraud disputes
              </div>
              <div className="text-[28px] font-semibold">0.06%</div>
            </div>
            <div>
              <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <span className="w-3 h-3 bg-[#E8DEF8] mr-2 rounded-sm"></span> Early fraud warnings
              </div>
              <div className="text-[28px] font-semibold">0.03%</div>
            </div>
            <div>
              <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <span className="w-3 h-3 bg-[#21005D] mr-2 rounded-sm"></span> Fraud rate
              </div>
              <div className="text-[28px] font-semibold">0.08%</div>
            </div>
          </div>
          
          {/* 3. The New Dynamic Chart! */}
          <div className="border border-gray-100 rounded-lg p-6 h-72 bg-white shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Transaction Volume by ID</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(value) => `$${value}`} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value) => [`$${value}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="#6750A4" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* Section 2: Fraud Prevention (Kept exactly as it was) */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold">Fraud prevention</h2>
            <p className="text-sm text-gray-600 mt-1">Understand trends in the volume of transactions blocked by the system. <a href="#" className="text-[#6750A4] hover:underline">Learn more</a></p>
          </div>

          <div className="grid grid-cols-4 gap-6 mb-8">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Attempted transactions</div>
              <div className="text-[28px] font-semibold">138,910</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Blocked</div>
              <div className="text-[28px] font-semibold">1,320</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Block rate</div>
              <div className="text-[28px] font-semibold">0.95%</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Volume blocked</div>
              <div className="text-[28px] font-semibold">€150,000</div>
            </div>
          </div>

          <table className="w-full text-left text-sm text-gray-700">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 font-semibold text-gray-900 w-1/4">Block Type</th>
                <th className="pb-3 font-semibold text-gray-900 w-1/6">Count</th>
                <th className="pb-3 font-semibold text-gray-900 w-1/6">Volume</th>
                <th className="pb-3 font-semibold text-gray-900 w-1/6">Block rate</th>
                <th className="pb-3 font-semibold text-gray-900 w-1/4">Est. false positive rate</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-4 font-medium text-[#6750A4]">Flux - High risk score</td>
                <td className="py-4">924</td>
                <td className="py-4">€90,000</td>
                <td className="py-4">0.67%</td>
                <td className="py-4">0.12%</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-4 font-medium text-[#6750A4]">Flux - Rules</td>
                <td className="py-4">396</td>
                <td className="py-4">€40,800</td>
                <td className="py-4">0.29%</td>
                <td className="py-4">1.94%</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}