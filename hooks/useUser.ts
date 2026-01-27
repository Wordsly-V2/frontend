import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProfile as fetchProfileAction, setProfile as setProfileAction, UserProfile } from '@/store/slices/userSlice';

export const useUser = () => {
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

    return { profile, setProfile, fetchProfile, isLoading, error };
}