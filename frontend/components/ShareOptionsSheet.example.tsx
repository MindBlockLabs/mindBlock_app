// Example usage of ShareOptionsSheet component
"use client";

import React, { useState } from 'react';
import ShareOptionsSheet from './ShareOptionsSheet';
import Button from './ui/Button';

const ShareOptionsExample: React.FC = () => {
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);

  const handleShare = (platform: string) => {
    console.log(`Sharing to ${platform}`);
    
    // Handle different sharing platforms
    switch (platform) {
      case 'contacts':
        // Open native contacts sharing
        if (navigator.share) {
          navigator.share({
            title: 'Check out my streak!',
            text: 'I\'m on a 7 day streak on MindBlock!',
            url: window.location.href,
          });
        }
        break;
        
      case 'telegram':
        // Open Telegram sharing
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('Check out my streak on MindBlock!')}`;
        window.open(telegramUrl, '_blank');
        break;
        
      case 'twitter':
        // Open Twitter sharing
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('I\'m on a 7 day streak on MindBlock! 🔥')}&url=${encodeURIComponent(window.location.href)}`;
        window.open(twitterUrl, '_blank');
        break;
        
      case 'whatsapp':
        // Open WhatsApp sharing
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('Check out my streak on MindBlock! ' + window.location.href)}`;
        window.open(whatsappUrl, '_blank');
        break;
        
      case 'email':
        // Open email client
        const emailUrl = `mailto:?subject=${encodeURIComponent('Check out my MindBlock streak!')}&body=${encodeURIComponent('I\'m on a 7 day streak on MindBlock! Check it out: ' + window.location.href)}`;
        window.location.href = emailUrl;
        break;
        
      case 'more':
        // Open native share menu if available
        if (navigator.share) {
          navigator.share({
            title: 'My MindBlock Streak',
            text: 'I\'m on a 7 day streak!',
            url: window.location.href,
          });
        } else {
          // Fallback: copy to clipboard
          navigator.clipboard.writeText(window.location.href);
          alert('Link copied to clipboard!');
        }
        break;
        
      default:
        console.log('Unknown platform:', platform);
    }
  };

  return (
    <div className="min-h-screen bg-[#050C16] flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-white text-2xl font-bold mb-4">ShareOptionsSheet Example</h1>
        <p className="text-white/60 mb-6">Click the button below to open the share sheet</p>
        
        {/* Example: Fire icon button that opens share sheet */}
        <Button
          onClick={() => setIsShareSheetOpen(true)}
          className="bg-[#FACC15] hover:bg-[#FACC15]/90 text-[#050C16] font-semibold px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
        >
          <span className="text-lg">🔥</span>
          Share Streak
        </Button>
      </div>

      {/* ShareOptionsSheet Component */}
      <ShareOptionsSheet
        isOpen={isShareSheetOpen}
        onClose={() => setIsShareSheetOpen(false)}
        onShare={handleShare}
      />
    </div>
  );
};

export default ShareOptionsExample;