import { clearAuthRedirect } from '@/lib/auth-redirect';
import { clearUserLocalData } from '@/lib/user-local-data';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProfile as fetchProfileAction, logout as logoutAction } from '@/store/slices/userSlice';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
        ).then((action) => {
            // Cleared even when the server call failed: the learner asked to
            // leave, and the pending-logout flag the thunk persisted keeps the
            // surviving refresh cookie from signing them back in until the
            // retry on a later load goes through.
            if (logoutAction.rejected.match(action)) {
                toast.warning(
                    "Signed out on this device. We'll finish signing you out when you're back online.",
                );
            }
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