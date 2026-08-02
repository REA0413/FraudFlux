import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { useAuth } from './context/AuthContext';

export default function Dashboard({ transactions = [] }) {
  const { user } = useAuth();
  
  const [days, setDays] = useState(30);
  const [downloading, setDownloading] = useState(false);

  const hasData = transactions.length > 0;

  // 1. Format Bar Chart Data (Transaction Volume)
  const chartData = transactions.map(tx => ({
    name: tx.transaction_id,
    amount: tx.amount
  }));

  // 2. Calculate Dynamic Pie Chart Data from Live Database Records
  const totalCount = transactions.length;
  const approvedCount = transactions.filter(
    (tx) => tx.decision && tx.decision.toUpperCase() === 'APPROVE'
  ).length;
  const declinedCount = transactions.filter(
    (tx) => tx.decision && tx.decision.toUpperCase() === 'DECLINE'
  ).length;

  const pieData = [
    { name: 'Approved', value: approvedCount, color: '#10B981' }, // Emerald Green
    { name: 'Declined', value: declinedCount, color: '#EF4444' }  // Crimson Red
  ];

  // CSV Export Handler
  const handleExportCSV = async () => {
    if (!user?.id) {
      alert("Merchant session not found. Please sign in again.");
      return;
    }

    setDownloading(true);

    try {
      const response = await fetch(
        `https://fraudflux.onrender.com/v1/transactions/export?merchant_id=${user.id}&days=${days}`
      );

      if (!response.ok) throw new Error('Failed to generate export report.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fraudflux_report_${days}d.csv`;

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
        
        {/* Section 1: Fraud Overview Header & Top KPIs */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Fraud</h1>

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
                disabled={downloading || !hasData}
                className="text-[#6750A4] text-sm font-medium flex items-center hover:underline disabled:opacity-40 disabled:no-underline"
              >
                {downloading ? 'Downloading...' : 'Download report overview (CSV)'}
              </button>
            </div>
          </div>

          {/* Historical Network Benchmarks (Static) */}
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
          
          {/* Dynamic Bar Chart: Transaction Volume by ID */}
          <div className="border border-gray-100 rounded-lg p-6 h-72 bg-white shadow-sm mb-8 relative">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Transaction Volume by ID</h3>
            
            {hasData ? (
              <ResponsiveContainer width="100%" height="85%">
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
            ) : (
              <div className="h-52 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                <div className="text-3xl mb-2">📊</div>
                <h4 className="text-sm font-semibold text-gray-800">No Processed Transaction Yet</h4>
                <p className="text-xs text-gray-500 max-w-sm mt-1">
                  Once your store starts processing transactions, dynamic order volume charts will populate here automatically.
                </p>
              </div>
            )}
          </div>

          {/* Dynamic Decision Status Pie Chart & Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border border-gray-100 rounded-xl p-6 bg-gray-50/50 shadow-sm">
            
            {/* Pie Chart Column (Spans 2 columns) */}
            <div className="md:col-span-2 h-64 flex flex-col justify-center">
              <h3 className="text-sm font-bold text-gray-800 mb-1">Live Decision Status Breakdown</h3>
              <p className="text-xs text-gray-500 mb-4">Real-time ratio of approved vs. declined transactions recorded in your database.</p>
              
              {hasData ? (
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} Transactions`, 'Count']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 bg-white rounded-lg border border-dashed border-gray-200 text-center">
                  <div className="text-2xl mb-1">🛡️</div>
                  <p className="text-xs font-semibold text-gray-700">0 Transactions Recorded</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs">
                    Test your fraud scoring pipeline using the <strong>Checkout Simulator</strong> menu.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Stat Summary Cards Column */}
            <div className="space-y-3 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
              <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-xs text-gray-500 block">Total Recorded</span>
                <span className="text-xl font-extrabold text-gray-900">{totalCount} Transactions</span>
              </div>

              <div className="bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-200 shadow-sm">
                <span className="text-xs text-emerald-700 block font-semibold">Approved Count</span>
                <span className="text-xl font-extrabold text-emerald-700">
                  {approvedCount} <span className="text-xs font-normal">({totalCount > 0 ? ((approvedCount / totalCount) * 100).toFixed(0) : 0}%)</span>
                </span>
              </div>

              <div className="bg-red-50/60 p-3.5 rounded-lg border border-red-200 shadow-sm">
                <span className="text-xs text-red-700 block font-semibold">Declined Count</span>
                <span className="text-xl font-extrabold text-red-700">
                  {declinedCount} <span className="text-xs font-normal">({totalCount > 0 ? ((declinedCount / totalCount) * 100).toFixed(0) : 0}%)</span>
                </span>
              </div>
            </div>

          </div>
        </section>

        <hr className="border-gray-200" />

        {/* Section 2: Fraud Prevention Overview */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold">Fraud Prevention</h2>
            <p className="text-sm text-gray-600 mt-1">
              Understand trends in the volume of transactions blocked by the system.
            </p>
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