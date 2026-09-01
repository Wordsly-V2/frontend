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
}
