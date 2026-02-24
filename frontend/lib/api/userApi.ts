const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface UpdateUserProfileDto {
  username?: string;
  challengeLevel?: string;
  challengeTypes?: string[];
  country?: string;
  interests?: string[];
  occupation?: string;
  goals?: string[];
  availableHours?: string[];
  bio?: string;
  referralSource?: string;
  ageGroup?: string;
  fullname?: string;
}

export interface UpdateUserProfileResponse {
  id: string;
  username?: string;
  email?: string;
  challengeLevel?: string;
  challengeTypes?: string[];
  country?: string;
  interests?: string[];
  occupation?: string;
  goals?: string[];
  availableHours?: string[];
  bio?: string;
}

export class UserApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'UserApiError';
  }
}

export async function updateUserProfile(
  userId: string,
  data: UpdateUserProfileDto
): Promise<UpdateUserProfileResponse> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  if (!token) {
    throw new UserApiError('Authentication required', 401);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new UserApiError('Unauthorized. Please log in again.', 401, errorData);
      }
      
      if (response.status === 404) {
        throw new UserApiError('User not found', 404, errorData);
      }
      
      if (response.status === 400) {
        throw new UserApiError(
          errorData.message || 'Invalid data provided',
          400,
          errorData
        );
      }

      throw new UserApiError(
        errorData.message || 'Failed to update profile',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof UserApiError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new UserApiError('Unable to connect. Please check your internet connection.');
    }

    throw new UserApiError('An unexpected error occurred. Please try again.');
  }
}
