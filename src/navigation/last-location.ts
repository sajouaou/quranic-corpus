const storageKey = 'lastLocation';

// The last place read, such as "2:255". Storage can be unavailable, for example in private windows.
export const loadLastLocation = () => {
    try {
        const location = window.localStorage.getItem(storageKey);
        return location && /^\d+(:\d+)?$/.test(location) ? location : undefined;
    } catch {
        return undefined;
    }
}

export const saveLastLocation = (location: string) => {
    try {
        window.localStorage.setItem(storageKey, location);
    } catch {
        // The place is only a convenience.
    }
}
