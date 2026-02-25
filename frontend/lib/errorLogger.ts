// Error logging utility for the mindBlock app
export class ErrorLogger {
  static logError(error: Error, context?: string, extraData?: Record<string, unknown>) {
    // In development, always log to console
    if (process.env.NODE_ENV === 'development') {
      console.group('Error Logger');
      console.error('Error:', error);
      if (context) console.info('Context:', context);
      if (extraData) console.info('Extra Data:', extraData);
      console.groupEnd();
    }

    // In production, this could send to an error tracking service like Sentry, Bugsnag, etc.
    // For now, we'll just log to console
    console.error('App Error:', {
      message: error.message,
      stack: error.stack,
      context,
      extraData,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    });
  }

  static logApiError(response: Response, context?: string) {
    this.logError(
      new Error(`API Error: ${response.status} - ${response.statusText}`),
      context,
      { 
        status: response.status,
        url: response.url,
        statusText: response.statusText
      }
    );
  }

  static logNetworkError(error: unknown, context?: string) {
    this.logError(
      new Error(`Network Error: ${error instanceof Error ? error.message : 'Unknown network error'}`),
      context,
      { 
        errorType: error instanceof Error ? error.constructor?.name : typeof error,
        details: error instanceof Error ? error.toString?.() : String(error)
      }
    );
  }
}