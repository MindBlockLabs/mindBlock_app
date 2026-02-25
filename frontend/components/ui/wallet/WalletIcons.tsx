import React from 'react';

export const PhantomIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="32" height="32" rx="8" fill="#AB9FF2" />
    <path
      d="M27.04 16.16c0-6.16-4.93-11.16-11-11.16S5.04 10 5.04 16.16c0 5.57 3.87 10.22 9.06 11.33v-3.9c-3.32-.97-5.74-4.06-5.74-7.43 0-4.43 3.44-8.03 7.7-8.03 4.25 0 7.7 3.6 7.7 8.03 0 .63-.07 1.24-.21 1.83h-3.13c.19-.58.29-1.2.29-1.83 0-3.01-2.09-5.38-4.65-5.38-.76 0-1.48.2-2.11.56v3.19c.57-.52 1.31-.83 2.11-.83 1.47 0 2.69 1.27 2.69 2.87v.09h3.02v-.09c0-3.19-2.56-5.77-5.71-5.77-3.15 0-5.71 2.58-5.71 5.77 0 2.79 1.97 5.12 4.6 5.66v3.97c-.52.07-1.05.1-1.58.1-1.01 0-1.99-.13-2.93-.38v3.78C11.61 28.87 13.28 29 15.04 29c.52 0 1.04-.03 1.55-.08v-3.98c2.54-.59 4.42-2.88 4.42-5.62 0-.62-.1-1.22-.27-1.78h3.12c.11.58.18 1.17.18 1.78v.84h-3.2v3.15h3.2v3.61h3.17v-3.61h.03V18.8h-.03c0-.89-.07-1.77-.18-2.64z"
      fill="white"
    />
  </svg>
);

export const MetaMaskIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="32" height="32" rx="8" fill="#1B1B1B" />
    <path d="M26.6 5.6L17.4 12.3l1.7-4L26.6 5.6z" fill="#E2761B" stroke="#E2761B" strokeWidth="0.1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.4 5.6l9.1 6.8-1.6-4.1L5.4 5.6zM23.4 21.2l-2.4 3.7 5.2 1.4 1.5-5-.3-.1zM4.3 21.3l1.5 5 5.2-1.4-2.4-3.7-.3.1z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.7 15.1l-1.5 2.2 5.2.2-.2-5.5-3.5 3.1zM21.3 15.1l-3.5-3.2-.2 5.6 5.2-.2-1.5-2.2zM11 24.9l3.1-1.5-2.7-2.1-.4 3.6zM17.9 23.4l3.1 1.5-.4-3.6-2.7 2.1z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 24.9l-3.1-1.5.2 1.7v1l2.9-1.2zM11 24.9l2.9 1.2v-1l.2-1.7-3.1 1.5z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="0.1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.9 20.1l-2.6-.8 1.8-.8.8 1.6zM18.1 20.1l.8-1.6 1.9.8-2.7.8z" fill="#233447" stroke="#233447" strokeWidth="0.1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11 24.9l.4-3.7-2.8.1 2.4 3.6zM20.6 21.2l.4 3.7 2.4-3.6-2.8-.1zM22.8 17.3l-5.2.2.5 2.6.8-1.6 1.9.8 2-2zM11.3 19.3l1.9-.8.8 1.6.5-2.6-5.2-.2 2 2z" fill="#CD6116" stroke="#CD6116" strokeWidth="0.1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.2 17.3l2.2 4.3-.1-2.3-2.1-2zM20.7 19.3l-.1 2.3 2.2-4.3-2.1 2zM14.4 17.5l-.5 2.6.6 3.2.1-4.2-.2-1.6zM17.6 17.5l-.2 1.5.1 4.2.6-3.2-.5-2.5z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.1 20.1l-.6 3.2.5.3 2.7-2.1.1-2.3-2.7 1.9zM11.3 19.3l.1 2.3 2.7 2.1.5-.3-.6-3.2-2.7-1.9z" fill="#F6851B" stroke="#F6851B" strokeWidth="0.1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.2 26.1v-1l-.2-.2H14l-.2.2v1L11 24.9l1 .8 2.1 1.5h3.9l2.1-1.5 1-.8-1.9 1.2z" fill="#C0AD9E" stroke="#C0AD9E" strokeWidth="0.1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17.9 23.4l-.5-.3h-2.8l-.5.3-.2 1.7.2-.2H18l.2.2-.3-1.7z" fill="#161616" stroke="#161616" strokeWidth="0.1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M26.9 12.6l.8-3.8L26.6 5.6l-9.2 6.8 3.5 3 5 1.5 1.1-1.3-.5-.3.8-.7-.6-.5.8-.6-.6-.4zM4.3 8.8L5.1 12.6l-.6.4.8.6-.6.5.8.7-.5.3 1.1 1.3 5-1.5 3.5-3-9.2-6.8L4.3 8.8z" fill="#763D16" stroke="#763D16" strokeWidth="0.1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M25.9 14.9l-5-1.5 1.5 2.2-2.2 4.3 2.9-.1h4.2l-1.4-4.9zM11.2 13.4l-5 1.5-1.4 4.9h4.2l2.9.1-2.2-4.3 1.5-2.2zM17.6 17.5l.3-5.4-1.4-3.8h-2.9l-1.3 3.8.3 5.4.1 1.6v4.2h2.8v-4.2l.1-1.6z" fill="#F6851B" stroke="#F6851B" strokeWidth="0.1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CoinbaseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="32" height="32" rx="8" fill="#0052FF" />
    <circle cx="16" cy="16" r="9" fill="white" />
    <rect x="12.5" y="13.5" width="7" height="5" rx="1" fill="#0052FF" />
  </svg>
);

export const TrustIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="32" height="32" rx="8" fill="#3375BB" />
    <path
      d="M16 5L8 8.5V15.5C8 20.1 11.4 24.4 16 26C20.6 24.4 24 20.1 24 15.5V8.5L16 5Z"
      fill="white"
    />
    <path
      d="M13 16.5L15 18.5L19.5 14"
      stroke="#3375BB"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FreighterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="32" height="32" rx="8" fill="#000000" />
    <path
      d="M8 10h10a6 6 0 0 1 0 12H8V10z"
      fill="white"
    />
    <path
      d="M8 16h8"
      stroke="#000000"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
