"use client";

import React, { useEffect, useState } from 'react';

interface Props {
  children: React.ReactNode;
}

// Client-side development auth parity guard.
// Enable by setting NEXT_PUBLIC_DEV_ENFORCE_AUTH=true.
// If cookie `dev-auth=1` is not present, shows a 401-style block.
export default function DevAuthGuard({ children }: Props) {
  const enforce = process.env.NEXT_PUBLIC_DEV_ENFORCE_AUTH === 'true';
  const [authorized, setAuthorized] = useState(true);

  useEffect(() => {
    if (!enforce) {
      setAuthorized(true);
      return;
    }
    try {
      const hasCookie = typeof document !== 'undefined' && document.cookie.includes('dev-auth=1');
      setAuthorized(hasCookie);
    } catch {
      setAuthorized(false);
    }
  }, [enforce]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <h1 className="text-2xl font-bold mb-2">401 Unauthorized (Dev)</h1>
        <p className="text-gray-600 mb-4 text-center max-w-md">
          Development auth parity is enabled. Set the cookie <code>dev-auth=1</code> to access pages locally.
        </p>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-md bg-black text-white"
            onClick={() => {
              document.cookie = 'dev-auth=1; path=/';
              location.reload();
            }}
          >
            Set dev-auth cookie
          </button>
          <a href="/loggedout" className="px-4 py-2 rounded-md bg-gray-200 text-black">
            Go to Logged Out
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
