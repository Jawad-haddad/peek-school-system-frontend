/**
 * Centralized authentication and session management utilities.
 * Ensures consistent handling of localStorage state and safe parsing.
 */

export function logout(): void {
    if (typeof window !== 'undefined') {
        // Clear all documented tokens and session identity keys
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userRole');
        localStorage.removeItem('user');

        // Hard-redirect to clear all in-memory React states
        window.location.href = '/';
    }
}

/**
 * Safely parses the user object from localStorage.
 * If the JSON is corrupted, it instantly forces a logout to prevent app crashes.
 */
export function getSafeUser(): any | null {
    if (typeof window === 'undefined') return null;

    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;

    try {
        return JSON.parse(storedUser);
    } catch (e) {
        console.error('[Session Guard] Corrupted user payload in localStorage. Forcing session reset.');
        logout();
        return null; // The redirect will halt further client rendering
    }
}
