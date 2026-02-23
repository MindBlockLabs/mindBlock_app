'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NotFoundPage = () => {
  const router = useRouter();
  const [countdown, setCountdown] = useState<number>(5);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push('/');
    }
  }, [countdown, router]);

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#050C16] text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl font-bold text-purple-400">404</span>
          </div>
          <h1 className="text-3xl font-bold text-purple-400 mb-4">Page Not Found</h1>
          <p className="text-gray-300 mb-2">
            {`Oops! The page you're looking for doesn't exist.`}
          </p>
          <p className="text-gray-400 text-sm">
            {`It might have been moved, deleted, or the URL might be incorrect.`}
          </p>
        </div>

        <div className="space-y-4 mt-8">
          <Link href="/" passHref>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleGoHome();
              }}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go Home
            </button>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          Redirecting to home in {countdown}s...
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;