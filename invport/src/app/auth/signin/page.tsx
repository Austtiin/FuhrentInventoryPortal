'use client';

import React from 'react';

const SignInPage: React.FC = () => {
  const handleMicrosoftSignIn = async () => {
    // OAuth not configured yet - disable for now
    alert('OAuth authentication is not configured yet. Please contact your administrator.');
    return;
  };

  const handleGoogleSignIn = async () => {
    // OAuth not configured yet - disable for now
    alert('OAuth authentication is not configured yet. Please contact your administrator.');
    return;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-mint rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg 
              className="w-10 h-10 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Fuhr Enterprise
          </h1>
          <p className="text-slate-600">Dealer Inventory Portal</p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">
            Sign In to Continue
          </h2>
          
          <div className="space-y-4">
            {/* Microsoft Sign In */}
            <button
              onClick={handleMicrosoftSignIn}
              className="w-full flex items-center justify-center px-6 py-3 border border-slate-300 rounded-xl shadow-sm bg-white text-slate-700 font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-mint focus:border-primary-mint transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M13 1h10v10H13z"/>
                <path fill="#05a6f0" d="M1 13h10v10H1z"/>
                <path fill="#ffba08" d="M13 13h10v10H13z"/>
              </svg>
              Continue with Microsoft
            </button>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center px-6 py-3 border border-slate-300 rounded-xl shadow-sm bg-white text-slate-700 font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-mint focus:border-primary-mint transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Secure Authentication</span>
            </div>
          </div>

          {/* Security Note */}
          <div className="text-center text-sm text-slate-500">
            <p>Your credentials are protected by enterprise-grade security.</p>
            <p className="mt-1">Contact IT support for access issues.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>&copy; 2024 Fuhr Enterprise. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;