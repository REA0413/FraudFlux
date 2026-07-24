import React from 'react';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <p>Loading FraudFlux session...</p>
      </div>
    );
  }

  if (!user) {
    // If not logged in, render the login page or a simple redirect
    return <LoginFallback />;
  }

  return children;
};

// Fallback message/prompt if unauthenticated
const LoginFallback = () => (
  <div className="flex h-screen flex-col items-center justify-center bg-slate-900 text-white">
    <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
    <p className="mb-6 text-gray-400">Please sign in to access the FraudFlux Dashboard.</p>
  </div>
);