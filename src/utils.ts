/**
 * Formats an ISO date string to a human-readable local time string.
 * Ensures UTC strings are correctly converted to the user's local timezone.
 */
export const formatOrderTime = (dateString: string): string => {
    if (!dateString) return '';

    // Ensure the date string is treated as UTC if it doesn't have timezone info
    // Supabase usually returns ISO strings, but sometimes suffixes are missing
    const date = new Date(dateString.endsWith('Z') || dateString.includes('+') ? dateString : `${dateString}Z`);

    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};

/**
 * Generates an optimized image URL with basic caching support.
 * Removes the aggressive cache-busting timestamp.
 */
export const getOptimizedImageUrl = (url: string | undefined, fallbackId?: number): string => {
    if (!url) return `/menu-images/${fallbackId}.jpg`;

    // Remove the ?t= timestamp if it exists to allow browser caching
    const cleanUrl = url.split('?')[0];
    return cleanUrl;
};

/**
 * Simple in-memory cache for API responses
 */
const cache: Record<string, { data: any; expiry: number }> = {};

export const getCachedData = (key: string) => {
    const item = cache[key];
    if (!item) return null;
    if (Date.now() > item.expiry) {
        delete cache[key];
        return null;
    }
    return item.data;
};

export const setCachedData = (key: string, data: any, ttlMinutes = 5) => {
    cache[key] = {
        data,
        expiry: Date.now() + ttlMinutes * 60 * 1000
    };
};
