const BAD_WORDS = [
    "abuse",
    "kill",
    "die",
    "shit",
    "fuck",
    "bitch",
    "asshole",
    "nigger",
    "hell"
];
const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const containsProfanity = (text: string): boolean => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return BAD_WORDS.some((word) => {
        const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
        return regex.test(lowerText);
    });
};

export const getDetectedBadWords = (text: string): string[] => {
    if (!text) return [];

    const lowerText = text.toLowerCase();
    return BAD_WORDS.filter((word) => {
        const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
        return regex.test(lowerText);
    });
};
