# Onboarding Flow Integration

## Overview

The onboarding flow collects user preferences across 4 steps and saves them to the backend via a single PATCH request when the user completes the final step.

## Architecture

### Frontend Components

#### 1. OnboardingContext (`frontend/app/onboarding/OnboardingContext.tsx`)

- Manages onboarding state across all steps
- Stores: `challengeLevel`, `challengeTypes`, `referralSource`, `ageGroup`
- Provides `updateData()` and `resetData()` methods

#### 2. API Service (`frontend/lib/api/userApi.ts`)

- `updateUserProfile()`: Makes PATCH request to `/users/{userId}`
- Handles authentication via Bearer token from localStorage
- Comprehensive error handling with custom `UserApiError` class
- Network error detection and user-friendly messages

#### 3. Custom Hook (`frontend/hooks/useUpdateUserProfile.ts`)

- Wraps API service with React state management
- Provides `updateProfile()`, `isLoading`, `error`, `clearError()`
- Automatically updates Redux auth store on success

#### 4. Onboarding Pages

- **Step 1**: `/onboarding/challenge-level` - Select skill level
- **Step 2**: `/onboarding/challenge-types` - Select challenge types
- **Step 3a**: `/onboarding/additional-info` - Referral source
- **Step 3b**: `/onboarding/additional-info` - Age group
- **Final**: API call + redirect to `/dashboard`

### Backend Integration

#### Endpoint

```
PATCH /users/{userId}
Authorization: Bearer {token}
Content-Type: application/json
```

#### Request Body

```typescript
{
  challengeLevel: "beginner" | "intermediate" | "advanced" | "expert",
  challengeTypes: ["Coding Challenges", "Logic Puzzle", "Blockchain"],
  referralSource: "Google Search" | "X/Twitter" | "Friends" | "Other",
  ageGroup: "10-17 years old" | "18-24 years old" | ... | "65+ years old"
}
```

#### Response

```typescript
{
  id: string;
  username?: string;
  email?: string;
  challengeLevel?: string;
  challengeTypes?: string[];
  // ... other user fields
}
```

## Data Flow

1. User navigates through onboarding steps
2. Each step updates OnboardingContext state
3. On final step completion:
   - Data is mapped from frontend values to backend enums
   - `useUpdateUserProfile` hook is called
   - Loading state shows "Preparing your account..." screen
   - API request is made with all collected data
   - On success: Redux store updated, context reset, redirect to dashboard
   - On error: Error screen with retry option

## Enum Mapping

Frontend display values are mapped to backend enum values using `onboardingMapper.ts`:

```typescript
// Challenge Level
BEGINNER → beginner
INTERMEDIATE → intermediate
ADVANCED → advanced
EXPERT → expert

// Challenge Types
CODING → Coding Challenges
LOGIC → Logic Puzzle
BLOCKCHAIN → Blockchain

// Referral Source
Google Search → Google Search
X (formerly called Twitter) → X/Twitter
Friends / family → Friends
Others → Other

// Age Group
From 10 to 17 years old → 10-17 years old
18 to 24 years old → 18-24 years old
// ... etc
```

## Error Handling

### Network Errors

- Message: "Unable to connect. Please check your internet connection."
- Detected via `TypeError` with 'fetch' in message

### Authentication Errors (401)

- Message: "Unauthorized. Please log in again."
- User should be redirected to login

### Validation Errors (400)

- Message: Backend error message or "Invalid data provided"
- Shows specific field errors if available

### Server Errors (500)

- Message: "Something went wrong. Please try again."
- Retry option provided

### User Actions

- **Retry**: Clears error and attempts API call again
- **Skip for now**: Redirects to dashboard without saving

## Loading States

### Progress Animation

- Starts at 0% when API call begins
- Increments by 2% every 50ms
- Stops at 90% until actual completion
- Jumps to 100% on success
- Shows animated puzzle icon and progress bar

## Authentication

### Requirements

- User must be authenticated (have valid token in localStorage)
- User ID is retrieved from Redux auth store
- Token is sent as Bearer token in Authorization header

### Token Management

- Token stored in localStorage as 'accessToken'
- Retrieved by API service for each request
- If missing, returns 401 error

## Testing Checklist

- [ ] All 4 onboarding steps navigate correctly
- [ ] Data persists across step navigation
- [ ] Back button works on each step
- [ ] Continue button disabled when no selection
- [ ] Loading screen shows during API call
- [ ] Success redirects to dashboard
- [ ] Error screen shows on failure
- [ ] Retry button works after error
- [ ] Skip button redirects to dashboard
- [ ] Network errors handled gracefully
- [ ] Auth errors handled correctly
- [ ] Data saved correctly in backend
- [ ] Redux store updated after save
- [ ] Context reset after successful save

## Future Enhancements

1. **Onboarding Completion Flag**
   - Store flag in user profile to prevent re-showing
   - Check flag on app load and skip if completed

2. **Progress Persistence**
   - Save partial progress to localStorage
   - Resume from last step if user closes app

3. **Skip Option**
   - Add "Skip for now" on earlier steps
   - Mark fields as optional in backend

4. **Validation**
   - Add client-side validation before submission
   - Show inline errors for invalid selections

5. **Analytics**
   - Track completion rate
   - Track drop-off points
   - A/B test different flows
