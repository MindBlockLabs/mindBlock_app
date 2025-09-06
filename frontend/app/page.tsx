'use client';
import Button from '@/components/Button';
import Image from 'next/image';

const WalletIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M20 7V6C20 4.89543 19.1046 4 18 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20H18C19.1046 20 20 19.1046 20 18V17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 12H14C13.4477 12 13 11.5523 13 11V9C13 8.44772 13.4477 8 14 8H21V12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 12V8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Home() {
  return (
    <div className="w-full max-w-sm space-y-8">
      <p>Usage for Button</p>
      <Button variant="primary" onClick={() => console.log('Primary pressed')}>
        Register & Play
      </Button>

      <Button
        variant="secondary"
        onClick={() => console.log('Secondary pressed')}
      >
        <div className="flex flex-row items-center justify-center">
          <WalletIcon className="text-blue-500 mr-2" />
          <span>Connect Wallet</span>
        </div>
      </Button>

      <Button variant="primary" disabled>
        Register & Play
      </Button>

      <Button variant="secondary" disabled>
        <div className="flex flex-row items-center justify-center">
          <WalletIcon className="text-blue-500 mr-2" />
          <span>Connect Wallet</span>
        </div>
      </Button>
    </div>
  );
}
