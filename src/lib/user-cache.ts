/**
 * User Cache
 * Prevents multiple simultaneous calls to getCurrentUser
 */

let userCache: {
  data: any | null;
  timestamp: number;
  promise: Promise<any> | null;
} = {
  data: null,
  timestamp: 0,
  promise: null,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const userCacheManager = {
  /**
   * Get cached user data if still valid
   */
  get(): any | null {
    const now = Date.now();
    if (userCache.data && now - userCache.timestamp < CACHE_DURATION) {
      return userCache.data;
    }
    return null;
  },

  /**
   * Set cached user data
   */
  set(data: any): void {
    userCache.data = data;
    userCache.timestamp = Date.now();
  },

  /**
   * Clear cache
   */
  clear(): void {
    userCache.data = null;
    userCache.timestamp = 0;
    userCache.promise = null;
  },

  /**
   * Get or create promise for ongoing request
   */
  getOrCreatePromise(factory: () => Promise<any>): Promise<any> {
    // If we have a valid cache, return resolved promise
    const cached = this.get();
    if (cached) {
      return Promise.resolve(cached);
    }

    // If there's an ongoing request, return that promise
    if (userCache.promise) {
      return userCache.promise;
    }

    // Create new promise
    userCache.promise = factory()
      .then((data) => {
        this.set(data);
        userCache.promise = null;
        return data;
      })
      .catch((error) => {
        userCache.promise = null;
        throw error;
      });

    return userCache.promise;
  },
};

