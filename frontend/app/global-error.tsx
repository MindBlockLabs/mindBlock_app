'use client';

import { useEffect } from 'react';
import GenericErrorPage from '../components/error/GenericErrorPage';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <GenericErrorPage 
          title="Application Error" 
          message="We're sorry, but an unexpected error occurred in the application. Please try reloading the page."
        />
      </body>
    </html>
  );
}