import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProfile as fetchProfileAction, setProfile as setProfileAction, UserProfile, logout as logoutAction } from '@/store/slices/userSlice';
import { useRouter } from 'next/navigation';

export const useUser = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.user.profile);
    const isLoading = useAppSelector((state) => state.user.isLoading);
    const error = useAppSelector((state) => state.user.error);

    function setProfile(profile: UserProfile) {
        return dispatch(setProfileAction(profile));
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

    return { profile, setProfile, fetchProfile, logout, isLoading, error };
}