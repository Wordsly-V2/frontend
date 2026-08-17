import { clearAuthRedirect } from '@/lib/auth-redirect';
import { clearUserLocalData } from '@/lib/user-local-data';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProfile as fetchProfileAction, logout as logoutAction } from '@/store/slices/userSlice';
import { useRouter } from 'next/navigation';

export const useUser = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.user.profile);
    const isLoading = useAppSelector((state) => state.user.isLoading);
    const error = useAppSelector((state) => state.user.error);

    function fetchProfile() {
        return dispatch(fetchProfileAction());
    }

    /**
     * One navigation, not two: callers used to `router.push` their own
     * destination after this resolved, so signing out left `/` sitting in
     * history between the app and the login page.
     */
    function logout(options?: { allDevices?: boolean; redirectTo?: string }) {
        return dispatch(
            logoutAction({ isLoggedOutFromAllDevices: options?.allDevices }),
        ).then(() => {
            clearUserLocalData();
            clearAuthRedirect();
            // `replace`: the signed-in page behind us is gone, so Back must not
            // return to it.
            router.replace(options?.redirectTo ?? '/');
            router.refresh();
        });
    }

    return { profile, fetchProfile, logout, isLoading, error };
}