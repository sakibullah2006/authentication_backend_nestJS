export const parseExpirationToMilliseconds = (expirationTime: string): number => {
    const seconds = parseInt(expirationTime.replace(/[^0-9]/g, ''));
    return seconds * 1000;
}