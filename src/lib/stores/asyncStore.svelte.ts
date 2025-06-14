/**
 * Generic helper for loading async data while tracking `isLoading` and `error`.
 *
 * Usage:
 * ```ts
 * const { data, isLoading, error, load } = createAsyncStore(async (id: string) => {
 *   // expensive work...
 *   return result;
 * });
 * 
 * // later
 * await load("foo");
 * ```
 */
export function createAsyncStore<T, Args extends unknown[]>(
  loader: (...args: Args) => Promise<T>
) {
  let data = $state<T | null>(null);
  let isLoading = $state(false);
  let error = $state<Error | null>(null);

  async function load(...args: Args): Promise<T | null> {
    isLoading = true;
    error = null;

    try {
      data = await loader(...args);
      return data;
    } catch (err) {
      console.error('createAsyncStore loader error', err);
      error = err instanceof Error ? err : new Error(String(err));
      return null;
    } finally {
      isLoading = false;
    }
  }

  function reset() {
    data = null;
    error = null;
    isLoading = false;
  }

  return {
    get data() { return data; },
    get isLoading() { return isLoading; },
    get error() { return error; },
    load,
    reset,
  } as const;
}

