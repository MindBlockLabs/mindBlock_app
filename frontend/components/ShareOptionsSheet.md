# ShareOptionsSheet Component

A reusable bottom sheet component for sharing content across different platforms.

## Features

- ✅ Smooth slide-up animation
- ✅ Dark background with backdrop blur
- ✅ Mobile-friendly responsive design
- ✅ Keyboard accessible (ESC to close, focus management)
- ✅ Circular icon buttons for each platform
- ✅ Support for 6 sharing options: Contacts, Telegram, Twitter, WhatsApp, E-mail, More

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✅ | Controls whether the sheet is visible |
| `onClose` | `() => void` | ✅ | Callback when the sheet should be closed |
| `onShare` | `(platform: string) => void` | ✅ | Callback when a sharing option is selected |

## Platform IDs

The `onShare` callback receives one of these platform identifiers:

- `'contacts'` - Native contacts sharing
- `'telegram'` - Telegram sharing
- `'twitter'` - Twitter/X sharing  
- `'whatsapp'` - WhatsApp sharing
- `'email'` - Email sharing
- `'more'` - Additional sharing options

## Usage

```tsx
import React, { useState } from 'react';
import ShareOptionsSheet from './components/ShareOptionsSheet';

function MyComponent() {
  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleShare = (platform: string) => {
    switch (platform) {
      case 'twitter':
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('Check this out!')}`;
        window.open(twitterUrl, '_blank');
        break;
      case 'whatsapp':
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('Check this out!')}`;
        window.open(whatsappUrl, '_blank');
        break;
      // Handle other platforms...
    }
  };

  return (
    <div>
      <button onClick={() => setIsShareOpen(true)}>
        Share 🔥
      </button>
      
      <ShareOptionsSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        onShare={handleShare}
      />
    </div>
  );
}
```

## Accessibility

- **Keyboard Navigation**: ESC key closes the sheet
- **Focus Management**: Automatically focuses the first button when opened
- **Screen Readers**: Proper ARIA labels and roles
- **Mobile Friendly**: Touch-optimized button sizes and spacing

## Styling

The component uses Tailwind CSS classes and follows the app's design system:

- **Background**: Dark theme (`#0D1829`)
- **Accent Color**: Yellow (`#FACC15`) for hover states
- **Special Styling**: Email option has red accent (`#EF4444`)
- **Animation**: Smooth slide-up transition (300ms)

## Integration with Navigation

This component is designed to be triggered from the streak fire icon in the navbar:

1. User clicks the streak fire icon
2. Navigation goes to `/streak` page
3. Share button on streak page opens this ShareOptionsSheet
4. User selects a platform to share their streak

## Dependencies

- React 18+
- Tailwind CSS
- `./ui/Button` component
- Modern browser with Web Share API support (optional, graceful fallback)