export const SECURITY_HEADERS_CONFIG = {
  common: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
    'X-DNS-Prefetch-Control': 'off',
  },
  hsts: {
    production: 'max-age=31536000; includeSubDomains; preload',
    development: null, // disabled in dev
  },
  cacheControl: {
    dynamic: 'no-cache, no-store, must-revalidate',
    static: 'public, max-age=31536000',
    private: 'private, no-cache',
  },
  removeHeaders: ['X-Powered-By', 'Server', 'X-AspNet-Version', 'X-AspNetMvc-Version'],
};
