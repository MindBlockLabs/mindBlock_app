# Onboarding Integration - Quick Start Guide

## 🚀 What Was Built

The onboarding flow now saves user data to the backend when users complete all 4 steps.

## 📁 New Files Created

```
frontend/
├── lib/
│   ├── api/
│   │   └── userApi.ts                    # API service for user profile updates
│   └── utils/
│       └── onboardingMapper.ts           # Maps frontend values to backend enums
├── hooks/
│   └── useUpdateUserProfile.ts           # React hook for profile updates
└── docs/
    └── ONBOARDING_INTEGRATION.md         # Detailed documentation
```

## 📝 Modified Files

```
frontend/app/onboarding/
├── OnboardingContext.tsx                 # Simplified data structure
└── additional-info/page.tsx              # Added API integration
```

## 🔄 How It Works

### User Flow

1. User selects challenge level → stored in context
2. User selects challenge types → stored in context
3. User selects referral source → stored in context
4. User selects age group → **API call triggered**
5. Loading screen shows "Preparing your account..."
6. On success → Redirect to dashboard
7. On error → Show error with retry option

### Technical Flow

```
OnboardingContext (state)
    ↓
additional-info/page.tsx (final step)
    ↓
useUpdateUserProfile() hook
    ↓
updateUserProfile() API call
    ↓
PATCH /users/{userId}
    ↓
Success: Update Redux + Redirect
Error: Show error screen
```

## 🧪 How to Test

### 1. Start the Application

```bash
# Backend
cd backend
npm run start:dev

# Frontend
cd frontend
npm run dev
```

### 2. Test Happy Path

1. Navigate to `/onboarding`
2. Complete all 4 steps
3. Verify loading screen appears
4. Verify redirect to `/dashboard`
5. Check browser DevTools Network tab for PATCH request
6. Verify user data saved in database

### 3. Test Error Handling

```bash
# Test network error (stop backend)
npm run stop

# Test auth error (clear localStorage)
localStorage.removeItem('accessToken')

# Test validation error (modify enum values)
```

## 🔍 Debugging

### Check API Call

```javascript
// Open browser console on final onboarding step
// Look for:
// - PATCH request to /users/{userId}
// - Request headers (Authorization: Bearer ...)
// - Request body (challengeLevel, challengeTypes, etc.)
// - Response status (200 = success)
```

### Check State

```javascript
// In OnboardingContext
console.log("Onboarding data:", data);

// In useUpdateUserProfile
console.log("Loading:", isLoading);
console.log("Error:", error);
```

### Common Issues

**Issue**: "User not authenticated" error

- **Fix**: Ensure user is logged in and token exists in localStorage

**Issue**: API call returns 400 validation error

- **Fix**: Check enum mapping in `onboardingMapper.ts`

**Issue**: Loading screen stuck

- **Fix**: Check network tab for failed request, verify backend is running

**Issue**: Redirect not working

- **Fix**: Check router.push('/dashboard') is called after success

## 📊 API Request Example

### Request

```http
PATCH /users/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "challengeLevel": "intermediate",
  "challengeTypes": ["Coding Challenges", "Logic Puzzle"],
  "referralSource": "Google Search",
  "ageGroup": "25-34 years old"
}
```

### Response (Success)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "username": "john_doe",
  "email": "john@example.com",
  "challengeLevel": "intermediate",
  "challengeTypes": ["Coding Challenges", "Logic Puzzle"],
  "referralSource": "Google Search",
  "ageGroup": "25-34 years old",
  "xp": 0,
  "level": 1
}
```

### Response (Error)

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## 🎨 UI States

### Loading State

- Animated puzzle icon (bouncing)
- Progress bar (0-100%)
- Message: "Preparing your account..."

### Error State

- Red error icon
- Error message (specific to error type)
- "Try Again" button
- "Skip for now" link

### Success State

- Automatic redirect to dashboard
- No manual confirmation needed

## 🔐 Security

- ✅ Authentication required (Bearer token)
- ✅ User ID from authenticated session
- ✅ Token stored securely in localStorage
- ✅ HTTPS recommended for production
- ✅ No sensitive data in URL params

## 📈 Monitoring

### What to Monitor

- API success rate
- Average response time
- Error types and frequency
- Completion rate (users who finish all steps)
- Drop-off points (which step users leave)

### Logging

```javascript
// Add to production
console.log("Onboarding completed:", {
  userId: user.id,
  timestamp: new Date().toISOString(),
  data: profileData,
});
```

## 🚨 Error Messages

| Error Type       | User Message                                                | Action            |
| ---------------- | ----------------------------------------------------------- | ----------------- |
| Network          | "Unable to connect. Please check your internet connection." | Retry             |
| Auth (401)       | "Unauthorized. Please log in again."                        | Redirect to login |
| Validation (400) | "Invalid data provided"                                     | Show field errors |
| Server (500)     | "Something went wrong. Please try again."                   | Retry             |
| Unknown          | "An unexpected error occurred. Please try again."           | Retry             |

## ✅ Checklist Before Deployment

- [ ] Environment variable `NEXT_PUBLIC_API_URL` set correctly
- [ ] Backend endpoint `/users/{userId}` is accessible
- [ ] Authentication middleware configured
- [ ] CORS enabled for frontend domain
- [ ] Error logging configured
- [ ] Analytics tracking added (optional)
- [ ] Load testing completed
- [ ] User acceptance testing completed

## 📞 Support

For issues or questions:

1. Check `frontend/docs/ONBOARDING_INTEGRATION.md` for detailed docs
2. Review `ONBOARDING_IMPLEMENTATION_SUMMARY.md` for architecture
3. Check browser console for errors
4. Check backend logs for API errors
5. Verify environment variables are set

## 🎯 Success Metrics

- ✅ All 4 onboarding steps navigate correctly
- ✅ Data persists across navigation
- ✅ API call succeeds with correct data
- ✅ Loading state shows during API call
- ✅ Success redirects to dashboard
- ✅ Errors show user-friendly messages
- ✅ Retry functionality works
- ✅ No console errors or warnings
