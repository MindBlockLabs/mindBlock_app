'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const GenericErrorPage = ({ 
  title = "Something went wrong", 
  message = "We're sorry, but an unexpected error occurred. Please try again.",
  showRefresh = true
}) => {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRetry = () => {
    if (showRefresh) {
      setIsRefreshing(true);
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#050C16] text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-400 mb-4">{title}</h1>
          <p className="text-gray-300 mb-2">
            {message}
          </p>
          <p className="text-gray-400 text-sm">
            Our team has been notified of the issue.
          </p>
        </div>

        <div className="space-y-4 mt-8">
          {showRefresh && (
            <button
              onClick={handleRetry}
              disabled={isRefreshing}
              className={`w-full px-6 py-3 rounded-lg transition-colors ${
                isRefreshing 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isRefreshing ? 'Refreshing...' : 'Try Again'}
            </button>
          )}
          
          <button
            onClick={handleGoHome}
            className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenericErrorPage;