import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext'; 

const SUPABASE_URL = 'https://ofdwlagawlawrfqbgbbq.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export default function CheckoutSimulator() {
  // Extract user and session token from AuthContext
  const auth = useAuth();
  const userEmail = auth?.user?.email || null;
  const userToken = auth?.session?.access_token || auth?.token || null;

  // Authenticated Merchant State
  const [merchantId, setMerchantId] = useState('');
  const [merchantName, setMerchantName] = useState('Fetching merchant profile...');

  // Customer Form State
  const [amount, setAmount] = useState('25.00');
  const [cardNumber, setCardNumber] = useState('4532 8901 2345 8892');
  const [expiryDate, setExpiryDate] = useState('12/28');
  const [cvv, setCvv] = useState('381');
  const [email, setEmail] = useState('john.doe@gmail.com');
  const [issuerCountry, setIssuerCountry] = useState('US');
  const [billingCountry, setBillingCountry] = useState('US');
  const [currency] = useState('USD');

  // Advanced ML Parameter States
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [zipCode, setZipCode] = useState('90210');
  const [cityPop, setCityPop] = useState('50000');

  // Evaluation State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [latency, setLatency] = useState(null);
  const [lastPayload, setLastPayload] = useState(null);
  const [error, setError] = useState(null);

  const MOCK_BIN_LOOKUP = {
    '453289': 'Chase Bank',       // Safe Customer setup
    '541299': 'Barclays Bank',    // Suspicious Fraud setup
  };

  useEffect(() => {
    const fetchMerchantProfile = async () => {
      // 1. Handle unauthenticated state
      if (!userEmail) {
        console.warn('CheckoutSimulator: No user email available from AuthContext.');
        setMerchantId('');
        setMerchantName('Unauthenticated User');
        return;
      }

      try {
        const headers = {
          'Content-Type': 'application/json',
          ...(SUPABASE_ANON_KEY ? { apikey: SUPABASE_ANON_KEY } : {}),
          ...(userToken ? { Authorization: `Bearer ${userToken}` } : {})
        };

        const url = `${SUPABASE_URL}/rest/v1/merchants?email=eq.${encodeURIComponent(userEmail)}&select=id,merchant_name`;
        
        console.log(`Fetching merchant profile for: "${userEmail}" (RLS Token Present: ${!!userToken})`);

        const response = await fetch(url, { headers });

        if (response.ok) {
          const data = await response.json();
          console.log('Supabase Merchant Lookup Response:', data);

          if (Array.isArray(data) && data.length > 0) {
            setMerchantId(data[0].id || '');
            setMerchantName(data[0].merchant_name || 'Unnamed Merchant');
            return;
          }

          setMerchantId('');
          setMerchantName(`No merchant record for ${userEmail}`);
        } else {
          console.error('Supabase HTTP Error:', response.status, response.statusText);
          setMerchantId('');
          setMerchantName('Failed to fetch merchant profile');
        }
      } catch (err) {
        console.error('Error fetching merchant profile:', err);
        setMerchantId('');
        setMerchantName('Error loading merchant');
      }
    };

    fetchMerchantProfile();
  }, [userEmail, userToken]);

  // Preset 1: Safe Customer Flow
  const handlePresetSafe = () => {
    setAmount('25.00');
    setCardNumber('4532 8901 2345 8892');
    setExpiryDate('12/28');
    setCvv('381');
    setEmail('john.doe@gmail.com');
    setIssuerCountry('US');
    setBillingCountry('US');
    setZipCode('90210');
    setCityPop('50000');
    setResult(null);
    setError(null);
  };

  // Preset 2: Suspicious Fraudster Flow
  const handlePresetFraud = () => {
    setAmount('1250.00');
    setCardNumber('5412 9918 2039 1049');
    setExpiryDate('04/26');
    setCvv('992');
    setEmail('bot9921@temp-mail.org');
    setIssuerCountry('NG');
    setBillingCountry('US');
    setZipCode('99999');
    setCityPop('1250');
    setResult(null);
    setError(null);
  };

  // Clear Form Inputs
  const handleClear = () => {
    setAmount('');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setEmail('');
    setIssuerCountry('');
    setBillingCountry('');
    setZipCode('90210');
    setCityPop('50000');
    setResult(null);
    setLastPayload(null);
    setLatency(null);
    setError(null);
  };

  // Submit Payment Request
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!merchantId) {
      setError('Cannot evaluate payment without a valid Merchant ID.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const cardBin = cardNumber.replace(/\D/g, '').slice(0, 6);
    const payload = {
      transaction_id: `tx_live_${Math.floor(Math.random() * 100000)}`,
      merchant_id: merchantId,
      amount: parseFloat(amount),
      currency: currency,
      issuer_country: issuerCountry,
      billing_country: billingCountry,
      customer_email: email,
      card_bin: cardBin,
      issuer_bank_name: MOCK_BIN_LOOKUP[cardBin] || 'Global Issuer Bank',
      timestamp: new Date().toISOString(),
      zip: zipCode ? parseInt(zipCode, 10) : 90210,
      city_pop: cityPop ? parseInt(cityPop, 10) : 50000,
    };

    setLastPayload(payload);
    const startTime = performance.now();

    try {
      const response = await fetch('https://fraudflux.onrender.com/api/v1/charge/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const elapsedMs = Math.round(performance.now() - startTime);
      setLatency(elapsedMs);

      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to FraudFlux API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#21005D]">Payment Checkout Simulator</h1>
        <p className="text-sm text-gray-600 mt-1">
          Simulate e-commerce checkout events and evaluate risk inference latency in real-time.
        </p>
      </header>

      {/* Preset Action Bar */}
      <div className="bg-[#E8DEF8] p-4 rounded-lg flex items-center justify-between border border-[#6750A4]/20">
        <span className="text-xs font-bold text-[#21005D] uppercase tracking-wider">LIVE SIMULATION SETUP</span>
        <div className="space-x-3 flex items-center">
          <button
            type="button"
            onClick={handlePresetSafe}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3.5 py-2 rounded-md transition-colors"
          >
            Safe Customer
          </button>
          <button
            type="button"
            onClick={handlePresetFraud}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3.5 py-2 rounded-md transition-colors"
          >
            Suspicious Fraud
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium px-3 py-2 rounded-md transition-colors border border-gray-300"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Realistic Checkout Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Checkout Form</h2>
          <form onSubmit={handleCheckout} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="text-xs font-medium text-gray-600">Amount ({currency})</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-[#6750A4]"
              />
            </div>

            {/* Card Number */}
            <div>
              <label className="text-xs font-medium text-gray-600">Card Number</label>
              <input
                type="text"
                placeholder="4532 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-[#6750A4]"
              />
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Expiry (MM/YY)</label>
                <input
                  type="text"
                  placeholder="12/28"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  maxLength={5}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-[#6750A4]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  maxLength={4}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-[#6750A4]"
                />
              </div>
            </div>

            {/* Customer Email */}
            <div>
              <label className="text-xs font-medium text-gray-600">Customer Email</label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-[#6750A4]"
              />
            </div>

            {/* Country Context */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Billing Country</label>
                <input
                  type="text"
                  value={billingCountry}
                  onChange={(e) => setBillingCountry(e.target.value.toUpperCase())}
                  maxLength={2}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-[#6750A4]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Issuer Country</label>
                <input
                  type="text"
                  value={issuerCountry}
                  onChange={(e) => setIssuerCountry(e.target.value.toUpperCase())}
                  maxLength={2}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-[#6750A4]"
                />
              </div>
            </div>

            {/* Merchant Name */}
            <div>
              <label className="text-xs font-medium text-gray-600">Merchant Name</label>
              <input
                type="text"
                value={merchantName}
                readOnly
                className="w-full border border-gray-200 bg-gray-50 text-gray-700 font-medium rounded px-3 py-2 text-sm mt-1 focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* Merchant ID */}
            <div>
              <label className="text-xs font-medium text-gray-600">Merchant ID</label>
              <input
                type="text"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                required
                placeholder="e.g. 677995a6-1e94-440d-9d27-79ae5d7d0e88"
                className="w-full border border-gray-300 bg-gray-50 rounded px-3 py-2 text-sm mt-1 focus:outline-none focus:border-[#6750A4]"
              />
            </div>

            {/* Toggleable Advanced Parameters Section */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-semibold text-[#6750A4] hover:underline flex items-center gap-1 focus:outline-none"
              >
                {showAdvanced ? '▼ Hide Advanced ML Parameters' : '▶ Show Advanced ML Parameters (ZIP & Population)'}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-2 gap-4 mt-3 p-3 bg-purple-50/50 rounded-md border border-purple-100">
                  <div>
                    <label className="text-xs font-medium text-gray-600">ZIP Code (5 digits)</label>
                    <input
                      type="number"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="90210"
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm mt-1 focus:outline-none focus:border-[#6750A4] bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">City Population</label>
                    <input
                      type="number"
                      value={cityPop}
                      onChange={(e) => setCityPop(e.target.value)}
                      placeholder="50000"
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm mt-1 focus:outline-none focus:border-[#6750A4] bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !merchantId}
              className="w-full bg-[#6750A4] hover:bg-[#533f85] text-white font-medium py-2.5 rounded-md text-sm transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Evaluating Risk via XGBoost...' : 'Process Payment & Evaluate Risk'}
            </button>
          </form>
        </div>

        {/* Evaluation Output Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Evaluation Result</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}

            {!result && !error && (
              <div className="text-center py-12 text-gray-400 text-sm">
                Select a setup and click <strong>"Process Payment"</strong> to run a live evaluation.
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Result Banner */}
                <div
                  className={`p-4 rounded-md border text-center ${
                    result.decision === 'APPROVE'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="text-lg font-bold">
                    {result.decision === 'APPROVE' ? '✅ PAYMENT APPROVED' : '🚨 PAYMENT DECLINED (FRAUD DETECTED)'}
                  </div>
                  <div className="text-xs mt-1">
                    Risk Score: <strong>{Math.round(result.risk_score > 1 ? result.risk_score : result.risk_score * 100)}%</strong> | Dynamic Threshold: <strong>{result.threshold_applied}%</strong>
                  </div>
                </div>

                {/* SLA Metric */}
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-md flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">⚡ Real-Time API Latency:</span>
                  <span className={`font-bold ${latency < 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {latency} ms {latency < 50 ? '(SLA <50ms Met)' : '(Over 50ms Target)'}
                  </span>
                </div>

                {/* Raw JSON Debug Box */}
                <div className="bg-[#1E1E1E] text-gray-200 p-3 rounded-md font-mono text-xs overflow-x-auto space-y-2">
                  <p className="text-gray-400 font-sans font-semibold">POST Payload sent to /v1/charge/evaluate:</p>
                  <pre className="text-sky-300">{JSON.stringify(lastPayload, null, 2)}</pre>
                  <p className="text-gray-400 font-sans font-semibold pt-2">API Response received:</p>
                  <pre className="text-emerald-300">{JSON.stringify(result, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}