import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';

export default function MerchantSettings() {
  const { user } = useAuth();
  const [threshold, setThreshold] = useState(85);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Load current threshold from Supabase / Backend on load
  useEffect(() => {
    const fetchThreshold = async () => {
      try {
        const res = await fetch(`https://fraudflux.onrender.com/api/v1/settings/thresholds/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.auto_decline_threshold) {
            setThreshold(data.auto_decline_threshold);
          }
        }
      } catch (err) {
        console.error("Failed to load merchant settings:", err);
      }
    };

    if (user?.id) {
      fetchThreshold();
    }
  }, [user]);

  // Unified Save Handler (Runs ONLY on "Save Settings" click)
  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('https://fraudflux.onrender.com/api/v1/settings/thresholds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: user.id,
          auto_decline_threshold: Number(threshold)
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Threshold updated successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update threshold.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Backend server unavailable.' });
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (val) => {
    setThreshold(val);
    setMessage(null); // Clear previous alert so user knows changes are staged
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">
        Fraud Risk Thresholds
      </h2>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        Configure the risk sensitivity for automatic transaction declines.
      </p>

      {message && (
        <div className={`p-3 rounded mb-4 text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Preset Strategy Buttons */}
      <div className="mb-6">
        <label className="block font-semibold mb-2 text-slate-700 dark:text-slate-200">
          Quick Presets
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => selectPreset(70)}
            className={`p-3 border rounded-lg text-left transition ${
              threshold === 70 ? 'border-purple-600 bg-purple-50 dark:bg-slate-700' : 'border-slate-300'
            }`}
          >
            <div className="font-bold text-sm">Maximise Protection</div>
            <div className="text-xs text-slate-500">Threshold: 70%</div>
          </button>

          <button
            onClick={() => selectPreset(85)}
            className={`p-3 border rounded-lg text-left transition ${
              threshold === 85 ? 'border-purple-600 bg-purple-50 dark:bg-slate-700' : 'border-slate-300'
            }`}
          >
            <div className="font-bold text-sm">Balanced</div>
            <div className="text-xs text-slate-500">Threshold: 85% (Default)</div>
          </button>

          <button
            onClick={() => selectPreset(95)}
            className={`p-3 border rounded-lg text-left transition ${
              threshold === 95 ? 'border-purple-600 bg-purple-50 dark:bg-slate-700' : 'border-slate-300'
            }`}
          >
            <div className="font-bold text-sm">Maximise Revenue</div>
            <div className="text-xs text-slate-500">Threshold: 95%</div>
          </button>
        </div>
      </div>

      {/* Custom Slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="font-semibold text-slate-700 dark:text-slate-200">
            Custom Threshold Slider
          </label>
          <span className="text-lg font-bold text-purple-600">{threshold}%</span>
        </div>
        <input
          type="range"
          min="1"
          max="99"
          value={threshold}
          onChange={(e) => {
            setThreshold(Number(e.target.value));
            setMessage(null);
          }}
          className="w-full accent-purple-600 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>1% (Strict)</span>
          <span>99% (Permissive)</span>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition disabled:opacity-50"
      >
        {loading ? 'Saving Changes...' : 'Save Settings'}
      </button>
    </div>
  );
}