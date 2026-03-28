import { useState, useCallback } from 'react';
import { updateUserProfile, UpdateUserProfileDto, UserApiError } from '@/lib/api/userApi';
import { useAuth } from './useAuth';

interface UseUpdateUserProfileResult {
  updateProfile: (data: UpdateUserProfileDto) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useUpdateUserProfile(): UseUpdateUserProfileResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, updateUser } = useAuth();

  const updateProfile = useCallback(async (data: UpdateUserProfileDto) => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedUser = await updateUserProfile(user.id, data);
      
      // Update user in Redux store
      updateUser(updatedUser);
      
    } catch (err) {
      if (err instanceof UserApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, updateUser]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateProfile,
    isLoading,
    error,
    clearError,
  };
}
