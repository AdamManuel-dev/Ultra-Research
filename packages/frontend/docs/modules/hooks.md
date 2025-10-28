# Custom Hooks Documentation

This guide documents custom React hooks used throughout the Deep Research Cockpit frontend application.

## Table of Contents

- [Overview](#overview)
- [Data Fetching Hooks](#data-fetching-hooks)
- [State Management Hooks](#state-management-hooks)
- [Form Hooks](#form-hooks)
- [UI Hooks](#ui-hooks)
- [Utility Hooks](#utility-hooks)
- [Creating Custom Hooks](#creating-custom-hooks)

## Overview

Custom hooks encapsulate reusable logic and follow React's hooks conventions:

- Names start with `use` prefix
- Can call other hooks
- Return values, functions, or objects
- Follow hooks rules (no conditional calls)

## Data Fetching Hooks

### useFetch

**Status**: Planned

Generic data fetching hook with loading and error states.

```typescript
/**
 * Fetch data from API endpoint
 *
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useFetch<Project[]>('/api/projects');
 *
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * return <ProjectList projects={data} onRefresh={refetch} />;
 * ```
 */
export const useFetch = <T>(
  url: string,
  options?: RequestInit
): UseFetchResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

### useQuery

**Status**: Planned

Enhanced query hook with caching and invalidation.

```typescript
/**
 * Query data with caching and automatic refetching
 *
 * @param queryKey - Unique query identifier
 * @param queryFn - Function that returns promise with data
 * @param options - Query configuration
 * @returns Query state and utilities
 *
 * @example
 * ```tsx
 * const { data, isLoading, refetch } = useQuery(
 *   ['projects', userId],
 *   () => fetchUserProjects(userId),
 *   { staleTime: 5000 }
 * );
 * ```
 */
export const useQuery = <T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: UseQueryOptions
): UseQueryResult<T> => {
  // Implementation with caching logic
};
```

### useMutation

**Status**: Planned

Hook for data mutations with optimistic updates.

```typescript
/**
 * Mutate data with optimistic updates and rollback
 *
 * @param mutationFn - Function that performs mutation
 * @param options - Mutation configuration
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const { mutate, isLoading } = useMutation(
 *   (data: ProjectData) => createProject(data),
 *   {
 *     onSuccess: (newProject) => {
 *       queryClient.invalidateQueries(['projects']);
 *       toast.success('Project created!');
 *     },
 *     onError: (error) => {
 *       toast.error(error.message);
 *     }
 *   }
 * );
 *
 * const handleSubmit = (data: ProjectData) => {
 *   mutate(data);
 * };
 * ```
 */
export const useMutation = <T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options?: UseMutationOptions<T, V>
): UseMutationResult<T, V> => {
  // Implementation
};
```

### useWebSocket

**Status**: Planned

WebSocket connection hook for real-time data.

```typescript
/**
 * Connect to WebSocket and handle messages
 *
 * @param url - WebSocket URL
 * @param options - Connection options
 * @returns Connection state and send function
 *
 * @example
 * ```tsx
 * const { data, connected, send } = useWebSocket('/events', {
 *   onMessage: (event) => console.log('Received:', event),
 *   reconnect: true,
 * });
 *
 * const handleAction = () => {
 *   send({ type: 'ACTION', payload: {} });
 * };
 * ```
 */
export const useWebSocket = <T>(
  url: string,
  options?: WebSocketOptions
): WebSocketResult<T> => {
  // Implementation
};
```

## State Management Hooks

### useAppDispatch

**Status**: Planned

Typed Redux dispatch hook.

```typescript
/**
 * Get typed dispatch function from Redux store
 *
 * @returns Dispatch function
 *
 * @example
 * ```tsx
 * const dispatch = useAppDispatch();
 * dispatch(fetchProjects());
 * ```
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
```

### useAppSelector

**Status**: Planned

Typed Redux selector hook.

```typescript
/**
 * Select data from Redux store with type safety
 *
 * @param selector - State selector function
 * @returns Selected state
 *
 * @example
 * ```tsx
 * const projects = useAppSelector(state => state.projects.items);
 * const loading = useAppSelector(selectProjectsLoading);
 * ```
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### useLocalStorage

**Status**: Planned

Persist state in localStorage with sync across tabs.

```typescript
/**
 * Store state in localStorage with automatic sync
 *
 * @param key - Storage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns State value and setter function
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 *
 * const toggleTheme = () => {
 *   setTheme(theme === 'light' ? 'dark' : 'light');
 * };
 * ```
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  // Implementation with storage event listener
};
```

### useSessionStorage

**Status**: Planned

Similar to useLocalStorage but for session storage.

```typescript
/**
 * Store state in sessionStorage
 *
 * @param key - Storage key
 * @param initialValue - Initial value
 * @returns State value and setter
 */
export const useSessionStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  // Implementation
};
```

## Form Hooks

### useForm

**Status**: Planned

Comprehensive form state management with validation.

```typescript
/**
 * Manage form state with validation and submission
 *
 * @param initialValues - Initial form values
 * @param options - Form configuration
 * @returns Form state and handlers
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   initialValues: { name: '', email: '' },
 *   validationSchema: {
 *     name: (value) => value.length > 0 || 'Name is required',
 *     email: (value) => isValidEmail(value) || 'Invalid email',
 *   },
 *   onSubmit: async (values) => {
 *     await createUser(values);
 *   },
 * });
 *
 * <form onSubmit={form.handleSubmit}>
 *   <input
 *     name="name"
 *     value={form.values.name}
 *     onChange={form.handleChange}
 *     onBlur={form.handleBlur}
 *   />
 *   {form.errors.name && <Error>{form.errors.name}</Error>}
 * </form>
 * ```
 */
export const useForm = <T extends Record<string, unknown>>(
  options: UseFormOptions<T>
): UseFormReturn<T> => {
  // Implementation
};
```

### useFormField

**Status**: Planned

Single form field state management.

```typescript
/**
 * Manage individual form field state
 *
 * @param name - Field name
 * @param options - Field options
 * @returns Field state and handlers
 *
 * @example
 * ```tsx
 * const emailField = useFormField('email', {
 *   initialValue: '',
 *   validate: (value) => isEmail(value),
 *   required: true,
 * });
 *
 * <input {...emailField.props} />
 * ```
 */
export const useFormField = <T>(
  name: string,
  options?: FormFieldOptions<T>
): FormFieldResult<T> => {
  // Implementation
};
```

## UI Hooks

### useModal

**Status**: Planned

Modal state management hook.

```typescript
/**
 * Manage modal open/close state
 *
 * @returns Modal state and controls
 *
 * @example
 * ```tsx
 * const modal = useModal();
 *
 * <Button onClick={modal.open}>Open Modal</Button>
 * <Modal isOpen={modal.isOpen} onClose={modal.close}>
 *   <ModalContent />
 * </Modal>
 * ```
 */
export const useModal = (): UseModalReturn => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
};
```

### useToast

**Status**: Planned

Toast notification management.

```typescript
/**
 * Show toast notifications
 *
 * @returns Toast functions
 *
 * @example
 * ```tsx
 * const toast = useToast();
 *
 * const handleSuccess = () => {
 *   toast.success('Project saved!');
 * };
 *
 * const handleError = (error: Error) => {
 *   toast.error(error.message, { duration: 5000 });
 * };
 * ```
 */
export const useToast = (): ToastFunctions => {
  // Implementation with toast queue
};
```

### useClipboard

**Status**: Planned

Clipboard operations hook.

```typescript
/**
 * Copy text to clipboard
 *
 * @returns Copy function and state
 *
 * @example
 * ```tsx
 * const { copy, copied } = useClipboard();
 *
 * <Button onClick={() => copy(text)}>
 *   {copied ? 'Copied!' : 'Copy'}
 * </Button>
 * ```
 */
export const useClipboard = (timeout = 2000): UseClipboardReturn => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), timeout);
  }, [timeout]);

  return { copy, copied };
};
```

### useMediaQuery

**Status**: Planned

Responsive design hook.

```typescript
/**
 * Match media queries for responsive design
 *
 * @param query - Media query string
 * @returns Whether query matches
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 *
 * return isMobile ? <MobileLayout /> : <DesktopLayout />;
 * ```
 */
export const useMediaQuery = (query: string): boolean => {
  // Implementation with window.matchMedia
};
```

## Utility Hooks

### useDebounce

**Status**: Planned

Debounce value changes.

```typescript
/**
 * Debounce value updates
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 500);
 *
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     fetchResults(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 * ```
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
```

### useThrottle

**Status**: Planned

Throttle value changes.

```typescript
/**
 * Throttle value updates
 *
 * @param value - Value to throttle
 * @param interval - Throttle interval
 * @returns Throttled value
 *
 * @example
 * ```tsx
 * const [scrollY, setScrollY] = useState(0);
 * const throttledScrollY = useThrottle(scrollY, 100);
 * ```
 */
export const useThrottle = <T>(value: T, interval: number): T => {
  // Implementation
};
```

### usePrevious

**Status**: Planned

Track previous value of a variable.

```typescript
/**
 * Get previous value from last render
 *
 * @param value - Current value
 * @returns Previous value
 *
 * @example
 * ```tsx
 * const [count, setCount] = useState(0);
 * const prevCount = usePrevious(count);
 *
 * console.log(`Changed from ${prevCount} to ${count}`);
 * ```
 */
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};
```

### useInterval

**Status**: Planned

Declarative interval hook.

```typescript
/**
 * Run callback on interval
 *
 * @param callback - Function to call
 * @param delay - Interval delay (null to pause)
 *
 * @example
 * ```tsx
 * const [count, setCount] = useState(0);
 * const [isRunning, setIsRunning] = useState(true);
 *
 * useInterval(
 *   () => setCount(count + 1),
 *   isRunning ? 1000 : null
 * );
 * ```
 */
export const useInterval = (
  callback: () => void,
  delay: number | null
): void => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
};
```

### useEventListener

**Status**: Planned

Attach event listeners declaratively.

```typescript
/**
 * Attach event listener to element
 *
 * @param eventName - Event name
 * @param handler - Event handler
 * @param element - Target element (default: window)
 *
 * @example
 * ```tsx
 * const [key, setKey] = useState('');
 *
 * useEventListener('keydown', (e: KeyboardEvent) => {
 *   setKey(e.key);
 * });
 * ```
 */
export const useEventListener = <K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: HTMLElement | Window = window
): void => {
  // Implementation
};
```

### useOnClickOutside

**Status**: Planned

Detect clicks outside element.

```typescript
/**
 * Call handler when clicking outside element
 *
 * @param ref - Element ref
 * @param handler - Click handler
 *
 * @example
 * ```tsx
 * const menuRef = useRef<HTMLDivElement>(null);
 * const [isOpen, setIsOpen] = useState(false);
 *
 * useOnClickOutside(menuRef, () => setIsOpen(false));
 *
 * <div ref={menuRef}>
 *   <Menu isOpen={isOpen} />
 * </div>
 * ```
 */
export const useOnClickOutside = (
  ref: RefObject<HTMLElement>,
  handler: () => void
): void => {
  // Implementation
};
```

## Creating Custom Hooks

### Hook Template

```typescript
/**
 * @fileoverview [Hook name and purpose]
 * @lastmodified [ISO timestamp]
 *
 * Features: [Key capabilities]
 * Main APIs: [Return values and methods]
 * Constraints: [Dependencies, limitations]
 * Patterns: [Usage patterns, best practices]
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * [Hook description]
 *
 * @param param1 - First parameter
 * @param param2 - Second parameter
 * @returns Hook result object
 *
 * @example
 * ```tsx
 * const result = useCustomHook(param1, param2);
 * ```
 */
export const useCustomHook = <T>(
  param1: string,
  param2: number
): UseCustomHookReturn<T> => {
  // State
  const [state, setState] = useState<T | null>(null);

  // Effects
  useEffect(() => {
    // Side effects
  }, [param1, param2]);

  // Callbacks
  const action = useCallback(() => {
    // Action implementation
  }, []);

  // Return API
  return {
    state,
    action,
  };
};

/**
 * Return type for useCustomHook
 */
export interface UseCustomHookReturn<T> {
  /** Current state */
  state: T | null;

  /** Perform action */
  action: () => void;
}
```

### Best Practices

1. **Follow Hooks Rules**:
   - Only call at top level
   - Only call from React functions
   - No conditional hook calls

2. **Memoize Callbacks**:
   - Use `useCallback` for returned functions
   - Prevent unnecessary re-renders

3. **Cleanup Side Effects**:
   - Return cleanup function from `useEffect`
   - Clear timers, subscriptions, listeners

4. **Type Safety**:
   - Use TypeScript generics
   - Define return types explicitly
   - Document parameters with TSDoc

5. **Testing**:
   - Test hooks independently with `@testing-library/react-hooks`
   - Test with real components
   - Cover edge cases and error states

### Testing Custom Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCustomHook } from './useCustomHook';

describe('useCustomHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useCustomHook('param', 42));
    expect(result.current.state).toBeNull();
  });

  it('performs action', () => {
    const { result } = renderHook(() => useCustomHook('param', 42));

    act(() => {
      result.current.action();
    });

    expect(result.current.state).toBeDefined();
  });
});
```

## Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [React Hooks FAQ](https://react.dev/reference/react/hooks)
- [Testing Library - React Hooks](https://react-hooks-testing-library.com/)
- [TypeScript Handbook - Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

---

Last updated: 2025-10-28
