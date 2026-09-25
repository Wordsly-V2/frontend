export interface IUserProfile {
    /** Primary key of the profile row. Do not compare this against a token claim. */
    id: string;
    /**
     * The identity every service scopes by, and the access token's `sub`.
     * This is what device-local data is keyed on and what the offline grace
     * check fingerprints against.
     */
    userLoginId: string;
    gmail: string;
    displayName: string;
    pictureUrl: string;
    /**
     * Authorization roles (e.g. `admin`). Only to show or hide UI: every service
     * checks the access token's own `roles` claim. Missing on profiles cached
     * before roles existed.
     */
    roles?: string[];
}
