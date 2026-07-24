import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      // Successful login will automatically update user state via AuthContext!
    } catch (err) {
      setError(err.message || 'Failed to sign in. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a103c] text-white p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-slate-900 shadow-2xl">
        <h1 className="text-2xl font-bold text-[#1a103c] mb-1">FraudFlux</h1>
        <h2 className="text-xl font-semibold mb-6 text-gray-700">Log in to your account</h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
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
              className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#5842be] py-2.5 text-sm font-medium text-white hover:bg-[#4833a8] transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};