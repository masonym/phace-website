import { useState, useEffect } from 'react';

/**
 * Custom hook that returns whether a media query matches the current viewport
 * @param query The media query to check
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Check if window is defined (to avoid SSR issues)
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Set the initial value
      setMatches(media.matches);

      // Define listener function
      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };

      // Add the listener
      media.addEventListener('change', listener);

      // Clean up
      return () => {
        media.removeEventListener('change', listener);
      };
    }
    
    return undefined;
  }, [query]);

  return matches;
}
