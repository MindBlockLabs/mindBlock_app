'use client';

import { useEffect, useState } from 'react';

const OfflinePage = () => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryAttempt(prev => prev + 1);
    // Force a re-check of online status
    setIsOnline(navigator.onLine);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#050C16] text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-yellow-400 mb-4">{`You're Offline`}</h1>
          <p className="text-gray-300 mb-2">
            {isOnline 
              ? "Connection restored!" 
              : `It looks like you're not connected to the internet.`}
          </p>
          <p className="text-gray-400 text-sm">
            Check your network connection and try again.
          </p>
        </div>

        <div className="space-y-4 mt-8">
          {!isOnline ? (
            <>
              <button
                onClick={handleRetry}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Check Connection
              </button>
              <button
                onClick={handleRefresh}
                className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Refresh Page
              </button>
            </>
          ) : (
            <button
              onClick={handleRefresh}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Continue to App
            </button>
          )}
        </div>

        {retryAttempt > 0 && (
          <div className="mt-6 text-sm text-gray-500">
            {isOnline 
              ? "Great! You're back online. Click 'Continue to App' to proceed." 
              : "Still having trouble connecting. Please check your network settings."}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflinePage;