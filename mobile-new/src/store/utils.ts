import { StoreApi } from 'zustand';

/**
 * Creates an async action wrapper that handles loading state and errors consistently.
 * Eliminates repetitive try/catch boilerplate in Zustand stores.
 *
 * @example
 * ```ts
 * const fetchData = createAsyncAction(
 *   set,
 *   async () => {
 *     const data = await api.getData();
 *     set({ data });
 *   }
 * );
 * ```
 */
export function createAsyncAction<TState extends { isLoading: boolean }>(
  set: StoreApi<TState>['setState'],
  action: () => Promise<void>,
  options?: {
    /** Custom loading key if different from 'isLoading' */
    loadingKey?: keyof TState;
    /** Called on error before rethrowing */
    onError?: (error: unknown) => void;
  }
): () => Promise<void> {
  const loadingKey = (options?.loadingKey ?? 'isLoading') as keyof TState;

  return async () => {
    set({ [loadingKey]: true } as Partial<TState>);
    try {
      await action();
    } catch (error) {
      options?.onError?.(error);
      throw error;
    } finally {
      set({ [loadingKey]: false } as Partial<TState>);
    }
  };
}

/**
 * Creates an async action with arguments.
 * Use when the action needs parameters.
 *
 * @example
 * ```ts
 * const login = createAsyncActionWithArgs<[string, string]>(
 *   set,
 *   async (email, password) => {
 *     const user = await authApi.login({ email, password });
 *     set({ user, isAuthenticated: true });
 *   }
 * );
 * ```
 */
export function createAsyncActionWithArgs<
  TArgs extends unknown[],
  TState extends { isLoading: boolean }
>(
  set: StoreApi<TState>['setState'],
  action: (...args: TArgs) => Promise<void>,
  options?: {
    loadingKey?: keyof TState;
    onError?: (error: unknown) => void;
  }
): (...args: TArgs) => Promise<void> {
  const loadingKey = (options?.loadingKey ?? 'isLoading') as keyof TState;

  return async (...args: TArgs) => {
    set({ [loadingKey]: true } as Partial<TState>);
    try {
      await action(...args);
    } catch (error) {
      options?.onError?.(error);
      throw error;
    } finally {
      set({ [loadingKey]: false } as Partial<TState>);
    }
  };
}

/**
 * Type-safe state setter helper for partial updates.
 * Useful for complex state updates in async actions.
 */
export type StateSetter<T> = (partial: Partial<T>) => void;
