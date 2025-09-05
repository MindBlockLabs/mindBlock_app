'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="w-full bg-[#050C16] py-[18px] px-[16px] md:px-8 border-b-[1px] border-[#FFFFFF33] flex items-center gap-[10px]">
      {/* Left: Logo and Brand */}
      <Link href="/" className="flex items-center gap-2">
        <Image 
          src="/logo.png" // path relative to public folder
          alt="Home"
          width={34}       // set width
          height={34}
        />
        <span className="text-[#3B82F6] font-bold text-xl">mind block</span>
      </Link>
      {/* Center: Title (mobile view below logo) */}
      <div className="flex-1 flex justify-center md:justify-start">
        <span className="hidden mx-6 text-2xl font-semibold text-white">
          Your journey continues
        </span>
      </div>
      {/* Right: Placeholder for future nav actions; empty for now */}
      <div className="flex-none"></div>
    </nav>
    // Breadcrumb & Headline area if needed
    // <div className="w-full px-4 py-2 md:px-8">
    //   <span className="block md:hidden text-2xl font-semibold text-white mt-2">
    //     Your journey continues
    //   </span>
    // </div>
  );
}
