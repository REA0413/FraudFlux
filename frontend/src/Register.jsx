// src/Register.jsx
import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';

export default function Register({ onSwitchToLogin }) {
  const [merchantName, setMerchantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(email, password, merchantName);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a103c] text-white p-4 font-sans">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-slate-900 shadow-2xl">
        <h1 className="text-2xl font-bold text-[#1a103c] mb-1">FraudFlux</h1>
        <h2 className="text-xl font-semibold mb-6 text-gray-700">Create Merchant Account</h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success ? (
          <div className="rounded-md bg-green-50 p-4 text-green-800 text-center space-y-3">
            <p className="font-semibold text-base">Thank you! Account Created Successfully! 🎉</p>
            <p className="text-xs text-gray-600">
              Please check your inbox and click on the verification link to start working with FraudFlux.
            </p>
            <button
              onClick={onSwitchToLogin}
              className="mt-2 w-full rounded-md bg-[#5842be] py-2 text-sm font-medium text-white hover:bg-[#4833a8]"
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business / Merchant Name</label>
              <input
                type="text"
                required
                className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none text-black"
                placeholder="Acme Payments Ltd"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none text-black"
                placeholder="admin@merchant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none text-black"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#5842be] py-2.5 text-sm font-medium text-white hover:bg-[#4833a8] transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Register Merchant'}
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-[#5842be] font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}