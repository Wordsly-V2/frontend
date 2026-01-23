'use client';
import { useQuery } from '@tanstack/react-query';

interface UserProfile {
    id: string;
    gmail: string;
    displayName: string;
    pictureUrl: string;
}

async function fetchUserProfile(): Promise<UserProfile> {
    const access_token = localStorage.getItem('access_token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/profile`, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    });
    if (!response.ok) {
        throw new Error(response.statusText);
    }

    return await response.json();
}

export const useUserProfile = () => {
    return useQuery<UserProfile, Error>({
        queryKey: ['user.profile'],
        queryFn: fetchUserProfile,
    });
};
