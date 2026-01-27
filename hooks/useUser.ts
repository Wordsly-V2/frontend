import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProfile as fetchProfileAction, logout as logoutAction, initProfileFromLocalStorage as initProfileFromLocalStorageAction } from '@/store/slices/userSlice';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const useUser = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.user.profile);
    const isLoading = useAppSelector((state) => state.user.isLoading);
    const error = useAppSelector((state) => state.user.error);

    function initProfileFromLocalStorage() {
        return dispatch(initProfileFromLocalStorageAction());
    }

    function fetchProfile() {
        return dispatch(fetchProfileAction());
    }

    function logout() {
        return dispatch(logoutAction()).then(() => {
            localStorage.removeItem('access_token');
            router.replace('/');
            router.refresh();
        });
    }

    useEffect(() => {
        initProfileFromLocalStorage();
        if (!profile) {
            fetchProfile();
        }
    }, []);

    return { profile, fetchProfile, logout, isLoading, error };
}