const CORRECT_MESSAGES = [
    "Nailed it!",
    "That one's sticking.",
    "Nice recall!",
    "You got it.",
    "Solid!",
];

const INCORRECT_MESSAGES = [
    "Close — here's the word again.",
    "Tricky one. You'll see it soon.",
    "Keep going — practice helps.",
    "Not yet — review and move on.",
];

const SESSION_COMPLETE_HIGH = [
    "Excellent work!",
    "Strong session!",
    "You're on a roll!",
];

const SESSION_COMPLETE_MID = [
    "Good practice!",
    "Nice effort today.",
    "Every word counts.",
];

const SESSION_COMPLETE_LOW = [
    "Keep practicing — you're improving.",
    "Tough set — review helps.",
    "Come back tomorrow for a quick win.",
];

function pick<T>(items: T[], seed: number): T {
    return items[Math.abs(seed) % items.length];
}

export function pickCorrectMessage(seed = Date.now()): string {
    return pick(CORRECT_MESSAGES, seed);
}

export function pickIncorrectMessage(seed = Date.now()): string {
    return pick(INCORRECT_MESSAGES, seed);
}

export function pickSessionCompleteMessage(score: number, seed = Date.now()): string {
    if (score >= 80) return pick(SESSION_COMPLETE_HIGH, seed);
    if (score >= 50) return pick(SESSION_COMPLETE_MID, seed);
    return pick(SESSION_COMPLETE_LOW, seed);
}

export function pickMilestoneMessage(streakInSession: number): string | null {
    if (streakInSession === 5) return "5 in a row!";
    if (streakInSession === 10) return "10 streak — amazing!";
    if (streakInSession > 0 && streakInSession % 5 === 0) return `${streakInSession} in a row!`;
    return null;
}
