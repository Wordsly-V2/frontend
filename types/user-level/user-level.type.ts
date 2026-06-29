/** A user's learning level snapshot derived from cumulative XP. */
export interface IUserLevel {
    /** Current numeric level. */
    level: number;
    /** Named rank tier for the level (e.g. "Apprentice"). */
    rank: string;
    /** Cumulative XP earned all-time. */
    totalXp: number;
    /** XP earned within the current level (toward the next). */
    currentLevelXp: number;
    /** Total XP span of the current level. */
    xpForThisLevel: number;
    /** XP still needed to reach the next level. */
    xpToNextLevel: number;
    /** Progress through the current level, 0..100. */
    progress: number;
}
