export const COMPRESSION_CONFIG = {
  threshold: 1024, // minimum size in bytes
  gzip: { level: 6 }, // balance speed vs size
  brotli: { quality: 4 }, // modern browsers
  skipTypes: [
    /^image\//,
    /^video\//,
    /^audio\//,
    /^application\/zip/,
    /^application\/gzip/,
  ],
  compressibleTypes: [
    'application/json',
    'text/html',
    'text/plain',
    'application/javascript',
    'text/css',
    'text/xml',
  ],
};
