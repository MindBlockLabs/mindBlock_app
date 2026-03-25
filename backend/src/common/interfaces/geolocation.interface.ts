export interface GeolocationData {
  ip: string;
  country: string;
  region: string;
  city: string;
  timezone: string;
  language: string;
  isOverride: boolean;
}

declare module 'express' {
  export interface Request {
    location?: GeolocationData;
  }
}
