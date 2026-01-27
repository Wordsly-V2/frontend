'use client';
import axios from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';

interface UserProfile {
    id: string;
    gmail: string;
    displayName: string;
    pictureUrl: string;
}

async function fetchUserProfile(): Promise<UserProfile> {
    try {
        const response = await axios.get<UserProfile>(`/auth/users/profile`);
        return response.data;
    } catch (error) {
        throw new Error((error as Error).toString());
    }
}

export const useUserProfile = () => {
    return useQuery<UserProfile, Error>({
        queryKey: ['user.profile'],
        queryFn: fetchUserProfile,
    });
};
